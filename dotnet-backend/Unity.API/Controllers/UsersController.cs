using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unity.Core.DTOs;
using Unity.Core.Models;
using Unity.Infrastructure.Data;

namespace Unity.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        // Helper
        private async Task<User> GetCurrentUserAsync()
        {
            // 1. JWT Claims 
            var claimId = User.FindFirst("id")?.Value;
            if (!string.IsNullOrEmpty(claimId) && int.TryParse(claimId, out int claimUid))
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == claimUid);
                if (user != null) return user;
            }

            Console.WriteLine($"DEBUG [UsersController.GetCurrentUserAsync]: Resolving current user...");
            if (Request.Headers.TryGetValue("X-Test-User-Id", out var userId))
            {
                Console.WriteLine($"DEBUG [UsersController.GetCurrentUserAsync]: Found X-Test-User-Id header: {userId}");
                if (int.TryParse(userId, out int uid))
                {
                    var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == uid);
                    if (user != null)
                    {
                        Console.WriteLine($"DEBUG [UsersController.GetCurrentUserAsync]: Resolved user from header: {user.FullName} ({user.Id})");
                        return user;
                    }
                }
                Console.WriteLine($"DEBUG [UsersController.GetCurrentUserAsync]: User ID '{userId}' not found in database");
            }
            else
            {
                Console.WriteLine($"DEBUG [UsersController.GetCurrentUserAsync]: No X-Test-User-Id header found");
            }
            // Fallback for dev/offline: Default to Melih (Admin)
            var melih = await _context.Users.FirstOrDefaultAsync(u => u.Username == "melih");
            if (melih != null)
            {
                Console.WriteLine($"DEBUG [UsersController.GetCurrentUserAsync]: Using fallback user Melih: {melih.FullName} ({melih.Id})");
                return melih;
            }
            Console.WriteLine($"DEBUG [UsersController.GetCurrentUserAsync]: Melih not found, using first user or test-user");
            return await _context.Users.FirstOrDefaultAsync() ?? new User { Id = 0, Departments = new List<int>() };
        }

        [HttpGet]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
        {
            var currentUser = await GetCurrentUserAsync();
            Console.WriteLine($"DEBUG [UsersController.GetUsers]: Current user resolved as: {currentUser.FullName} ({currentUser.Id}), Role: {currentUser.Role}");
            var userDeptList = currentUser.Departments ?? new List<int>();

            // Optimisation: For large datasets, use a proper join table for Departments.
            // For now (JSON storage), we fetch all and filter in memory.
            var allUsers = await _context.Users.ToListAsync();
            
            var visibleUsers = allUsers.Where(u => 
                currentUser.Role == "admin" || 
                u.Id == currentUser.Id ||
                (u.Departments != null && u.Departments.Any(d => userDeptList.Contains(d)))
            ).Select(u => new UserDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Email = u.Email,
                    FullName = u.FullName,
                    Role = u.Role,
                    Avatar = u.Avatar,
                    Color = u.Color,
                    Department = u.Departments.FirstOrDefault(),
                    Departments = u.Departments,
                    JobTitle = u.JobTitle
                })
                .ToList();

            return Ok(visibleUsers);
        }
        [HttpPost]
        public async Task<ActionResult<UserDto>> PostUser(CreateUserRequest request)
        {
            try 
            {
                Console.WriteLine($"DEBUG [UsersController.PostUser]: Creation request received for {request.Email}");
                var currentUser = await GetCurrentUserAsync();
                Console.WriteLine($"DEBUG [UsersController.PostUser]: Current user: {currentUser?.FullName} (Role: {currentUser?.Role})");

                if (currentUser.Role != "admin") 
                {
                    Console.WriteLine("DEBUG [UsersController.PostUser]: Forbidden - Current user is not admin.");
                    return Forbid();
                }

                // Check if user already exists
                if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                {
                    Console.WriteLine($"DEBUG [UsersController.PostUser]: Email {request.Email} already exists.");
                    return BadRequest("Bu e-posta adresi zaten kullanımda.");
                }

                var user = new User
                {
                    FullName = request.FullName,
                    Email = request.Email,
                    Role = request.Role,
                    Departments = request.Departments,
                    JobTitle = request.JobTitle,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // Set username as email prefix
                if (string.IsNullOrEmpty(user.Username))
                {
                    user.Username = request.Email.Split('@')[0];
                }

                Console.WriteLine($"DEBUG [UsersController.PostUser]: Saving user to database...");
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
                Console.WriteLine($"DEBUG [UsersController.PostUser]: User created successfully with ID: {user.Id}");

                return Ok(new UserDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    FullName = user.FullName,
                    Role = user.Role,
                    Departments = user.Departments,
                    JobTitle = user.JobTitle
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"CRITICAL ERROR [UsersController.PostUser]: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return StatusCode(500, $"Sunucu hatası: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutUser(int id, User user)
        {
            if (id != user.Id) return BadRequest("ID mismatch");

            var currentUser = await GetCurrentUserAsync();
            
            // Only allow self-update or admin
            if (currentUser.Id != id && currentUser.Role != "admin") return Forbid();

            // Fetch the existing user (tracked)
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (existingUser == null) return NotFound();

            // Update allowed fields
            existingUser.FullName = user.FullName ?? existingUser.FullName;
            existingUser.Email = user.Email ?? existingUser.Email;
            existingUser.Username = user.Username ?? existingUser.Username;
            existingUser.Avatar = user.Avatar; // Allow null to clear
            existingUser.Color = user.Color ?? existingUser.Color;
            existingUser.JobTitle = user.JobTitle ?? existingUser.JobTitle;
            existingUser.UpdatedAt = DateTime.UtcNow;

            // Handle password update if provided
            if (!string.IsNullOrEmpty(user.Password))
            {
                existingUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.Password);
            }

            // Admin-only fields
            if (currentUser.Role == "admin")
            {
                existingUser.Role = user.Role ?? existingUser.Role;
                // Handle departments - accept either DepartmentsJson or Departments list
                if (user.Departments != null && user.Departments.Count > 0)
                {
                    existingUser.Departments = user.Departments;
                }
                else if (!string.IsNullOrEmpty(user.DepartmentsJson) && user.DepartmentsJson != "[]")
                {
                    existingUser.DepartmentsJson = user.DepartmentsJson;
                }
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Users.Any(e => e.Id == id))
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var currentUser = await GetCurrentUserAsync();
            if (currentUser.Role != "admin") return Forbid();

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
