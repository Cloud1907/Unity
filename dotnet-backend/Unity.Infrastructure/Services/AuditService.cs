using System;
using Unity.Core.Helpers;
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
            string userName = "System";
            if (int.TryParse(userId, out int uid) && uid > 0)
            {
                var user = await _context.Users.FindAsync(uid);
                if (user != null) userName = user.FullName;
            }

            var log = new AuditLog
            {
                UserId = userId,
                UserName = userName,
                Action = action,
                EntityName = entity,
                EntityId = entityId,
                Description = description,
                OldValues = oldVal != null ? JsonSerializer.Serialize(oldVal) : null,
                NewValues = newVal != null ? JsonSerializer.Serialize(newVal) : null,
                Timestamp = TimeHelper.Now
            };

            _context.AuditLogs.Add(log);
            await _context.SaveChangesAsync();
        }
    }
}
