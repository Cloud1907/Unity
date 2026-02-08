using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Unity.Core.Models;
using Unity.Infrastructure.Data;

namespace Unity.Infrastructure.Services
{
    public interface IActivityLogger
    {
        Task LogChangeAsync(int userId, string action, string entity, string entityId, string fieldName, object? oldVal, object? newVal, string? traceId = null);
        Task LogDeletionAsync(int userId, string entity, string entityId, object fullObjectBackup, string? traceId = null);
    }

    public class ActivityLogger : IActivityLogger
    {
        private readonly AppDbContext _context;

        public ActivityLogger(AppDbContext context)
        {
            _context = context;
        }

        public async Task LogChangeAsync(int userId, string action, string entity, string entityId, string fieldName, object? oldVal, object? newVal, string? traceId = null)
        {
            // Robust Comparison for DateTime and other types
            if (oldVal is DateTime oldDate && newVal is DateTime newDate)
            {
                if (oldDate == newDate) return;
            }
            else if (Equals(oldVal, newVal)) return;

            string? oldValDisplay = MaskSensitiveData(fieldName, oldVal?.ToString());
            string? newValDisplay = MaskSensitiveData(fieldName, newVal?.ToString());

            // Intelligence: Resolve Display Names (Context-Aware)
            // Example: If field is "Assignee" or "Status", try to get human readable name
            if (fieldName.Contains("Assignee") || fieldName.Contains("UserId") || fieldName.Contains("Owner"))
            {
               oldValDisplay = await ResolveUserName(oldVal);
               newValDisplay = await ResolveUserName(newVal);
            }
            else if (fieldName.Contains("Status") || fieldName.Contains("IsCompleted"))
            {
               oldValDisplay = ResolveStatusName(oldVal);
               newValDisplay = ResolveStatusName(newVal);
            }
            else if (fieldName.Contains("Priority"))
            {
               oldValDisplay = ResolvePriorityName(oldVal);
               newValDisplay = ResolvePriorityName(newVal);
            }
            else if (fieldName.Contains("Date"))
            {
               oldValDisplay = ResolveDateDisplay(oldVal);
               newValDisplay = ResolveDateDisplay(newVal);
            }

            var log = new ActivityLog
            {
                UserId = userId,
                EntityType = entity,
                EntityId = entityId,
                ActionType = action,
                FieldName = fieldName,
                OldValue = MaskSensitiveData(fieldName, oldVal?.ToString()),
                NewValue = MaskSensitiveData(fieldName, newVal?.ToString()),
                OldValueDisplay = oldValDisplay,
                NewValueDisplay = newValDisplay,
                TraceId = traceId,
                LogDate = Unity.Core.Helpers.TimeHelper.Now
            };

            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();
            Console.WriteLine($"[DEBUG] ActivityLogged: {action} on {entity} {entityId} - {fieldName}: {oldValDisplay} -> {newValDisplay}");
        }

        public async Task LogDeletionAsync(int userId, string entity, string entityId, object fullObjectBackup, string? traceId = null)
        {
            var jsonBackup = System.Text.Json.JsonSerializer.Serialize(fullObjectBackup);

            var log = new ActivityLog
            {
                UserId = userId,
                EntityType = entity,
                EntityId = entityId,
                ActionType = "DELETED",
                FieldName = "ALL", // Full object deleted
                OldValue = jsonBackup, // Backup stored here
                NewValue = null,
                OldValueDisplay = $"Deleted {entity} (Backup Saved)",
                NewValueDisplay = null,
                TraceId = traceId,
                LogDate = Unity.Core.Helpers.TimeHelper.Now
            };

            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();
        }

        private string? MaskSensitiveData(string fieldName, string? value)
        {
            if (string.IsNullOrEmpty(value)) return value;
            
            var maskFields = new[] { "Password", "Token", "Secret", "ApiKey", "PasswordHash" };
            if (maskFields.Any(f => fieldName.Contains(f, StringComparison.OrdinalIgnoreCase)))
            {
                return "********";
            }
            return value;
        }

        private string? ResolveStatusName(object? val)
        {
            if (val == null) return null;
            var str = val.ToString();
            return str switch
            {
                "todo" => "Yapılacak",
                "in-progress" => "Devam Ediyor",
                "review" => "İncelemede",
                "done" => "Tamamlandı",
                "stuck" => "Takıldı",
                "True" => "Tamamlandı",
                "False" => "Devam Ediyor",
                _ => str
            };
        }

        private string? ResolvePriorityName(object? val)
        {
            if (val == null) return null;
            var str = val.ToString();
            return str switch
            {
                "low" => "Düşük",
                "medium" => "Orta",
                "high" => "Yüksek",
                "urgent" => "Acil",
                _ => str
            };
        }

        private async Task<string?> ResolveUserName(object? val)
        {
            if (val == null) return null;
            if (int.TryParse(val.ToString(), out int uid))
            {
                var user = await _context.Users.FindAsync(uid);
                return user?.FullName ?? $"User #{uid}";
            }
            return val.ToString();
        }

        private string? ResolveDateDisplay(object? val)
        {
            if (val == null || val.ToString() == "" || val.ToString() == "n/a") return "Yok";
            
            if (val is DateTime dt)
            {
                // Ensure we display in local time
                var local = dt.Kind == DateTimeKind.Utc ? dt.AddHours(3) : dt;
                return local.ToString("dd.MM.yyyy");
            }
            
            if (DateTime.TryParse(val.ToString(), out var parsed))
            {
                var local = parsed.Kind == DateTimeKind.Utc ? parsed.AddHours(3) : parsed;
                return local.ToString("dd.MM.yyyy");
            }
            
            return val.ToString();
        }
    }
}
