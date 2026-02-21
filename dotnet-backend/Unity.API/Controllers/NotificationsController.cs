using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unity.Core.Models;
using Unity.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;

namespace Unity.API.Controllers
{
    [Authorize]
    public class NotificationsController : BaseController
    {
        public NotificationsController(AppDbContext context) : base(context)
        {
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AuditLog>>> GetNotifications()
        {
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            // Filter AuditLogs directly for assignments to this user
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

        [HttpGet("unread-count")]
        public async Task<ActionResult<int>> GetUnreadCount()
        {
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            var lastRead = user.LastNotificationReadAt ?? DateTime.MinValue;

            var count = await _context.AuditLogs
                .Where(l => 
                    l.Action == "ASSIGN_TASK" && 
                    l.Description.StartsWith($"ASSIGNED_TO:{userId}:") &&
                    l.Timestamp > lastRead
                )
                .CountAsync();

            return count;
        }

        [HttpPost("mark-read")]
        public async Task<IActionResult> MarkRead()
        {
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            user.LastNotificationReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok();
        }
    }
}
