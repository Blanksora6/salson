using kahoot.Core.Models;

namespace Kahoot.Core.Models;

public class Quiz
{
    public Guid Id { get; set; }
    public Guid HostId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsPublic { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User Host { get; set; } = null!;
    public ICollection<Question> Questions { get; set; } = new List<Question>();
    public ICollection<GameSession> Sessions { get; set; } = new List<GameSession>();
}