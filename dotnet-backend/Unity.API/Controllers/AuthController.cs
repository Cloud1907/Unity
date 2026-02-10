using Microsoft.AspNetCore.Mvc;
using Unity.Core.Helpers;
using Unity.Infrastructure.Data;
using Unity.Core.Models;
using Unity.Core.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Unity.API;
using Unity.API.Services;

namespace Unity.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly Unity.Infrastructure.Services.IEmailService _emailService;
        private readonly IConfiguration _configuration;
        private const string LogPath = "/tmp/auth_debug.log";


        public AuthController(AppDbContext context, Unity.Infrastructure.Services.IEmailService emailService, IConfiguration configuration)
        {
            _context = context;
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


        private async Task<User> GetCurrentUserToUpdateAsync()
        {
            var claimId = User.FindFirst("id")?.Value
                          ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (int.TryParse(claimId, out int userId))
            {
                var user = await _context.Users
                    .Include(u => u.Departments)
                    .FirstOrDefaultAsync(u => u.Id == userId);
                if (user != null) return user;
            }
            throw new UnauthorizedAccessException("User not found.");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            // Accept email, username, or firstname.lastname for login
            var loginIdentifier = request.Email ?? request.Username ?? "";
            LogToFile($"[AUTH_DEBUG] Login attempt for: '{loginIdentifier}'");

            // Try to find user by email, username, or fullname (with dot separator)
            // Example: "halil.seyhan" should match FullName "Halil Seyhan"
            var user = await _context.Users.AsNoTracking()
                .Include(u => u.Departments)
                .FirstOrDefaultAsync(u =>
                    u.Email == loginIdentifier ||
                    u.Username == loginIdentifier ||
                    u.FullName.ToLower().Replace(" ", ".") == loginIdentifier.ToLower()
                );

            if (user == null)
            {
                LogToFile($"[AUTH_DEBUG] User NOT FOUND for: '{loginIdentifier}'");
                return Unauthorized(new { detail = "Kullanıcı tanımlı değil. Lütfen yönetici ile iletişime geçiniz." });
            }

            LogToFile($"[AUTH_DEBUG] User FOUND: '{user.Username}' (ID: {user.Id}). Verifying password...");

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                LogToFile($"[AUTH_DEBUG] Password MISMATCH for: '{loginIdentifier}'");
                return Unauthorized(new { detail = "Şifre hatalı." });
            }

            LogToFile($"[AUTH_DEBUG] Login SUCCESS for: '{loginIdentifier}' (Name: {user.FullName})");

            var preferences = await _context.UserColumnPreferences
                .FirstOrDefaultAsync(p => p.UserId == user.Id);

            var workspacePreferences = await _context.UserWorkspacePreferences
                .Where(uwp => uwp.UserId == user.Id)
                .OrderBy(uwp => uwp.SortOrder)
                .Select(uwp => new WorkspacePreferenceDto
                {
                    DepartmentId = uwp.DepartmentId,
                    SortOrder = uwp.SortOrder,
                    IsVisible = uwp.IsVisible,
                    IsCollapsed = uwp.IsCollapsed
                })
                .ToListAsync();

            return Ok(new LoginResponse
            {
                AccessToken = GenerateJwtToken(user),
                User = new UserDto
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role,
                    Avatar = user.Avatar,
                    Color = user.Color,
                    JobTitle = user.JobTitle,
                    Gender = user.Gender,
                    Department = user.Departments.Select(d => d.DepartmentId).FirstOrDefault(),
                    Departments = user.Departments.Select(d => d.DepartmentId).ToList(),
                    ColumnPreferences = preferences?.Preferences,
                    SidebarPreferences = preferences?.SidebarPreferences,
                    WorkspacePreferences = workspacePreferences,
                    CreatedAt = user.CreatedAt
                }
            });
        }

        private string GenerateJwtToken(User user)
        {
            var tokenHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
            var key = AppConfig.JwtKey;
            var tokenDescriptor = new Microsoft.IdentityModel.Tokens.SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim("id", user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.Username ?? user.Email),
                    new Claim(ClaimTypes.Role, user.Role ?? "user")
                }),
                Expires = TimeHelper.Now.AddMinutes(30),
                SigningCredentials = new Microsoft.IdentityModel.Tokens.SigningCredentials(new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(key), Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            try
            {
                Console.WriteLine($"DEBUG: UpdateProfile hit. FullName: {request.FullName}, Email: {request.Email}, Avatar: {request.Avatar}");

                if (!ModelState.IsValid)
                {
                    var errors = string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                    Console.WriteLine($"DEBUG: ModelState invalid: {errors}");
                    return BadRequest(new { message = "Geçersiz veri: " + errors });
                }

                var user = await GetCurrentUserToUpdateAsync();

                if (!string.IsNullOrEmpty(request.FullName)) user.FullName = request.FullName;
                if (!string.IsNullOrEmpty(request.Email)) user.Email = request.Email;

                if (!string.IsNullOrEmpty(request.Avatar))
                {
                    // PROTECT AGAINST LARGE AVATARS
                    if (request.Avatar.Length > 50000) // ~37KB limit for Base64 (enough for small thumbnails)
                    {
                        return BadRequest(new { message = "Avatar resmi çok büyük. Lütfen daha küçük bir resim seçin." });
                    }
                    user.Avatar = request.Avatar;
                }

                if (!string.IsNullOrEmpty(request.Color)) user.Color = request.Color;
                if (!string.IsNullOrEmpty(request.Gender)) user.Gender = request.Gender;

                user.UpdatedAt = TimeHelper.Now;
                await _context.SaveChangesAsync();

                var preferences = await _context.UserColumnPreferences.AsNoTracking()
                    .FirstOrDefaultAsync(p => p.UserId == user.Id);

                return Ok(new UserDto
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role,
                    Avatar = user.Avatar,
                    Color = user.Color,
                    JobTitle = user.JobTitle,
                    Gender = user.Gender,
                    Department = user.Departments.Select(d => d.DepartmentId).FirstOrDefault(),
                    Departments = user.Departments.Select(d => d.DepartmentId).ToList(),
                    ColumnPreferences = preferences?.Preferences,
                    SidebarPreferences = preferences?.SidebarPreferences,
                    CreatedAt = user.CreatedAt
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"CRITICAL ERROR in UpdateProfile: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return StatusCode(500, new { message = "Profil güncellenirken sunucu hatası oluştu.", detail = ex.Message });
            }
        }

        [HttpPut("preferences")]
        [Authorize]
        public async Task<IActionResult> UpdatePreferences([FromBody] UpdatePreferencesRequest request)
        {
            var user = await GetCurrentUserToUpdateAsync();
            var preferences = await _context.UserColumnPreferences
                .FirstOrDefaultAsync(p => p.UserId == user.Id);

            if (preferences == null)
            {
                preferences = new UserColumnPreference
                {
                    UserId = user.Id,
                    Preferences = request.ColumnPreferences ?? "{}",
                    CreatedAt = TimeHelper.Now,
                    UpdatedAt = TimeHelper.Now
                };
                _context.UserColumnPreferences.Add(preferences);
            }
            else
            {
                if (!string.IsNullOrEmpty(request.ColumnPreferences))
                {
                    preferences.Preferences = request.ColumnPreferences;
                }
                preferences.UpdatedAt = TimeHelper.Now;
            }

            if (!string.IsNullOrEmpty(request.SidebarPreferences))
            {
                preferences.SidebarPreferences = request.SidebarPreferences;
                preferences.UpdatedAt = TimeHelper.Now;
            }

            // Handle structured WorkspacePreferences
            if (request.WorkspacePreferences != null && request.WorkspacePreferences.Any())
            {
                // Get existing preferences for this user
                var existingPrefs = await _context.UserWorkspacePreferences
                    .Where(uwp => uwp.UserId == user.Id)
                    .ToListAsync();

                foreach (var prefDto in request.WorkspacePreferences)
                {
                    var existing = existingPrefs.FirstOrDefault(e => e.DepartmentId == prefDto.DepartmentId);

                    if (existing != null)
                    {
                        // Update existing
                        existing.SortOrder = prefDto.SortOrder;
                        existing.IsVisible = prefDto.IsVisible;
                        existing.IsCollapsed = prefDto.IsCollapsed;
                        existing.UpdatedAt = TimeHelper.Now;
                    }
                    else
                    {
                        // Create new
                        _context.UserWorkspacePreferences.Add(new UserWorkspacePreference
                        {
                            UserId = user.Id,
                            DepartmentId = prefDto.DepartmentId,
                            SortOrder = prefDto.SortOrder,
                            IsVisible = prefDto.IsVisible,
                            IsCollapsed = prefDto.IsCollapsed,
                            CreatedAt = TimeHelper.Now
                        });
                    }
                }
            }

            await _context.SaveChangesAsync();

            // Return updated workspace preferences
            var updatedWorkspacePrefs = await _context.UserWorkspacePreferences
                .Where(uwp => uwp.UserId == user.Id)
                .OrderBy(uwp => uwp.SortOrder)
                .Select(uwp => new WorkspacePreferenceDto
                {
                    DepartmentId = uwp.DepartmentId,
                    SortOrder = uwp.SortOrder,
                    IsVisible = uwp.IsVisible,
                    IsCollapsed = uwp.IsCollapsed
                })
                .ToListAsync();

            return Ok(new
            {
                message = "Tercihler güncellendi",
                columnPreferences = preferences.Preferences,
                sidebarPreferences = preferences.SidebarPreferences,
                workspacePreferences = updatedWorkspacePrefs
            });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<UserDto>> Me()
        {
            var claimId = User.FindFirst("id")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(claimId, out int userId)) return Unauthorized();

            // Read-Only optimization
            var user = await _context.Users.AsNoTracking()
                .Include(u => u.Departments)
                .FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return Unauthorized();

            var preferences = await _context.UserColumnPreferences.AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == user.Id);

            var workspacePreferences = await _context.UserWorkspacePreferences
                .Where(uwp => uwp.UserId == user.Id)
                .OrderBy(uwp => uwp.SortOrder)
                .Select(uwp => new WorkspacePreferenceDto
                {
                    DepartmentId = uwp.DepartmentId,
                    SortOrder = uwp.SortOrder,
                    IsVisible = uwp.IsVisible,
                    IsCollapsed = uwp.IsCollapsed
                })
                .AsNoTracking()
                .ToListAsync();

            return Ok(new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                Avatar = user.Avatar,
                Color = user.Color,
                JobTitle = user.JobTitle,
                Gender = user.Gender,
                Department = user.Departments.Select(d => d.DepartmentId).FirstOrDefault(),
                Departments = user.Departments.Select(d => d.DepartmentId).ToList(),
                ColumnPreferences = preferences?.Preferences,
                SidebarPreferences = preferences?.SidebarPreferences,
                WorkspacePreferences = workspacePreferences,
                CreatedAt = user.CreatedAt
            });
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var user = await GetCurrentUserToUpdateAsync();

            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            {
                return BadRequest(new { detail = "Mevcut şifre hatalı" });
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.UpdatedAt = TimeHelper.Now;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Şifre başarıyla güncellendi" });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            var identifier = request.Email?.Trim() ?? "";
            LogToFile($"[AUTH_DEBUG] Forgot password request for identifier: '{identifier}'");

            if (string.IsNullOrEmpty(identifier))
            {
                return BadRequest(new { message = "Lütfen e-posta veya kullanıcı adı giriniz." });
            }

            // Enhanced lookup: Check email or username, case-insensitive
            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.Email.ToLower() == identifier.ToLower() ||
                u.Username.ToLower() == identifier.ToLower());

            if (user == null)
            {
                LogToFile($"[AUTH_DEBUG] Forgot password: User NOT FOUND for '{identifier}'");
                return BadRequest(new { message = "Bu bilgilere sahip bir kullanıcı bulunamadı." });
            }

            LogToFile($"[AUTH_DEBUG] Forgot password: User FOUND: {user.FullName} (ID: {user.Id}). Generating temporary password...");

            // Generate temporary password
            var tempPassword = GenerateRandomPassword();
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword);
            await _context.SaveChangesAsync();
            LogToFile($"[AUTH_DEBUG] Forgot password: Password updated in DB for user {user.Id}. Sending email...");

            // Send email
            var emailBody = $@"
                <h3>Şifre Sıfırlama</h3>
                <p>Merhaba {user.FullName},</p>
                <p>Hesabınız için şifre sıfırlama talebi aldık.</p>
                <p>Yeni geçici şifreniz: <strong>{tempPassword}</strong></p>
                <p>Lütfen giriş yaptıktan sonra şifrenizi değiştirin.</p>
                <br>
                <p>Saygılarımızla,<br>Univera Task Management Ekibi</p>";

            try
            {
                await _emailService.SendEmailAsync(user.Email, "Univera Task Management - Yeni Şifreniz", emailBody);
                LogToFile($"[AUTH_DEBUG] Forgot password: Email SENT successfully to {user.Email}");
            }
            catch (Exception ex)
            {
                LogToFile($"[AUTH_DEBUG] Forgot password: Email SEND FAILED for {user.Email}. Error: {ex.Message}");
                if (ex.InnerException != null) LogToFile($"[AUTH_DEBUG] Forgot password: Inner Error: {ex.InnerException.Message}");

                Console.WriteLine($"Email send failed: {ex.Message}");
                return StatusCode(500, new { message = "E-posta gönderilemedi. Lütfen daha sonra tekrar deneyin." });
            }

            return Ok(new { message = "Yeni şifreniz e-posta adresinize gönderildi." });
        }

        private string GenerateRandomPassword()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
            var random = new Random();
            return new string(Enumerable.Repeat(chars, 8)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }

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
                    "Bu görev email şablonu ve magic link sisteminin stabilitesini doğrulamak için otomatik olarak oluşturulmuştur. Eğer bu metni görüyorsanız 'Missing Content' hatası giderilmiş demektir.",
                    "Test Assigner",
                    "Test Group",
                    "Test Project",
                    "Magic Link Test Task",
                    null,
                    "High",
                    TimeHelper.Now.AddDays(3),
                    59, // ProjectId
                    2371, // TaskId
                    null
                );

                // Fetch the created magic link
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
                    type = ex.GetType().Name,
                    stackTrace = ex.StackTrace 
                });
            }
        }

        [HttpPost("magic-login")]
        public async Task<IActionResult> MagicLogin([FromBody] MagicLoginRequest request)
        {
            LogToFile($"[AUTH_DEBUG] Magic Login attempt with token: {request.Token}");

            var magicLink = await _context.MagicLinks
                .Include(m => m.User)
                .ThenInclude(u => u.Departments)
                .FirstOrDefaultAsync(m => m.Token == request.Token);

            if (magicLink == null)
            {
                LogToFile("[AUTH_DEBUG] Magic Link: Token NOT FOUND.");
                return Unauthorized(new { message = "Geçersiz giriş linki." });
            }

            // Grace Period Logic: Allow re-use if first used within the last 15 minutes
            bool isWithinGracePeriod = magicLink.IsUsed && 
                                      magicLink.UsedAt.HasValue && 
                                      (TimeHelper.Now - magicLink.UsedAt.Value).TotalMinutes <= 15;

            if (magicLink.IsUsed && !isWithinGracePeriod)
            {
                LogToFile("[AUTH_DEBUG] Magic Link: Token ALREADY USED (Grace period expired).");
                return Unauthorized(new { message = "Bu link daha önce kullanılmış." });
            }

            if (magicLink.ExpiresAt < TimeHelper.Now)
            {
                LogToFile("[AUTH_DEBUG] Magic Link: Token EXPIRED.");
                return Unauthorized(new { message = "Giriş linkinin süresi dolmuş." });
            }

            // Mark as used if not already marked
            if (!magicLink.IsUsed)
            {
                magicLink.IsUsed = true;
                magicLink.UsedAt = TimeHelper.Now;
                await _context.SaveChangesAsync();
                LogToFile($"[AUTH_DEBUG] Magic Login FIRST USE for user: {magicLink.User.Username}");
            }
            else
            {
                LogToFile($"[AUTH_DEBUG] Magic Login RE-USE (Within Grace Period) for user: {magicLink.User.Username}");
            }

            var user = magicLink.User;

            var preferences = await _context.UserColumnPreferences
                .FirstOrDefaultAsync(p => p.UserId == user.Id);

            var workspacePreferences = await _context.UserWorkspacePreferences
                .Where(uwp => uwp.UserId == user.Id)
                .OrderBy(uwp => uwp.SortOrder)
                .Select(uwp => new WorkspacePreferenceDto
                {
                    DepartmentId = uwp.DepartmentId,
                    SortOrder = uwp.SortOrder,
                    IsVisible = uwp.IsVisible,
                    IsCollapsed = uwp.IsCollapsed
                })
                .ToListAsync();

            return Ok(new MagicLoginResponse
            {
                AccessToken = GenerateJwtToken(user),
                TargetUrl = magicLink.TargetUrl,
                User = new UserDto
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role,
                    Avatar = user.Avatar,
                    Color = user.Color,
                    JobTitle = user.JobTitle,
                    Gender = user.Gender,
                    Department = user.Departments.Select(d => d.DepartmentId).FirstOrDefault(),
                    Departments = user.Departments.Select(d => d.DepartmentId).ToList(),
                    ColumnPreferences = preferences?.Preferences,
                    SidebarPreferences = preferences?.SidebarPreferences,
                    WorkspacePreferences = workspacePreferences,
                    CreatedAt = user.CreatedAt
                }
            });
        }
    }
}



public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; }
    public string NewPassword { get; set; }
}

public class ForgotPasswordRequest
{
    public string Email { get; set; }
}

public class UpdateProfileRequest
{
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? Avatar { get; set; }
    public string? Color { get; set; }
    public string? Gender { get; set; }
}

