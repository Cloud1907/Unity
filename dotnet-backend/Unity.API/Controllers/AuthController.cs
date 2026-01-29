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
        private readonly IEmailService _emailService;

        public AuthController(AppDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
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
                return Unauthorized(new { detail = "Kullanıcı tanımlı değil. Lütfen yönetici ile iletişime geçiniz." });
            }

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return Unauthorized(new { detail = "Şifre hatalı." });
            }

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
                Expires = TimeHelper.Now.AddDays(7),
                SigningCredentials = new Microsoft.IdentityModel.Tokens.SigningCredentials(new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(key), Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
        
        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var user = await GetCurrentUserToUpdateAsync(); 

            if (!string.IsNullOrEmpty(request.FullName)) user.FullName = request.FullName;
            if (!string.IsNullOrEmpty(request.Avatar)) user.Avatar = request.Avatar;
            if (!string.IsNullOrEmpty(request.Color)) user.Color = request.Color;
            if (!string.IsNullOrEmpty(request.Gender)) user.Gender = request.Gender;

            user.UpdatedAt = TimeHelper.Now;
            await _context.SaveChangesAsync();

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
                CreatedAt = user.CreatedAt
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
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
            {
                 return BadRequest(new { message = "Bu e-posta adresiyle kayıtlı üyelik bulunamadı." });
            }

            // Generate temporary password
            var tempPassword = GenerateRandomPassword();
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword);
            await _context.SaveChangesAsync();

            // Send email
            var emailBody = $@"
                <h3>Şifre Sıfırlama</h3>
                <p>Merhaba {user.FullName},</p>
                <p>Hesabınız için şifre sıfırlama talebi aldık.</p>
                <p>Yeni geçici şifreniz: <strong>{tempPassword}</strong></p>
                <p>Lütfen giriş yaptıktan sonra şifrenizi değiştirin.</p>
                <br>
                <p>Saygılarımızla,<br>Unity Ekibi</p>";

            try 
            {
                await _emailService.SendEmailAsync(user.Email, "Unity - Yeni Şifreniz", emailBody);
            }
            catch (Exception ex)
            {
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
}
