using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Unity.Core.DTOs;
using Unity.Core.Helpers;
using Unity.Core.Interfaces;
using Unity.Core.Models;
using Unity.Infrastructure.Data; 

namespace Unity.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        public AuthService(AppDbContext context, IEmailService emailService, IConfiguration configuration)
        {
            _context = context;
            _emailService = emailService;
            _configuration = configuration;
        }

        public async Task<(UserDto? User, string? Token, string? Error)> LoginAsync(LoginRequest request)
        {
             var loginIdentifier = request.Email ?? request.Username ?? "";
             
             // Try to find user by email, username, or fullname
             var user = await _context.Users.AsNoTracking()
                .Include(u => u.Departments)
                .FirstOrDefaultAsync(u =>
                    u.Email == loginIdentifier ||
                    u.Username == loginIdentifier ||
                    u.FullName.Replace(" ", ".") == loginIdentifier
                );
             
             if (user == null)
             {
                 // Normalization fallback (Turkish characters)
                 var normalizedInput = NormalizeTurkishCharacters(loginIdentifier);
                 if (normalizedInput != loginIdentifier)
                 {
                    user = await _context.Users.AsNoTracking()
                        .Include(u => u.Departments)
                        .FirstOrDefaultAsync(u => u.Username == normalizedInput);
                 }
             }

             if (user == null) return (null, null, "Kullanıcı bulunamadı.");

             if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                 return (null, null, "Şifre hatalı.");

             var token = GenerateJwtToken(user);
             var dto = await MapToUserDtoWithPrefs(user);
             
             return (dto, token, null);
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

        public async Task<(UserDto? User, string? Token, string? Error)> MagicLoginAsync(string token)
        {
            var magicLink = await _context.MagicLinks
                .Include(m => m.User).ThenInclude(u => u.Departments)
                .FirstOrDefaultAsync(m => m.Token == token);

            if (magicLink == null) return (null, null, "Geçersiz link.");
            if (magicLink.ExpiresAt < TimeHelper.Now) return (null, null, "Süresi dolmuş.");
            
            // Grace period logic
             bool isWithinGracePeriod = magicLink.IsUsed && magicLink.UsedAt.HasValue && (TimeHelper.Now - magicLink.UsedAt.Value).TotalMinutes <= 15;
            if (magicLink.IsUsed && !isWithinGracePeriod) return (null, null, "Link zaten kullanılmış.");

            if (!magicLink.IsUsed)
            {
                magicLink.IsUsed = true;
                magicLink.UsedAt = TimeHelper.Now;
                await _context.SaveChangesAsync();
            }

            var jwt = GenerateJwtToken(magicLink.User);
            var dto = await MapToUserDtoWithPrefs(magicLink.User);
            return (dto, jwt, null);
        }

         public async Task<(UserDto? User, string? Error)> UpdateProfileAsync(int userId, UpdateProfileRequest request)
        {
            var user = await _context.Users.Include(u => u.Departments).FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return (null, "User not found");

            if (!string.IsNullOrEmpty(request.FullName)) user.FullName = request.FullName;
            if (!string.IsNullOrEmpty(request.Email)) user.Email = request.Email;
            
            if (!string.IsNullOrEmpty(request.Avatar))
            {
                if (request.Avatar.Length < 50000) user.Avatar = request.Avatar;
                else return (null, "Avatar çok büyük");
            }
            
            if (!string.IsNullOrEmpty(request.Color)) user.Color = request.Color;
            if (!string.IsNullOrEmpty(request.Gender)) user.Gender = request.Gender;
             
            user.UpdatedAt = TimeHelper.Now;
            await _context.SaveChangesAsync();

            return (await MapToUserDtoWithPrefs(user), null);
        }

        public async Task<(string? Message, string? Error)> UpdatePreferencesAsync(int userId, UpdatePreferencesRequest request)
        {
            var preferences = await _context.UserColumnPreferences.FirstOrDefaultAsync(p => p.UserId == userId);
            if (preferences == null)
            {
                preferences = new UserColumnPreference
                {
                    UserId = userId,
                    Preferences = request.ColumnPreferences ?? "{}",
                    CreatedAt = TimeHelper.Now,
                    UpdatedAt = TimeHelper.Now
                };
                _context.UserColumnPreferences.Add(preferences);
            }
            else
            {
                if (!string.IsNullOrEmpty(request.ColumnPreferences)) preferences.Preferences = request.ColumnPreferences;
                preferences.UpdatedAt = TimeHelper.Now;
            }

            if (!string.IsNullOrEmpty(request.SidebarPreferences))
            {
                preferences.SidebarPreferences = request.SidebarPreferences;
                preferences.UpdatedAt = TimeHelper.Now;
            }

            if (request.WorkspacePreferences != null && request.WorkspacePreferences.Any())
            {
                var existingPrefs = await _context.UserWorkspacePreferences.Where(uwp => uwp.UserId == userId).ToListAsync();
                foreach (var prefDto in request.WorkspacePreferences)
                {
                    var existing = existingPrefs.FirstOrDefault(e => e.DepartmentId == prefDto.DepartmentId);
                    if (existing != null)
                    {
                        existing.SortOrder = prefDto.SortOrder;
                        existing.IsVisible = prefDto.IsVisible;
                        existing.IsCollapsed = prefDto.IsCollapsed;
                        existing.UpdatedAt = TimeHelper.Now;
                    }
                    else
                    {
                        _context.UserWorkspacePreferences.Add(new UserWorkspacePreference
                        {
                            UserId = userId,
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
            return ("Tercihler güncellendi", null);
        }

        public async Task<(string? Message, string? Error)> ChangePasswordAsync(int userId, ChangePasswordRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return (null, "User not found");

            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
                return (null, "Mevcut şifre hatalı");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.UpdatedAt = TimeHelper.Now;
            await _context.SaveChangesAsync();

            return ("Şifre başarıyla güncellendi", null);
        }

        public async Task<(string? Message, string? Error)> ForgotPasswordAsync(string identifier)
        {
             var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == identifier || u.Username == identifier);
             if (user == null) return (null, "Kullanıcı bulunamadı.");

             var tempPass = GenerateRandomPassword();
             user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPass);
             await _context.SaveChangesAsync();

             var body = $"Yeni geçici şifreniz: {tempPass}";
             // We use TryCatch inside Controller usually, but let's let specific exceptions propagate or handle here
             try {
                await _emailService.SendEmailAsync(user.Email, "Şifre Sıfırlama", body);
             } catch {
                 return (null, "E-posta gönderilemedi.");
             }

             return ("Yeni şifre gönderildi.", null);
        }

        public async Task<UserDto?> GetMeAsync(int userId) {
             var user = await _context.Users.AsNoTracking().Include(u => u.Departments).FirstOrDefaultAsync(u => u.Id == userId);
             return user == null ? null : await MapToUserDtoWithPrefs(user);
        }

        private string GenerateJwtToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Unity.Core.AppConfig.JwtKey;
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim("id", user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.Username ?? user.Email),
                    new Claim(ClaimTypes.Role, user.Role ?? "user")
                }),
                Expires = TimeHelper.Now.AddMinutes(30),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            return tokenHandler.WriteToken(tokenHandler.CreateToken(tokenDescriptor));
        }

        private string GenerateRandomPassword()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
            var random = new Random();
            return new string(Enumerable.Repeat(chars, 8)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }

        private async Task<UserDto> MapToUserDtoWithPrefs(User user)
        {
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

            return new UserDto
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
            };
        }
    }
}
