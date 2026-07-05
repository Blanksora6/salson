using System;
using System.Collections.Generic;
using System.Text;

namespace kahoot.Core.DTOs;

public class CreateQuizDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsPublic { get; set; } = false;
}

public class UpdateQuizDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsPublic { get; set; }
}

public class QuizResponseDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsPublic { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid HostId { get; set; }
    public int QuestionCount { get; set; }
}
public class CreateQuestionDto
{
    public string Text { get; set; } = string.Empty;
    public int OrderIndex { get; set; }
    public int TimeLimitSeconds { get; set; } = 30;
    public int Points { get; set; } = 100;
    public List<CreateAnswerOptionDto> Options { get; set; } = new();
}

public class CreateAnswerOptionDto
{
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int OrderIndex { get; set; }
}

public class UpdateQuestionDto
{
    public string Text { get; set; } = string.Empty;
    public int OrderIndex { get; set; }
    public int TimeLimitSeconds { get; set; }
    public int Points { get; set; }
}

public class UpdateAnswerOptionDto
{
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int OrderIndex { get; set; }
}

public class QuestionResponseDto
{
    public Guid Id { get; set; }
    public Guid QuizId { get; set; }
    public string Text { get; set; } = string.Empty;
    public int OrderIndex { get; set; }
    public int TimeLimitSeconds { get; set; }
    public int Points { get; set; }
    public List<AnswerOptionResponseDto> Options { get; set; } = new();
}

public class AnswerOptionResponseDto
{
    public Guid Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int OrderIndex { get; set; }
}

public class CreateGameSessionDto
{
    public Guid QuizId { get; set; }
}

public class GameSessionResponseDto
{
    public Guid Id { get; set; }
    public Guid QuizId { get; set; }
    public Guid HostId { get; set; }
    public string JoinCode { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public int ParticipantCount { get; set; }
}

public class JoinSessionDto
{
    public string JoinCode { get; set; } = string.Empty;
    public string Nickname { get; set; } = string.Empty;
}

public class ParticipantResponseDto
{
    public Guid Id { get; set; }
    public string Nickname { get; set; } = string.Empty;
    public int TotalScore { get; set; }
}