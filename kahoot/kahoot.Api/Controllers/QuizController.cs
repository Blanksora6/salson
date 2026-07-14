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
[Route("api/[controller]")]
public class QuizController : ControllerBase
{
    private readonly KahootDbContext _db;

    public QuizController(KahootDbContext db)
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

    // GET /api/quiz
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<QuizResponseDto>>> GetAll()
    {
        var userId = await GetCurrentUserIdAsync();
        if (userId == null) return Unauthorized();

        var quizzes = await _db.Quizzes
            .Where(q => q.HostId == userId)
            .Include(q => q.Questions)
            .Select(q => new QuizResponseDto
            {
                Id = q.Id,
                Title = q.Title,
                Description = q.Description,
                IsPublic = q.IsPublic,
                CreatedAt = q.CreatedAt,
                HostId = q.HostId,
                QuestionCount = q.Questions.Count
            })
            .ToListAsync();

        return Ok(quizzes);
    }

    // GET /api/quiz/{id}
    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<QuizResponseDto>> GetById(Guid id)
    {
        var quiz = await _db.Quizzes
            .Include(q => q.Questions)
            .FirstOrDefaultAsync(q => q.Id == id);

        if (quiz == null)
            return NotFound($"Quiz with id {id} not found.");

        return Ok(new QuizResponseDto
        {
            Id = quiz.Id,
            Title = quiz.Title,
            Description = quiz.Description,
            IsPublic = quiz.IsPublic,
            CreatedAt = quiz.CreatedAt,
            HostId = quiz.HostId,
            QuestionCount = quiz.Questions.Count
        });
    }

    // POST /api/quiz
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<QuizResponseDto>> Create(CreateQuizDto dto)
    {
        var userId = await GetCurrentUserIdAsync();
        if (userId == null) return Unauthorized();

        var quiz = new Quiz
        {
            Id = Guid.NewGuid(),
            HostId = userId.Value,
            Title = dto.Title,
            Description = dto.Description,
            IsPublic = dto.IsPublic,
            CreatedAt = DateTime.UtcNow
        };

        _db.Quizzes.Add(quiz);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = quiz.Id }, new QuizResponseDto
        {
            Id = quiz.Id,
            Title = quiz.Title,
            Description = quiz.Description,
            IsPublic = quiz.IsPublic,
            CreatedAt = quiz.CreatedAt,
            HostId = quiz.HostId,
            QuestionCount = 0
        });
    }

    // PUT /api/quiz/{id}
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(Guid id, UpdateQuizDto dto)
    {
        var userId = await GetCurrentUserIdAsync();
        if (userId == null) return Unauthorized();

        var quiz = await _db.Quizzes.FindAsync(id);

        if (quiz == null)
            return NotFound($"Quiz with id {id} not found.");

        if (quiz.HostId != userId)
            return Forbid();

        quiz.Title = dto.Title;
        quiz.Description = dto.Description;
        quiz.IsPublic = dto.IsPublic;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // DELETE /api/quiz/{id}
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = await GetCurrentUserIdAsync();
        if (userId == null) return Unauthorized();

        var quiz = await _db.Quizzes
            .Include(q => q.Questions)
                .ThenInclude(q => q.Options)
            .Include(q => q.Sessions)
                .ThenInclude(s => s.Participants)
                    .ThenInclude(p => p.Answers)
            .FirstOrDefaultAsync(q => q.Id == id);

        if (quiz == null)
            return NotFound($"Quiz with id {id} not found.");

        if (quiz.HostId != userId)
            return Forbid();

        // delete participant answers via sessions
        foreach (var session in quiz.Sessions)
        {
            foreach (var participant in session.Participants)
            {
                _db.ParticipantAnswers.RemoveRange(participant.Answers);
            }
            _db.GameParticipants.RemoveRange(session.Participants);
        }
        _db.GameSessions.RemoveRange(quiz.Sessions);

        // delete participant answers via questions/options
        var questionIds = quiz.Questions.Select(q => q.Id).ToList();
        var optionIds = quiz.Questions
            .SelectMany(q => q.Options)
            .Select(o => o.Id)
            .ToList();

        var remainingAnswers = await _db.ParticipantAnswers
            .Where(a => questionIds.Contains(a.QuestionId) ||
                        optionIds.Contains(a.SelectedOptionId))
            .ToListAsync();
        _db.ParticipantAnswers.RemoveRange(remainingAnswers);

        // delete options and questions
        var options = quiz.Questions.SelectMany(q => q.Options).ToList();
        _db.AnswerOptions.RemoveRange(options);
        _db.Questions.RemoveRange(quiz.Questions);
        _db.Quizzes.Remove(quiz);

        await _db.SaveChangesAsync();
        return NoContent();
    }
}
