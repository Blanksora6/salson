using kahoot.Core.Models;
using kahoot.Infrastructure;
using Kahoot.Core.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace kahoot.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly KahootDbContext _db;

    public AuthController(KahootDbContext db)
    {
        _db = db;
    }

    // GET /api/auth/login
    [HttpGet("login")]
    public IActionResult Login()
    {
        var redirectUrl = Url.Action(nameof(Callback));
        var properties = new AuthenticationProperties { RedirectUri = redirectUrl };
        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    // GET /api/auth/callback
    [HttpGet("callback")]
    public async Task<IActionResult> Callback()
    {
        var result = await HttpContext.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);

        if (!result.Succeeded || result.Principal == null)
            return Unauthorized("Google authentication failed.");

        var googleId = result.Principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var email = result.Principal.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var name = result.Principal.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;

        if (googleId == null || email == null)
            return BadRequest("Missing required claims from Google.");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.GoogleId == googleId);

        if (user == null)
        {
            user = new User
            {
                Id = Guid.NewGuid(),
                GoogleId = googleId,
                Email = email,
                DisplayName = name ?? email,
                CreatedAt = DateTime.UtcNow
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
        }

        // redirect to React dashboard after successful login
        return Redirect("http://localhost:3000/host/dashboard");
    }

    // GET /api/auth/me
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var googleId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (googleId == null)
            return Unauthorized();

        var user = await _db.Users.FirstOrDefaultAsync(u => u.GoogleId == googleId);

        if (user == null)
            return NotFound("User not found.");

        return Ok(new
        {
            user.Id,
            user.Email,
            user.DisplayName,
            user.AvatarUrl
        });
    }

    // POST /api/auth/logout
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Ok(new { message = "Logged out." });
    }
}