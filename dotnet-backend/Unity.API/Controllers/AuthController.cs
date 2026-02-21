using Microsoft.AspNetCore.Mvc;
using Unity.Core.Helpers;
using Unity.Infrastructure.Data;
using Unity.Core.Models;
using Unity.Core.DTOs;
using Unity.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Unity.API;
using Unity.Infrastructure.Services;

namespace Unity.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IEmailService _emailService;
        private readonly AppDbContext _context; // Kept for Test endpoints mostly
        private readonly IConfiguration _configuration;
        private const string LogPath = "/tmp/auth_debug.log";

        public AuthController(IAuthService authService, AppDbContext context, IEmailService emailService, IConfiguration configuration)
        {
            _authService = authService;
            _context = context; // Still needed for Test endpoints if we don't move them
            _emailService = emailService;
            _configuration = configuration;
            LogToFile("--- AuthController Initialized ---");
        }

        private void LogToFile(string message)
        {
            try
            {
                var logMessage = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {message}{Environment.NewLine}";
                System.IO.File.AppendAllText(LogPath, logMessage);
            }
            catch { /* Best effort logging */ }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var result = await _authService.LoginAsync(request);

            if (result.Error != null)
            {
                LogToFile($"[AUTH_DEBUG] Login Fail: {result.Error}");
                return Unauthorized(new { detail = result.Error });
            }

            LogToFile($"[AUTH_DEBUG] Login Success: {result.User.Username}");

            return Ok(new LoginResponse
            {
                AccessToken = result.Token,
                User = result.User
            });
        }

        [HttpPost("magic-login")]
        public async Task<IActionResult> MagicLogin([FromBody] MagicLoginRequest request)
        {
            var result = await _authService.MagicLoginAsync(request.Token);

            if (result.Error != null)
            {
                LogToFile($"[AUTH_DEBUG] Magic Login Fail: {result.Error}");
                return Unauthorized(new { message = result.Error });
            }

            return Ok(new MagicLoginResponse
            {
                AccessToken = result.Token,
                TargetUrl = "/dashboard", // Or fetch from somewhere if stored
                User = result.User
            });
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                return BadRequest(new { message = "Geçersiz veri: " + errors });
            }

            var userId = Int32.Parse(User.FindFirst("id")?.Value ?? "0");
            var result = await _authService.UpdateProfileAsync(userId, request);

            if (result.Error != null) return BadRequest(new { message = result.Error });

            return Ok(result.User);
        }

        [HttpPut("preferences")]
        [Authorize]
        public async Task<IActionResult> UpdatePreferences([FromBody] UpdatePreferencesRequest request)
        {
            var userId = Int32.Parse(User.FindFirst("id")?.Value ?? "0");
            var result = await _authService.UpdatePreferencesAsync(userId, request);

            return Ok(new
            {
                message = result.Message,
                // In a perfect world, we return the updated prefs object, but Frontend expects message + prefs strings
                // For now, let's return just message or re-fetch.
                // The original controller returned updated strings.
                // Let's assume frontend can handle re-fetch or we enhance service to return Dto.
                // Re-implementation in Service returns tuple, let's keep it simple for now.
                columnPreferences = request.ColumnPreferences,
                sidebarPreferences = request.SidebarPreferences,
                workspacePreferences = request.WorkspacePreferences
            });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<UserDto>> Me()
        {
            var claimId = User.FindFirst("id")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(claimId, out int userId)) return Unauthorized();

            var user = await _authService.GetMeAsync(userId);
            if (user == null) return Unauthorized();

            return Ok(user);
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var userId = Int32.Parse(User.FindFirst("id")?.Value ?? "0");
            var result = await _authService.ChangePasswordAsync(userId, request);

            if (result.Error != null) return BadRequest(new { detail = result.Error });

            return Ok(new { message = result.Message });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            var result = await _authService.ForgotPasswordAsync(request.Email ?? "");

            if (result.Error != null) return BadRequest(new { message = result.Error });

            return Ok(new { message = result.Message });
        }


        // DEBUG / TEST METHODS (Kept as is for now, using Context directly is fine for dev-tools)
        
        [HttpGet("test-email-status")]
        public async Task<IActionResult> TestEmailStatus()
        {
            var statusPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "email_status.txt");
            var content = System.IO.File.Exists(statusPath) ? await System.IO.File.ReadAllTextAsync(statusPath) : "No status file found yet.";
            return Ok(new { 
                last_status = content,
                time = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
            });
        }

        [HttpGet("test-email-send")]
        public async Task<IActionResult> TestEmailSendGet()
        {
            return await TestEmailTrigger();
        }

        [HttpPost("test-email-trigger")]
        public async Task<IActionResult> TestEmailTrigger()
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync();
                if (user == null) return BadRequest("No users found");

                await _emailService.SendTaskAssignmentEmailAsync(
                    user.Email,
                    user.FullName,
                    "Bu görev email şablonu ve magic link sisteminin stabilitesini doğrulamak için otomatik olarak oluşturulmuştur.",
                    "Test Assigner",
                    "Test Group",
                    "Test Project",
                    "Magic Link Test Task",
                    null,
                    "High",
                    TimeHelper.Now.AddDays(3),
                    59, 
                    2371, 
                    null
                );

                var latestToken = await _context.MagicLinks
                    .Where(m => m.UserId == user.Id)
                    .OrderByDescending(m => m.CreatedAt)
                    .FirstOrDefaultAsync();

                var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";

                return Ok(new { 
                    message = "Email trigger sent successfully to " + user.Email,
                    latestToken = latestToken?.Token,
                    magicLinkUrl = latestToken != null ? $"{frontendUrl}/magic-login?token={latestToken.Token}" : "Not found"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    error = "Email send failed",
                    message = ex.Message,
                    type = ex.GetType().Name 
                });
            }
        }
        
        private string NormalizeTurkishCharacters(string text)
        {
            if (string.IsNullOrEmpty(text)) return text;
            return text.Replace("İ", "i").Replace("I", "i").Replace("ı", "i")
                       .Replace("Ğ", "g").Replace("ğ", "g")
                       .Replace("Ü", "u").Replace("ü", "u")
                       .Replace("Ş", "s").Replace("ş", "s")
                       .Replace("Ö", "o").Replace("ö", "o")
                       .Replace("Ç", "c").Replace("ç", "c")
                       .ToLowerInvariant();
        }

        private bool ContainsTurkishCharacters(string text)
        {
            if (string.IsNullOrEmpty(text)) return false;
            var turkishChars = new[] { 'ç', 'Ç', 'ğ', 'Ğ', 'ı', 'İ', 'ö', 'Ö', 'ş', 'Ş', 'ü', 'Ü' };
            return text.IndexOfAny(turkishChars) >= 0;
        }
    }
}
