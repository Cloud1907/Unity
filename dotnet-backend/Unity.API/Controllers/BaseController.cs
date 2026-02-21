using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Unity.Core.Models;
using Unity.Infrastructure.Data;

namespace Unity.API.Controllers
{
    /// <summary>
    /// Base controller providing shared authentication and user context logic.
    /// All API controllers should inherit from this to avoid code duplication.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public abstract class BaseController : ControllerBase
    {
        protected readonly AppDbContext _context;

        protected BaseController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Extracts the current user ID from JWT claims.
        /// </summary>
        /// <returns>User ID as integer</returns>
        /// <exception cref="UnauthorizedAccessException">Thrown when token is invalid or missing</exception>
        protected int GetCurrentUserId()
        {
            var claimId = User.FindFirst("id")?.Value
                          ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (int.TryParse(claimId, out int userId))
            {
                return userId;
            }
            throw new UnauthorizedAccessException("Invalid User Token.");
        }

        /// <summary>
        /// Fetches the current user with their department relationships.
        /// </summary>
        /// <returns>User entity with departments loaded</returns>
        /// <exception cref="UnauthorizedAccessException">Thrown when user not found</exception>
        protected async Task<User> GetCurrentUserWithDeptsAsync()
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.AsNoTracking()
                .Include(u => u.Departments)
                .FirstOrDefaultAsync(u => u.Id == userId);

            return user ?? throw new UnauthorizedAccessException("User not found.");
        }
    }
}
