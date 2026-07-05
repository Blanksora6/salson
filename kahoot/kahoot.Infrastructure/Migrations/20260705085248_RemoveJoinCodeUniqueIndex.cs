using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace kahoot.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveJoinCodeUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_GameSessions_JoinCode",
                table: "GameSessions");

            migrationBuilder.CreateIndex(
                name: "IX_GameSessions_JoinCode",
                table: "GameSessions",
                column: "JoinCode");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_GameSessions_JoinCode",
                table: "GameSessions");

            migrationBuilder.CreateIndex(
                name: "IX_GameSessions_JoinCode",
                table: "GameSessions",
                column: "JoinCode",
                unique: true);
        }
    }
}
