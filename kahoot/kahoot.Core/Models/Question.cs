using kahoot.Core.Models;

namespace Kahoot.Core.Models;

public class Question
{
    public Guid Id { get; set; }
    public Guid QuizId { get; set; }
    public string Text { get; set; } = string.Empty;
    public int OrderIndex { get; set; }
    public int TimeLimitSeconds { get; set; } = 30;
    public int Points { get; set; } = 100;

    public Quiz Quiz { get; set; } = null!;
    public ICollection<AnswerOption> Options { get; set; } = new List<AnswerOption>();
    public ICollection<ParticipantAnswer> Answers { get; set; } = new List<ParticipantAnswer>();
}