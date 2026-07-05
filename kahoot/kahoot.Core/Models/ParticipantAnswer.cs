using kahoot.Core.Models;
using Kahoot.Core.Models;

namespace kahoot.Core.Models;

public class ParticipantAnswer
{
    public Guid Id { get; set; }
    public Guid ParticipantId { get; set; }
    public Guid QuestionId { get; set; }
    public Guid SelectedOptionId { get; set; }
    public int AnsweredAtMs { get; set; }
    public int PointsAwarded { get; set; }
    public bool IsCorrect { get; set; }

    public GameParticipant Participant { get; set; } = null!;
    public Question Question { get; set; } = null!;
    public AnswerOption SelectedOption { get; set; } = null!;
}