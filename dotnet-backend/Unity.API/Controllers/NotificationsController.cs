using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unity.Core.Models;
using Unity.Infrastructure.Data;
using System.Security.Claims;

namespace Unity.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificationsController(AppDbContext context)
        {
            _context = context;
        }

        // Helper: Get Current User ID
        private int GetCurrentUserId()
        {


            var claimId = User.FindFirst("id")?.Value 
                          ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (int.TryParse(claimId, out int uid)) return uid;
            
            return 0;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AuditLog>>> GetNotifications()
        {
            // Simple logic: Get last 20 actions that happened in Departments/Workspaces
            // In a pro system, we'd filter by 'EntityId' matching user's Workspace IDs.
            
            var logs = await _context.AuditLogs
                .Where(l => l.EntityName == "Department" || l.EntityName == "Project")
                .OrderByDescending(l => l.Timestamp)
                .Take(20)
                .ToListAsync();

            return logs;
        }
    }
}
