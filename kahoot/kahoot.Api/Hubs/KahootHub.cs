using kahoot.Core.Models;
using kahoot.Infrastructure;
using Kahoot.Core.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace kahoot.Api.Hubs;

public class KahootHub : Hub
{
    private readonly KahootDbContext _db;

    public KahootHub(KahootDbContext db)
    {
        _db = db;
    }

    // called by player to join the lobby
    public async Task JoinSession(string joinCode, string nickname)
    {
        var session = await _db.GameSessions
            .FirstOrDefaultAsync(s =>
                s.JoinCode == joinCode &&
                s.Status == SessionStatus.Lobby);

        if (session == null)
        {
            await Clients.Caller.SendAsync("Error", "Invalid join code or session is not in lobby.");
            return;
        }

        // add player to SignalR group for this session
        await Groups.AddToGroupAsync(Context.ConnectionId, joinCode);

        // save participant to DB
        var participant = new GameParticipant
        {
            Id = Guid.NewGuid(),
            SessionId = session.Id,
            UserId = null,
            Nickname = nickname,
            TotalScore = 0,
            JoinedAt = DateTime.UtcNow
        };

        _db.GameParticipants.Add(participant);
        await _db.SaveChangesAsync();

        // store participantId in connection context for later use
        Context.Items["ParticipantId"] = participant.Id;
        Context.Items["SessionId"] = session.Id;
        Context.Items["JoinCode"] = joinCode;

        // get updated player list
        var players = await _db.GameParticipants
            .Where(p => p.SessionId == session.Id)
            .Select(p => new { p.Id, p.Nickname })
            .ToListAsync();

        // broadcast updated lobby to everyone in the group
        await Clients.Group(joinCode).SendAsync("LobbyUpdated", players);
    }

    // called by host to start the game
    public async Task StartGame(string sessionId)
    {
        var id = Guid.Parse(sessionId);
        var session = await _db.GameSessions
            .Include(s => s.Quiz)
            .ThenInclude(q => q.Questions)
            .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (session == null)
        {
            await Clients.Caller.SendAsync("Error", "Session not found.");
            return;
        }

        session.Status = SessionStatus.Active;
        session.StartedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var questions = session.Quiz.Questions
            .OrderBy(q => q.OrderIndex)
            .ToList();

        if (!questions.Any())
        {
            await Clients.Caller.SendAsync("Error", "Quiz has no questions.");
            return;
        }

        // send first question to everyone in the group
        await SendQuestion(session.JoinCode, questions[0], 0, questions.Count);
    }

    // called by host to advance to next question
    public async Task NextQuestion(string sessionId, int questionIndex)
    {
        var id = Guid.Parse(sessionId);
        var session = await _db.GameSessions
            .Include(s => s.Quiz)
            .ThenInclude(q => q.Questions)
            .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (session == null) return;

        var questions = session.Quiz.Questions
            .OrderBy(q => q.OrderIndex)
            .ToList();

        if (questionIndex >= questions.Count)
        {
            // no more questions — end the game
            await EndGame(sessionId);
            return;
        }

        await SendQuestion(session.JoinCode, questions[questionIndex], questionIndex, questions.Count);
    }

    // called by player to submit an answer
    public async Task SubmitAnswer(string sessionId, string questionId, string selectedOptionId)
    {
        var participantId = Context.Items["ParticipantId"] as Guid?;
        if (participantId == null)
        {
            await Clients.Caller.SendAsync("Error", "Not joined to a session.");
            return;
        }

        var qId = Guid.Parse(questionId);
        var oId = Guid.Parse(selectedOptionId);
        var sId = Guid.Parse(sessionId);

        var question = await _db.Questions
            .Include(q => q.Options)
            .FirstOrDefaultAsync(q => q.Id == qId);

        if (question == null) return;

        var selectedOption = question.Options.FirstOrDefault(o => o.Id == oId);
        if (selectedOption == null) return;

        // check if already answered
        var alreadyAnswered = await _db.ParticipantAnswers
            .AnyAsync(a => a.ParticipantId == participantId && a.QuestionId == qId);

        if (alreadyAnswered) return;

        // calculate points — faster answer = more points
        var isCorrect = selectedOption.IsCorrect;
        var answeredAtMs = (int)(DateTime.UtcNow - DateTime.UtcNow.Date).TotalMilliseconds;
        var pointsAwarded = isCorrect ? question.Points : 0;

        var answer = new ParticipantAnswer
        {
            Id = Guid.NewGuid(),
            ParticipantId = participantId.Value,
            QuestionId = qId,
            SelectedOptionId = oId,
            AnsweredAtMs = answeredAtMs,
            PointsAwarded = pointsAwarded,
            IsCorrect = isCorrect
        };

        _db.ParticipantAnswers.Add(answer);

        // update total score
        var participant = await _db.GameParticipants.FindAsync(participantId.Value);
        if (participant != null)
            participant.TotalScore += pointsAwarded;

        await _db.SaveChangesAsync();

        // tell the player if they were correct
        await Clients.Caller.SendAsync("AnswerResult", new
        {
            IsCorrect = isCorrect,
            PointsAwarded = pointsAwarded,
            TotalScore = participant?.TotalScore ?? 0
        });

        // broadcast updated leaderboard to everyone
        var joinCode = Context.Items["JoinCode"] as string;
        if (joinCode != null)
            await BroadcastLeaderboard(joinCode, sId);
    }

    // called by host to end the game
    public async Task EndGame(string sessionId)
    {
        var id = Guid.Parse(sessionId);
        var session = await _db.GameSessions
            .FirstOrDefaultAsync(s => s.Id == id);

        if (session == null) return;

        session.Status = SessionStatus.Finished;
        session.EndedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await BroadcastLeaderboard(session.JoinCode, id);
        await Clients.Group(session.JoinCode).SendAsync("GameEnded");
    }

    // ── helpers ──────────────────────────────────────────────────────────

    private async Task SendQuestion(string joinCode, Question question, int index, int total)
    {
        var payload = new
        {
            QuestionId = question.Id,
            Text = question.Text,
            TimeLimitSeconds = question.TimeLimitSeconds,
            Points = question.Points,
            QuestionIndex = index,
            TotalQuestions = total,
            Options = question.Options.Select(o => new
            {
                o.Id,
                o.Text,
                o.OrderIndex
                // never send IsCorrect to clients
            })
        };

        await Clients.Group(joinCode).SendAsync("QuestionStarted", payload);
    }

    private async Task BroadcastLeaderboard(string joinCode, Guid sessionId)
    {
        var leaderboard = await _db.GameParticipants
            .Where(p => p.SessionId == sessionId)
            .OrderByDescending(p => p.TotalScore)
            .Select(p => new { p.Nickname, p.TotalScore })
            .ToListAsync();

        await Clients.Group(joinCode).SendAsync("LeaderboardUpdated", leaderboard);
    }
}