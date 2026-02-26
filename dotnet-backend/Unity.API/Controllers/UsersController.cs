using Microsoft.AspNetCore.Authorization;
using Unity.Core.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unity.Core.DTOs;
using Unity.Core.Models;
using Unity.Infrastructure.Data;

namespace Unity.API.Controllers
{
    public class UsersController : BaseController
    {
        public UsersController(AppDbContext context) : base(context)
        {
        }

        [HttpGet]
        [AllowAnonymous] // Verification only
        public async Task<ActionResult<object>> GetUsers(
            [FromQuery] int? workspace_id, 
            [FromQuery] string? mode,
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            // ULTRA-FAST: Skip Departments loading for list view
            // Departments are only needed for filtering, not display
            var query = _context.Users.AsNoTracking()
                .Include(u => u.Departments) // EAGER LOAD
                .AsSplitQuery()              // PREVENT CARTESIAN EXPLOSION
                .Where(u => !u.IsDeleted);

            // Workspace filter - only when explicitly requested
            if (workspace_id.HasValue && workspace_id.Value > 0)
            {
                query = query.Where(u => u.Departments.Any(d => d.DepartmentId == workspace_id.Value));
            }

            // Server-side search
            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim();
                // Simple but effective case-insensitive matching that handles common scenarios
                query = query.Where(u => 
                    u.FullName.Contains(s) || 
                    u.Email.Contains(s) ||
                    u.FullName.ToLower().Contains(s.ToLower()) ||
                    u.Email.ToLower().Contains(s.ToLower()));
            }

            var totalCount = await query.CountAsync();

            // FAST: No Include, just DTO projection
            var userDtos = await query
                .OrderBy(u => u.FullName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Email = u.Email,
                    Username = u.Username,
                    Role = u.Role,
                    Avatar = u.Avatar,
                    Color = u.Color,
                    JobTitle = u.JobTitle,
                    
                    CompanyName = u.CompanyName,
                    TaxOffice = u.TaxOffice,
                    TaxNumber = u.TaxNumber,
                    BillingAddress = u.BillingAddress,
                    StripeCustomerId = u.StripeCustomerId,
                    SubscriptionPlan = u.SubscriptionPlan,
                    SubscriptionEndDate = u.SubscriptionEndDate,

                    // RESTORED: Needed for frontend filterProjectUsers logic
                    Departments = u.Departments.Select(d => d.DepartmentId).ToList(), 
                    Gender = u.Gender,
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync();

            return Ok(new {
                users = userDtos,
                totalCount = totalCount,
                page = page,
                pageSize = pageSize,
                hasMore = (page * pageSize) < totalCount
            });
        }

        [HttpGet("admin")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<AdminUserResponseDto>> GetAllUsersForAdmin([FromQuery] string? search, [FromQuery] string? role)
        {
            var baseQuery = _context.Users.AsNoTracking().Where(u => !u.IsDeleted);

            // 1. Global Stats (independent of filters)
            var totalUsers = await baseQuery.CountAsync();
            var adminCount = await baseQuery.CountAsync(u => u.Role == "admin");
            var memberCount = await baseQuery.CountAsync(u => u.Role == "member");

            // 2. Apply Filters (for the table list)
            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.ToLower();
                // SQL-safe lowercase matching if DB collation allows, otherwise ToLower() is standard in EF Core
                baseQuery = baseQuery.Where(u => u.FullName.ToLower().Contains(search) || u.Email.ToLower().Contains(search));
            }

            if (!string.IsNullOrWhiteSpace(role) && role != "all")
            {
                baseQuery = baseQuery.Where(u => u.Role == role);
            }

            // 3. Fetch Data
            var users = await baseQuery
                .Include(u => u.Departments)
                .ThenInclude(ud => ud.Department)
                .OrderBy(u => u.FullName)
                .ToListAsync();

            var adminUserDtos = users.Select(u => new AdminUserDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Username = u.Username,
                Role = u.Role,
                Avatar = u.Avatar,
                Color = u.Color,
                JobTitle = u.JobTitle,

                CompanyName = u.CompanyName,
                TaxOffice = u.TaxOffice,
                TaxNumber = u.TaxNumber,
                BillingAddress = u.BillingAddress,
                StripeCustomerId = u.StripeCustomerId,
                SubscriptionPlan = u.SubscriptionPlan,
                SubscriptionEndDate = u.SubscriptionEndDate,

                DepartmentNames = u.Departments?
                    .Where(ud => ud.Department != null && !ud.Department.IsDeleted)
                    .Select(ud => ud.Department!.Name)
                    .ToList() ?? new List<string>()
            }).ToList();

            return Ok(new AdminUserResponseDto
            {
                Users = adminUserDtos,
                TotalUsers = totalUsers,
                AdminCount = adminCount,
                MemberCount = memberCount
            });
        }

        [HttpPost]
        public async Task<ActionResult<UserDto>> PostUser(CreateUserRequest request)
        {
            // Initial Auth Check (Manual because endpoint might be used for registration if open, 
            // but strict rules imply Enterprise context where Admin creates users).
            // Assuming Admin-only creation for internal apps.
            // If public registration is needed, [Authorize] should be removed or conditioned.
            // Based on code context (checking currentUser.Role), this is an Admin function.
            
            var userId = GetCurrentUserId();
            var currentUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
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
                CompanyName = request.CompanyName,
                TaxOffice = request.TaxOffice,
                TaxNumber = request.TaxNumber,
                BillingAddress = request.BillingAddress,
                SubscriptionPlan = request.SubscriptionPlan,
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
                CompanyName = user.CompanyName,
                TaxOffice = user.TaxOffice,
                TaxNumber = user.TaxNumber,
                BillingAddress = user.BillingAddress,
                SubscriptionPlan = user.SubscriptionPlan,
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
            // DEBUG STRATEGY: Analyze incoming payload vs existing state

            existingUser.FullName = user.FullName ?? existingUser.FullName;
            existingUser.Email = user.Email ?? existingUser.Email;
            existingUser.Username = user.Username ?? existingUser.Username;
            
            // FIX: Prevent overwrite if incoming avatar is null (Data Protection)
            existingUser.Avatar = user.Avatar ?? existingUser.Avatar; 
            
            existingUser.Color = user.Color ?? existingUser.Color;
            existingUser.JobTitle = user.JobTitle ?? existingUser.JobTitle;

            existingUser.CompanyName = user.CompanyName ?? existingUser.CompanyName;
            existingUser.TaxOffice = user.TaxOffice ?? existingUser.TaxOffice;
            existingUser.TaxNumber = user.TaxNumber ?? existingUser.TaxNumber;
            existingUser.BillingAddress = user.BillingAddress ?? existingUser.BillingAddress;
            existingUser.StripeCustomerId = user.StripeCustomerId ?? existingUser.StripeCustomerId;
            existingUser.SubscriptionPlan = user.SubscriptionPlan ?? existingUser.SubscriptionPlan;
            existingUser.SubscriptionEndDate = user.SubscriptionEndDate ?? existingUser.SubscriptionEndDate;
            
            existingUser.UpdatedAt = TimeHelper.Now;

            if (!string.IsNullOrEmpty(user.Password))
            {
                existingUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.Password);
            }

            // Admin-only fields
            if (string.Equals(currentUser.Role, "admin", StringComparison.OrdinalIgnoreCase))
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
