using System.ComponentModel.DataAnnotations;

namespace kahoot.Core.DTOs;

public class CreateQuizDto
{
    [Required(ErrorMessage = "Quiz title is required.")]
    [MaxLength(200, ErrorMessage = "Title cannot exceed 200 characters.")]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Description cannot exceed 1000 characters.")]
    public string? Description { get; set; }

    public bool IsPublic { get; set; } = false;
}

public class UpdateQuizDto
{
    [Required(ErrorMessage = "Quiz title is required.")]
    [MaxLength(200, ErrorMessage = "Title cannot exceed 200 characters.")]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Description cannot exceed 1000 characters.")]
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
    [Required(ErrorMessage = "Question text is required.")]
    [MaxLength(500, ErrorMessage = "Question text cannot exceed 500 characters.")]
    public string Text { get; set; } = string.Empty;

    public int OrderIndex { get; set; }

    [Range(5, 120, ErrorMessage = "Time limit must be between 5 and 120 seconds.")]
    public int TimeLimitSeconds { get; set; } = 30;

    [Range(0, 10000, ErrorMessage = "Points must be between 0 and 10000.")]
    public int Points { get; set; } = 100;

    [MinLength(2, ErrorMessage = "At least 2 answer options are required.")]
    [MaxLength(4, ErrorMessage = "Maximum 4 answer options allowed.")]
    public List<CreateAnswerOptionDto> Options { get; set; } = new();
}

public class CreateAnswerOptionDto
{
    [Required(ErrorMessage = "Answer option text is required.")]
    [MaxLength(200, ErrorMessage = "Answer option cannot exceed 200 characters.")]
    public string Text { get; set; } = string.Empty;

    public bool IsCorrect { get; set; }
    public int OrderIndex { get; set; }
}

public class UpdateQuestionDto
{
    [Required(ErrorMessage = "Question text is required.")]
    [MaxLength(500, ErrorMessage = "Question text cannot exceed 500 characters.")]
    public string Text { get; set; } = string.Empty;

    public int OrderIndex { get; set; }

    [Range(5, 120, ErrorMessage = "Time limit must be between 5 and 120 seconds.")]
    public int TimeLimitSeconds { get; set; }

    [Range(0, 10000, ErrorMessage = "Points must be between 0 and 10000.")]
    public int Points { get; set; }
}

public class UpdateAnswerOptionDto
{
    [Required(ErrorMessage = "Answer option text is required.")]
    [MaxLength(200, ErrorMessage = "Answer option cannot exceed 200 characters.")]
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
    [Required(ErrorMessage = "Quiz ID is required.")]
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
    [Required(ErrorMessage = "Join code is required.")]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "Join code must be exactly 6 digits.")]
    public string JoinCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "Nickname is required.")]
    [MaxLength(30, ErrorMessage = "Nickname cannot exceed 30 characters.")]
    public string Nickname { get; set; } = string.Empty;
}

public class ParticipantResponseDto
{
    public Guid Id { get; set; }
    public string Nickname { get; set; } = string.Empty;
    public int TotalScore { get; set; }
}