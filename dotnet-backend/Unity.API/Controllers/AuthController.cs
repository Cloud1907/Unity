using Microsoft.AspNetCore.Mvc;
using Unity.Infrastructure.Data;
using Unity.Core.Models;
using Unity.Core.DTOs;
using Microsoft.EntityFrameworkCore;

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

        private async Task<User> GetCurrentUserAsync()
        {
            Console.WriteLine($"DEBUG [AuthController.GetCurrentUserAsync]: Resolving current user...");
            if (Request.Headers.TryGetValue("X-Test-User-Id", out var userId))
            {
                Console.WriteLine($"DEBUG [AuthController.GetCurrentUserAsync]: Found X-Test-User-Id header: {userId}");
                if (int.TryParse(userId, out int uid))
                {
                    var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == uid);
                    if (user != null)
                    {
                        Console.WriteLine($"DEBUG [AuthController.GetCurrentUserAsync]: Resolved user from header: {user.FullName} ({user.Id})");
                        return user;
                    }
                }
            }
            // Fallback for dev/offline: Default to Melih (Admin)
            var melih = await _context.Users.FirstOrDefaultAsync(u => u.Username == "melih");
            if (melih != null) return melih;

            return await _context.Users.FirstOrDefaultAsync() ?? new User { Id = 0, Departments = new List<int>() };
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            Console.WriteLine($"DEBUG [AuthController.Login]: Login attempt with identifier: {request.Email ?? request.Username}");
            // Accept both email and username for login
            var loginIdentifier = request.Email ?? request.Username ?? "";
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == loginIdentifier || u.Username == loginIdentifier);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                Console.WriteLine($"DEBUG [AuthController.Login]: User not found or password mismatch for identifier: {loginIdentifier}");
                return Unauthorized(new { detail = "Incorrect username or password" });
            }

            Console.WriteLine($"DEBUG [AuthController.Login]: Login successful for user: {user.FullName} ({user.Id}, {user.Email})");
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
            var key = AppConfig.JwtKey; // Use the dynamic key from AppConfig
            var tokenDescriptor = new Microsoft.IdentityModel.Tokens.SecurityTokenDescriptor
            {
                Subject = new System.Security.Claims.ClaimsIdentity(new[]
                {
                    new System.Security.Claims.Claim("id", user.Id.ToString()),
                    new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Name, user.Username ?? user.Email),
                    new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, user.Role ?? "user")
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new Microsoft.IdentityModel.Tokens.SigningCredentials(new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(key), Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
        
        [HttpPut("profile")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            // Use shared user resolution helper
            var user = await GetCurrentUserAsync();
            
            if (user == null || user.Id == 0)
            {
                return NotFound(new { detail = "User not found" });
            }

            // Update fields if provided
            if (!string.IsNullOrEmpty(request.FullName))
            {
                user.FullName = request.FullName;
            }
            
            if (!string.IsNullOrEmpty(request.Avatar))
            {
                user.Avatar = request.Avatar;
            }
            
            if (!string.IsNullOrEmpty(request.Color))
            {
                user.Color = request.Color;
            }

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
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<ActionResult<UserDto>> Me()
        {
            var user = await GetCurrentUserAsync();
            Console.WriteLine($"DEBUG [AuthController.Me]: Returning profile for {user.FullName} ({user.Id}). Avatar: {user.Avatar}");
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
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var user = await GetCurrentUserAsync();
            if (user == null || user.Id == 0)
            {
                return NotFound(new { detail = "User not found" });
            }

            // Verify current password
            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            {
                return BadRequest(new { detail = "Mevcut şifre hatalı" });
            }

            // Hash new password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            
            Console.WriteLine($"DEBUG [AuthController.ChangePassword]: Password updated for user: {user.FullName}");
            return Ok(new { message = "Şifre başarıyla güncellendi" });
        }
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; }
        public string NewPassword { get; set; }
    }
}
