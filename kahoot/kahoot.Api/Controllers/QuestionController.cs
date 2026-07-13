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
[Route("api/quizzes/{quizId}/questions")]
public class QuestionController : ControllerBase
{
    private readonly KahootDbContext _db;

    public QuestionController(KahootDbContext db)
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

    private async Task<(Quiz? quiz, ActionResult? error)> GetOwnedQuizAsync(Guid quizId)
    {
        var userId = await GetCurrentUserIdAsync();
        if (userId == null)
            return (null, Unauthorized());

        var quiz = await _db.Quizzes.FirstOrDefaultAsync(q => q.Id == quizId);
        if (quiz == null)
            return (null, NotFound($"Quiz {quizId} not found."));

        if (quiz.HostId != userId)
            return (null, Forbid());

        return (quiz, null);
    }

    // GET /api/quizzes/{quizId}/questions
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<QuestionResponseDto>>> GetAll(Guid quizId)
    {
        var (quiz, error) = await GetOwnedQuizAsync(quizId);
        if (error != null) return error;

        var questions = await _db.Questions
            .Where(q => q.QuizId == quizId)
            .Include(q => q.Options)
            .OrderBy(q => q.OrderIndex)
            .Select(q => new QuestionResponseDto
            {
                Id = q.Id,
                QuizId = q.QuizId,
                Text = q.Text,
                OrderIndex = q.OrderIndex,
                TimeLimitSeconds = q.TimeLimitSeconds,
                Points = q.Points,
                Options = q.Options.OrderBy(o => o.OrderIndex).Select(o => new AnswerOptionResponseDto
                {
                    Id = o.Id,
                    Text = o.Text,
                    IsCorrect = o.IsCorrect,
                    OrderIndex = o.OrderIndex
                }).ToList()
            })
            .ToListAsync();

        return Ok(questions);
    }

    // GET /api/quizzes/{quizId}/questions/{id}
    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<QuestionResponseDto>> GetById(Guid quizId, Guid id)
    {
        var (quiz, error) = await GetOwnedQuizAsync(quizId);
        if (error != null) return error;

        var question = await _db.Questions
            .Include(q => q.Options)
            .FirstOrDefaultAsync(q => q.Id == id && q.QuizId == quizId);

        if (question == null)
            return NotFound($"Question {id} not found in quiz {quizId}.");

        return Ok(new QuestionResponseDto
        {
            Id = question.Id,
            QuizId = question.QuizId,
            Text = question.Text,
            OrderIndex = question.OrderIndex,
            TimeLimitSeconds = question.TimeLimitSeconds,
            Points = question.Points,
            Options = question.Options.OrderBy(o => o.OrderIndex).Select(o => new AnswerOptionResponseDto
            {
                Id = o.Id,
                Text = o.Text,
                IsCorrect = o.IsCorrect,
                OrderIndex = o.OrderIndex
            }).ToList()
        });
    }

    // POST /api/quizzes/{quizId}/questions
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<QuestionResponseDto>> Create(Guid quizId, CreateQuestionDto dto)
    {
        var (quiz, error) = await GetOwnedQuizAsync(quizId);
        if (error != null) return error;

        var question = new Question
        {
            Id = Guid.NewGuid(),
            QuizId = quizId,
            Text = dto.Text,
            OrderIndex = dto.OrderIndex,
            TimeLimitSeconds = dto.TimeLimitSeconds,
            Points = dto.Points,
            Options = dto.Options.Select(o => new AnswerOption
            {
                Id = Guid.NewGuid(),
                Text = o.Text,
                IsCorrect = o.IsCorrect,
                OrderIndex = o.OrderIndex
            }).ToList()
        };

        _db.Questions.Add(question);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { quizId, id = question.Id }, new QuestionResponseDto
        {
            Id = question.Id,
            QuizId = question.QuizId,
            Text = question.Text,
            OrderIndex = question.OrderIndex,
            TimeLimitSeconds = question.TimeLimitSeconds,
            Points = question.Points,
            Options = question.Options.Select(o => new AnswerOptionResponseDto
            {
                Id = o.Id,
                Text = o.Text,
                IsCorrect = o.IsCorrect,
                OrderIndex = o.OrderIndex
            }).ToList()
        });
    }

    // PUT /api/quizzes/{quizId}/questions/{id}
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(Guid quizId, Guid id, UpdateQuestionDto dto)
    {
        var (quiz, error) = await GetOwnedQuizAsync(quizId);
        if (error != null) return error;

        var question = await _db.Questions
            .FirstOrDefaultAsync(q => q.Id == id && q.QuizId == quizId);

        if (question == null)
            return NotFound($"Question {id} not found in quiz {quizId}.");

        question.Text = dto.Text;
        question.OrderIndex = dto.OrderIndex;
        question.TimeLimitSeconds = dto.TimeLimitSeconds;
        question.Points = dto.Points;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // DELETE /api/quizzes/{quizId}/questions/{id}
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid quizId, Guid id)
    {
        var (quiz, error) = await GetOwnedQuizAsync(quizId);
        if (error != null) return error;

        var question = await _db.Questions
            .Include(q => q.Options)
                .ThenInclude(o => o.ParticipantAnswers)
            .Include(q => q.Answers)
            .FirstOrDefaultAsync(q => q.Id == id && q.QuizId == quizId);

        if (question == null)
            return NotFound($"Question {id} not found in quiz {quizId}.");

        foreach (var option in question.Options)
        {
            _db.ParticipantAnswers.RemoveRange(option.ParticipantAnswers);
        }
        _db.ParticipantAnswers.RemoveRange(question.Answers);
        _db.AnswerOptions.RemoveRange(question.Options);
        _db.Questions.Remove(question);

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // PUT /api/quizzes/{quizId}/questions/{questionId}/options/{id}
    [HttpPut("{questionId}/options/{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateOption(Guid quizId, Guid questionId, Guid id, UpdateAnswerOptionDto dto)
    {
        var (quiz, error) = await GetOwnedQuizAsync(quizId);
        if (error != null) return error;

        var option = await _db.AnswerOptions
            .FirstOrDefaultAsync(o => o.Id == id && o.QuestionId == questionId);

        if (option == null)
            return NotFound($"Option {id} not found.");

        option.Text = dto.Text;
        option.IsCorrect = dto.IsCorrect;
        option.OrderIndex = dto.OrderIndex;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // DELETE /api/quizzes/{quizId}/questions/{questionId}/options/{id}
    [HttpDelete("{questionId}/options/{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteOption(Guid quizId, Guid questionId, Guid id)
    {
        var (quiz, error) = await GetOwnedQuizAsync(quizId);
        if (error != null) return error;

        var option = await _db.AnswerOptions
            .FirstOrDefaultAsync(o => o.Id == id && o.QuestionId == questionId);

        if (option == null)
            return NotFound($"Option {id} not found.");

        _db.AnswerOptions.Remove(option);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}