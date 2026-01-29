using Microsoft.AspNetCore.Authorization;
using Unity.Core.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
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

        private int GetCurrentUserId()
        {
            var claimId = User.FindFirst("id")?.Value 
                          ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (int.TryParse(claimId, out int userId))
            {
                return userId;
            }
            throw new UnauthorizedAccessException("Invalid User Token.");
        }

        private async Task<User> GetCurrentUserWithDeptsAsync()
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.AsNoTracking()
                .Include(u => u.Departments)
                .FirstOrDefaultAsync(u => u.Id == userId);
            
            return user ?? throw new UnauthorizedAccessException("User not found.");
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
        {
            var currentUser = await GetCurrentUserWithDeptsAsync();
            var userDepts = currentUser.Departments?.Select(d => d.DepartmentId).ToList() ?? new List<int>();

            // Optimization warning: Fetching all users is okay for small companies (<1000 users), 
            // but for Enterprise scaling (>10k), this should be paginated (skip/take).
            // Keeping list for now to satisfy current frontend requirements.
            
            var allUsers = await _context.Users.AsNoTracking()
                .Include(u => u.Departments)
                .ToListAsync();
            
            // Allow all authenticated users to see the full user directory (Collaboration requirement)
            var visibleUsers = allUsers.Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                FullName = u.FullName,
                Role = u.Role,
                Avatar = u.Avatar,
                Color = u.Color,
                Department = u.Departments.Select(d => d.DepartmentId).FirstOrDefault(),
                Departments = u.Departments.Select(d => d.DepartmentId).ToList(),
                JobTitle = u.JobTitle
            }).ToList();

            return Ok(visibleUsers);
        }

        [HttpPost]
        public async Task<ActionResult<UserDto>> PostUser(CreateUserRequest request)
        {
            // Initial Auth Check (Manual because endpoint might be used for registration if open, 
            // but strict rules imply Enterprise context where Admin creates users).
            // Assuming Admin-only creation for internal apps.
            // If public registration is needed, [Authorize] should be removed or conditioned.
            // Based on code context (checking currentUser.Role), this is an Admin function.
            
            var claimId = User.FindFirst("id")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(claimId)) return Unauthorized();

            var currentUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == int.Parse(claimId));
            if (currentUser == null || currentUser.Role != "admin") return Forbid();

            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest("Bu e-posta adresi zaten kullanımda.");
            }

            var user = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                Role = request.Role,
                Departments = request.Departments?.Select(id => new UserDepartment { DepartmentId = id }).ToList() ?? new List<UserDepartment>(),
                JobTitle = request.JobTitle,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                CreatedAt = TimeHelper.Now,
                UpdatedAt = TimeHelper.Now,
                Username = string.IsNullOrEmpty(request.Username) ? request.Email.Split('@')[0] : request.Username
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role,
                Departments = user.Departments.Select(d => d.DepartmentId).ToList(),
                JobTitle = user.JobTitle,
                Avatar = user.Avatar,
                Color = user.Color,
                Gender = user.Gender
            });
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> PutUser(int id, User user)
        {
            if (id != user.Id) return BadRequest("ID mismatch");

            var currentUser = await GetCurrentUserWithDeptsAsync();
            
            // Only allow self-update or admin
            if (currentUser.Id != id && currentUser.Role != "admin") return Forbid();

            var existingUser = await _context.Users
                .Include(u => u.Departments)
                .FirstOrDefaultAsync(u => u.Id == id);
            if (existingUser == null) return NotFound();

            // Update allowed fields
            existingUser.FullName = user.FullName ?? existingUser.FullName;
            existingUser.Email = user.Email ?? existingUser.Email;
            existingUser.Username = user.Username ?? existingUser.Username;
            existingUser.Avatar = user.Avatar; 
            existingUser.Color = user.Color ?? existingUser.Color;
            existingUser.JobTitle = user.JobTitle ?? existingUser.JobTitle;
            existingUser.UpdatedAt = TimeHelper.Now;

            if (!string.IsNullOrEmpty(user.Password))
            {
                existingUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.Password);
            }

            // Admin-only fields
            if (currentUser.Role == "admin")
            {
                existingUser.Role = user.Role ?? existingUser.Role;
                
                // Safe Update for Departments
                if (user.Departments != null)
                {
                    existingUser.Departments.Clear();
                    foreach (var dept in user.Departments)
                    {
                        // Ensure UserId is set correctly (though EF might handle it via nav prop)
                        dept.UserId = existingUser.Id; 
                        existingUser.Departments.Add(dept);
                    }
                }
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Users.Any(e => e.Id == id)) return NotFound();
                else throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var currentUser = await GetCurrentUserWithDeptsAsync();
            if (currentUser.Role != "admin") return Forbid();

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }

    }
}
