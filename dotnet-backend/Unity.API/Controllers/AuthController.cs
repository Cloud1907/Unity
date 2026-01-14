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
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.ToString());
                if (user != null)
                {
                    Console.WriteLine($"DEBUG [AuthController.GetCurrentUserAsync]: Resolved user from header: {user.FullName} ({user.Id})");
                    return user;
                }
            }
            // Fallback for dev/offline: Default to Melih (Admin)
            var melih = await _context.Users.FirstOrDefaultAsync(u => u.Id == "user-melih");
            if (melih != null) return melih;

            return await _context.Users.FirstOrDefaultAsync() ?? new User { Id = "test-user", Departments = new List<string> { "IT" } };
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
                AccessToken = "dummy_jwt_token_for_now",
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
        
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            // Use shared user resolution helper
            var user = await GetCurrentUserAsync();
            
            if (user == null || user.Id == "test-user")
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
        public async Task<ActionResult<UserDto>> Me()
        {
            var user = await GetCurrentUserAsync();
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
    }
}
