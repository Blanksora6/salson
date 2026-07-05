using kahoot.Core.Models;

namespace Kahoot.Core.Models;

public class User
{
    public Guid Id { get; set; }
    public string GoogleId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Quiz> Quizzes { get; set; } = new List<Quiz>();
    public ICollection<GameSession> HostedSessions { get; set; } = new List<GameSession>();
    public ICollection<GameParticipant> Participations { get; set; } = new List<GameParticipant>();
}