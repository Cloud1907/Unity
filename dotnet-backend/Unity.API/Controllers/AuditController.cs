using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unity.Core.Models;
using Unity.Infrastructure.Data;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Unity.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public class AuditController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuditController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Audit/task/{taskId}
        [HttpGet("task/{taskId}")]
        public async Task<IActionResult> GetTaskLogs(int taskId)
        {
            var task = await _context.Tasks.Include(t => t.Assignees).AsNoTracking().FirstOrDefaultAsync(t => t.Id == taskId);
            if (task == null) return NotFound();

            // Project & Workspace Membership Check (Security Fix)
            var userIdStr = User.FindFirst("id")?.Value;
            if (int.TryParse(userIdStr, out int currentUserId))
            {
                var project = await _context.Projects.AsNoTracking().FirstOrDefaultAsync(p => p.Id == task.ProjectId);
                var isProjectMember = await _context.ProjectMembers
                    .AnyAsync(pm => pm.ProjectId == task.ProjectId && pm.UserId == currentUserId);
                
                var isWorkspaceMember = project != null && await _context.UserDepartments
                    .AnyAsync(ud => ud.DepartmentId == project.DepartmentId && ud.UserId == currentUserId);
                
                var isAdmin = User.IsInRole("admin") || User.IsInRole("Admin");
                var isAssignee = task.Assignees.Any(a => a.UserId == currentUserId);

                if (!isAdmin && !isProjectMember && !isWorkspaceMember && (project != null && project.Owner != currentUserId) && !isAssignee)
                {
                    return StatusCode(403, new { message = "Bu görev loglarını görme yetkiniz yok." });
                }
            }

            var taskIdStr = taskId.ToString();

            // 1. Fetch Legacy Audit Logs
            var legacyLogs = await _context.AuditLogs
                .Where(l => l.EntityName == "Task" && l.EntityId == taskIdStr)
                .Select(l => new
                {
                    Id = "legacy_" + l.Id,
                    Timestamp = l.Timestamp,
                    UserId = l.UserId,
                    UserName = l.UserName,
                    Action = l.Action,
                    Details = l.Description,
                    IsLegacy = true
                })
                .ToListAsync();

            // 2. Fetch New Activity Logs (Task & its Subtasks)
            var subtaskIds = await _context.Subtasks.Where(s => s.TaskId == taskId).Select(s => s.Id.ToString()).ToListAsync();
            
            var activityLogs = await _context.ActivityLogs
                .Include(l => l.User)
                .Where(l => (l.EntityType == "Task" && l.EntityId == taskIdStr) || 
                            (l.EntityType == "Subtask" && subtaskIds.Contains(l.EntityId)))
                .OrderByDescending(l => l.LogDate)
                .ToListAsync();

            var mappedActivity = activityLogs.Select(l => new
            {
                Id = "act_" + l.Id,
                Timestamp = l.LogDate,
                UserId = l.UserId,
                User = l.User != null ? new { l.User.FullName, l.User.Avatar, l.User.Color } : null,
                Action = l.ActionType,
                FieldName = l.FieldName,
                OldValue = l.OldValueDisplay ?? l.OldValue,
                NewValue = l.NewValueDisplay ?? l.NewValue,
                Details = FormatActivityDetails(l),
                IsLegacy = false
            });

            // 3. Combine and Sort
            var allLogs = legacyLogs.Concat(mappedActivity.Cast<object>())
                .OrderByDescending(x => ((dynamic)x).Timestamp)
                .ToList();

            return Ok(allLogs);
        }

        private string FormatActivityDetails(ActivityLog log)
        {
            // Human readable entity names
            string entity = log.EntityType;
            if (entity == "Task") entity = "Görev";
            if (entity == "Subtask") entity = "Alt Görev";

            if (log.ActionType == "CREATE") {
                string val = log.NewValueDisplay ?? log.NewValue ?? "";
                if (!string.IsNullOrEmpty(val)) return $"{entity} oluşturuldu: {val}";
                return $"{entity} oluşturuldu.";
            }

            if (log.ActionType == "COMMENT") {
                return $"Yorum yaptı: \"{log.NewValue}\"";
            }

            if (log.ActionType == "DELETED") return $"{entity} silindi.";
            
            string field = log.FieldName ?? "";
            // Turkish field name mapping
            if (field == "Status") field = "Durum";
            if (field == "Priority") field = "Öncelik";
            if (field == "Title") field = "Başlık";
            if (field == "Assignee" || field == "Assignees") field = "Atanan";
            if (field == "Labels" || field == "Label") field = "Etiket";
            if (field == "StartDate") field = "Başlangıç Tarihi";
            if (field == "DueDate") field = "Bitiş Tarihi";
            if (field == "Description") field = "Açıklama";
            if (field == "TShirtSize") field = "Efor (T-Shirt)";
            if (field == "Progress") field = "İlerleme";

            string oldV = log.OldValueDisplay ?? log.OldValue ?? "";
            string newV = log.NewValueDisplay ?? log.NewValue ?? "";

            if (log.ActionType == "ASSIGN") {
                if (!string.IsNullOrWhiteSpace(newV))
                    return $"{newV} {entity}e atandı.";
                return $"{entity}e atama yapıldı.";
            }

            if (log.ActionType == "UNASSIGN") {
                if (!string.IsNullOrWhiteSpace(oldV))
                    return $"{oldV} {entity}den çıkarıldı.";
                return $"{entity}den atama kaldırıldı.";
            }

            if (log.ActionType == "UPDATE") {
                // Label-specific format
                if ((log.FieldName == "Labels" || log.FieldName == "Label") && !string.IsNullOrWhiteSpace(newV)) {
                    return $"Etiket eklendi: {newV}";
                }
                
                string oldDisplay = string.IsNullOrWhiteSpace(oldV) ? "Yok" : oldV;
                string newDisplay = string.IsNullOrWhiteSpace(newV) ? "Yok" : newV;
                
                if (oldV == "False") oldDisplay = "Yapılacak";
                if (oldV == "True") oldDisplay = "Tamamlandı";
                if (newV == "False") newDisplay = "Yapılacak";
                if (newV == "True") newDisplay = "Tamamlandı";
                
                return $"{field}: {oldDisplay} → {newDisplay}";
            }

            return $"{field}: {oldV} → {newV}";
        }

        // GET: api/Audit/project/{projectId}
        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetProjectLogs(int projectId)
        {
            // Similar logic could be applied here if needed
            var logs = await _context.AuditLogs
                .Where(l => l.EntityName == "Project" && l.EntityId == projectId.ToString())
                .OrderByDescending(l => l.Timestamp)
                .ToListAsync();

            return Ok(logs);
        }
    }
}
