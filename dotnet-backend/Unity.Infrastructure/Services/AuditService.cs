using System;
using System.Text.Json;
using System.Threading.Tasks;
using Unity.Core.Models;
using Unity.Infrastructure.Data;

namespace Unity.Infrastructure.Services
{
    public interface IAuditService
    {
        Task LogAsync(string userId, string action, string entity, string entityId, object? oldVal, object? newVal, string description);
    }

    public class AuditService : IAuditService
    {
        private readonly AppDbContext _context;

        public AuditService(AppDbContext context)
        {
            _context = context;
        }

        public async Task LogAsync(string userId, string action, string entity, string entityId, object? oldVal, object? newVal, string description)
        {
            var log = new AuditLog
            {
                UserId = userId,
                // In a real app, we'd fetch the user's name or cache it. For now leaving empty or "Unknown"
                UserName = "System", // TODO: Fetch name
                Action = action,
                EntityName = entity,
                EntityId = entityId,
                Description = description,
                OldValues = oldVal != null ? JsonSerializer.Serialize(oldVal) : null,
                NewValues = newVal != null ? JsonSerializer.Serialize(newVal) : null,
                Timestamp = DateTime.UtcNow
            };

            _context.AuditLogs.Add(log);
            await _context.SaveChangesAsync();
        }
    }
}
