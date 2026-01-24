using Microsoft.AspNetCore.Mvc;
using Unity.Infrastructure.Data;
using Unity.Core.Models;
using Unity.Core.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Unity.API;

namespace Unity.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        private async Task<User> GetCurrentUserToUpdateAsync()
        {
            var claimId = User.FindFirst("id")?.Value 
                          ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (int.TryParse(claimId, out int userId))
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
                if (user != null) return user;
            }
            throw new UnauthorizedAccessException("User not found.");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            // Accept both email and username for login
            var loginIdentifier = request.Email ?? request.Username ?? "";
            
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == loginIdentifier || u.Username == loginIdentifier);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                // Enterprise Security: Don't reveal if user exists or password failed.
                return Unauthorized(new { detail = "Kullanıcı adı veya şifre hatalı." });
            }

            return Ok(new LoginResponse
            {
                AccessToken = GenerateJwtToken(user),
                User = new UserDto
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    Role = user.Role,
                    Avatar = user.Avatar,
                    Department = user.Departments.FirstOrDefault(),
                    Departments = user.Departments
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
                Expires = DateTime.UtcNow.AddDays(7),
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

            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                Avatar = user.Avatar,
                Department = user.Departments.FirstOrDefault(),
                Departments = user.Departments
            });
        }
        
        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<UserDto>> Me()
        {
            var claimId = User.FindFirst("id")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(claimId, out int userId)) return Unauthorized();

            // Read-Only optimization
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return Unauthorized();

            return Ok(new UserDto 
            { 
                Id = user.Id,
                FullName = user.FullName, 
                Email = user.Email, 
                Role = user.Role,
                Avatar = user.Avatar,
                Department = user.Departments.FirstOrDefault(),
                Departments = user.Departments
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
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            
            return Ok(new { message = "Şifre başarıyla güncellendi" });
        }
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; }
        public string NewPassword { get; set; }
    }
}
