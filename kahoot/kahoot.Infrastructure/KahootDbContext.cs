using kahoot.Core.Models;
using Kahoot.Core.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace kahoot.Infrastructure;

public class KahootDbContext : DbContext
{
    public KahootDbContext(DbContextOptions<KahootDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Quiz> Quizzes => Set<Quiz>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<AnswerOption> AnswerOptions => Set<AnswerOption>();
    public DbSet<GameSession> GameSessions => Set<GameSession>();
    public DbSet<GameParticipant> GameParticipants => Set<GameParticipant>();
    public DbSet<ParticipantAnswer> ParticipantAnswers => Set<ParticipantAnswer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // disable cascade delete globally to prevent multiple cascade path error
        foreach (var relationship in modelBuilder.Model.GetEntityTypes()
            .SelectMany(e => e.GetForeignKeys()))
        {
            relationship.DeleteBehavior = DeleteBehavior.Restrict;
        }

        modelBuilder.Entity<User>(e => {
            e.HasIndex(u => u.GoogleId).IsUnique();
            e.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<GameSession>(e => {
            e.HasIndex(s => s.JoinCode); // not unique — uniqueness enforced in code
            e.Property(s => s.Status).HasConversion<string>();
        });

        modelBuilder.Entity<GameParticipant>(e => {
            e.HasOne(p => p.User)
             .WithMany(u => u.Participations)
             .HasForeignKey(p => p.UserId)
             .IsRequired(false)
             .OnDelete(DeleteBehavior.Restrict);
        });
    }
}