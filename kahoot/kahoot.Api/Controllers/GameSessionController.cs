using kahoot.Core.DTOs;
using kahoot.Core.Models;
using kahoot.Infrastructure;
using Kahoot.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace kahoot.Api.Controllers;

[ApiController]
[Route("api/sessions")]
public class GameSessionController : ControllerBase
{
    private readonly KahootDbContext _db;

    public GameSessionController(KahootDbContext db)
    {
        _db = db;
    }

    private async Task<Guid?> GetCurrentUserIdAsync()
    {
        var googleId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (googleId == null) return null;
        var user = await _db.Users.FirstOrDefaultAsync(u => u.GoogleId == googleId);
        return user?.Id;
    }

    private async Task<string> GenerateUniqueJoinCodeAsync()
    {
        var random = new Random();
        string code;
        bool exists;

        do
        {
            // 6-digit numeric code like real Kahoot
            code = random.Next(100000, 999999).ToString();

            // only check against sessions that are still active
            exists = await _db.GameSessions.AnyAsync(s =>
                s.JoinCode == code &&
                (s.Status == SessionStatus.Lobby || s.Status == SessionStatus.Active));

        } while (exists);

        return code;
    }

    // POST /api/sessions
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<GameSessionResponseDto>> Create(CreateGameSessionDto dto)
    {
        var userId = await GetCurrentUserIdAsync();
        if (userId == null) return Unauthorized();

        var quiz = await _db.Quizzes.FirstOrDefaultAsync(q => q.Id == dto.QuizId);
        if (quiz == null)
            return NotFound($"Quiz {dto.QuizId} not found.");

        if (quiz.HostId != userId)
            return Forbid();

        var joinCode = await GenerateUniqueJoinCodeAsync();

        var session = new GameSession
        {
            Id = Guid.NewGuid(),
            QuizId = dto.QuizId,
            HostId = userId.Value,
            JoinCode = joinCode,
            Status = SessionStatus.Lobby,
        };

        _db.GameSessions.Add(session);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = session.Id }, new GameSessionResponseDto
        {
            Id = session.Id,
            QuizId = session.QuizId,
            HostId = session.HostId,
            JoinCode = session.JoinCode,
            Status = session.Status.ToString(),
            ParticipantCount = 0
        });
    }

    // GET /api/sessions/{id}
    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<GameSessionResponseDto>> GetById(Guid id)
    {
        var session = await _db.GameSessions
            .Include(s => s.Participants)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (session == null)
            return NotFound($"Session {id} not found.");

        return Ok(new GameSessionResponseDto
        {
            Id = session.Id,
            QuizId = session.QuizId,
            HostId = session.HostId,
            JoinCode = session.JoinCode,
            Status = session.Status.ToString(),
            StartedAt = session.StartedAt,
            EndedAt = session.EndedAt,
            ParticipantCount = session.Participants.Count
        });
    }

    // POST /api/sessions/join
    [HttpPost("join")]
    public async Task<ActionResult<ParticipantResponseDto>> Join(JoinSessionDto dto)
    {
        var session = await _db.GameSessions
            .FirstOrDefaultAsync(s =>
                s.JoinCode == dto.JoinCode &&
                s.Status == SessionStatus.Lobby);

        if (session == null)
            return NotFound("Invalid join code or session is not accepting players.");

        // get logged-in user id if available — null for guests
        Guid? userId = null;
        var googleId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (googleId != null)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.GoogleId == googleId);
            userId = user?.Id;
        }

        var participant = new GameParticipant
        {
            Id = Guid.NewGuid(),
            SessionId = session.Id,
            UserId = userId,
            Nickname = dto.Nickname,
            TotalScore = 0,
            JoinedAt = DateTime.UtcNow
        };

        _db.GameParticipants.Add(participant);
        await _db.SaveChangesAsync();

        return Ok(new ParticipantResponseDto
        {
            Id = participant.Id,
            Nickname = participant.Nickname,
            TotalScore = participant.TotalScore
        });
    }

    // GET /api/sessions/{id}/results
    [HttpGet("{id}/results")]
    [Authorize]
    public async Task<ActionResult<List<ParticipantResponseDto>>> GetResults(Guid id)
    {
        var session = await _db.GameSessions
            .Include(s => s.Participants)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (session == null)
            return NotFound($"Session {id} not found.");

        var results = session.Participants
            .OrderByDescending(p => p.TotalScore)
            .Select(p => new ParticipantResponseDto
            {
                Id = p.Id,
                Nickname = p.Nickname,
                TotalScore = p.TotalScore
            })
            .ToList();

        return Ok(results);
    }
}