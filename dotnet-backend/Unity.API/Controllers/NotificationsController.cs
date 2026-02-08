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
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            // 1. Get IDs of tasks user is involved in (Creator or Assignee)
            var involvedTaskIds = await _context.Tasks
                .Where(t => t.CreatedBy == userId || t.Assignees.Any(a => a.UserId == userId))
                .Select(t => t.Id.ToString())
                .ToListAsync();

            // 2. Get IDs of projects user is a member of
            var involvedProjectIds = await _context.ProjectMembers
                .Where(m => m.UserId == userId)
                .Select(m => m.ProjectId.ToString())
                .ToListAsync();

            // 3. Filter AuditLogs:
            // - Related to user's tasks
            // - Related to user's projects
            // - Performed by someone else (optional refinement, but let's show all relevant for now as requested)
            
            var logs = await _context.AuditLogs
                .Where(l => 
                    l.Action == "ASSIGN_TASK" && 
                    l.Description.StartsWith($"ASSIGNED_TO:{userId}:")
                )
                .OrderByDescending(l => l.Timestamp)
                .Take(25)
                .ToListAsync();

            // Clean up description for frontend
            foreach(var log in logs) {
                var parts = log.Description.Split(':', 3);
                if (parts.Length == 3) {
                    log.Description = $"Size bir görev atandı: {parts[2]} ({log.UserName} tarafından)";
                }
            }

            return logs;
        }
    }
}
