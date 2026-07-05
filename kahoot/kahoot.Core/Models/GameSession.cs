using kahoot.Core.Models;

namespace Kahoot.Core.Models;

public enum SessionStatus { Lobby, Active, Finished, Abandoned }

public class GameSession
{
    public Guid Id { get; set; }
    public Guid QuizId { get; set; }
    public Guid HostId { get; set; }
    public string JoinCode { get; set; } = string.Empty;
    public SessionStatus Status { get; set; } = SessionStatus.Lobby;
    public DateTime? StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }

    public Quiz Quiz { get; set; } = null!;
    public User Host { get; set; } = null!;
    public ICollection<GameParticipant> Participants { get; set; } = new List<GameParticipant>();
}