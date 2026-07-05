using kahoot.Core.Models;

namespace Kahoot.Core.Models;

public class GameParticipant
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public Guid? UserId { get; set; }
    public string Nickname { get; set; } = string.Empty;
    public int TotalScore { get; set; } = 0;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public GameSession Session { get; set; } = null!;
    public User? User { get; set; }
    public ICollection<ParticipantAnswer> Answers { get; set; } = new List<ParticipantAnswer>();
}