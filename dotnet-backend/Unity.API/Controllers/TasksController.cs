using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Unity.API.Hubs;
using Unity.Core.DTOs;
using Unity.Core.Models;
using Unity.Infrastructure.Data;
using Microsoft.Extensions.DependencyInjection;
using Unity.Core.Interfaces;
using Unity.Core.DTOs.Dashboard;
using Unity.Infrastructure.Services;
using Unity.Core.Helpers;
using Microsoft.EntityFrameworkCore;

namespace Unity.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class TasksController : BaseController
    {
        private readonly ITaskService _taskService;
        private readonly IAuditService _auditService;
        private readonly IActivityLogger _activityLogger;
        private readonly IHubContext<AppHub> _hubContext;
        private readonly IEmailService _emailService;
        private readonly IServiceScopeFactory _scopeFactory;

        public TasksController(
            AppDbContext context, 
            ITaskService taskService,
            IAuditService auditService, 
            IActivityLogger activityLogger, 
            IHubContext<AppHub> hubContext, 
            IEmailService emailService, 
            IServiceScopeFactory scopeFactory) : base(context)
        {
            _taskService = taskService;
            _auditService = auditService;
            _activityLogger = activityLogger;
            _hubContext = hubContext;
            _emailService = emailService;
            _scopeFactory = scopeFactory;
        }

        [HttpGet("dashboard/stats")]
        public async Task<ActionResult<DashboardStatsDto>> GetDashboardStats()
        {
            var userId = Int32.Parse(User.FindFirst("id")?.Value ?? "0");
            var stats = await _taskService.GetDashboardStatsAsync(userId);
            return Ok(stats);
        }

        [HttpGet("dashboard/tasks")]
        public async Task<ActionResult<PaginatedTasksResponse>> GetDashboardTasks([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var userId = Int32.Parse(User.FindFirst("id")?.Value ?? "0");
            var result = await _taskService.GetDashboardTasksAsync(userId, page, pageSize);
            return Ok(result);
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedTasksResponse>> GetTasks(
            [FromQuery] int? projectId,
            [FromQuery] string? status,
            [FromQuery] int? assignedTo,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 500)
        {
            if (projectId.HasValue)
            {
                var currentUser = await GetCurrentUserWithDeptsAsync();
                var userDepts = currentUser.Departments?.Select(d => d.DepartmentId).ToList() ?? new List<int>();
                var projectService = HttpContext.RequestServices.GetRequiredService<IProjectService>();
                
                var project = await projectService.GetProjectByIdAsync(projectId.Value, currentUser.Id, currentUser.Role ?? "", userDepts);
                if (project == null)
                {
                    return StatusCode(403, new { message = "Bu projeyi görüntüleme yetkiniz bulunmuyor." });
                }
            }

            var result = await _taskService.GetTasksAsync(projectId, status, assignedTo, page, pageSize);
            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<TaskItem>> GetTask(int id)
        {
            var task = await _taskService.GetTaskByIdAsync(id);
            if (task == null) return NotFound();
            return Ok(task);
        }

        [HttpPost]
        public async Task<ActionResult<TaskItemDto>> PostTask([FromBody] TaskCreateDto dto)
        {
            if (string.IsNullOrEmpty(dto.Title)) return BadRequest(new { message = "Başlık (Title) zorunludur." });
            if (dto.ProjectId == 0) return BadRequest(new { message = "Proje seçimi zorunludur." });

            var currentUser = await GetCurrentUserWithDeptsAsync();
            var taskDto = await _taskService.CreateTaskAsync(dto, currentUser.Id);

            // Side Effects
            await _hubContext.Clients.All.SendAsync("TaskCreated", taskDto);

            // Activity Log
            await _activityLogger.LogChangeAsync(
                 currentUser.Id, 
                 "create", 
                 "Task", 
                 taskDto.Id.ToString(), 
                 "All", 
                 null, 
                 taskDto
             );

            // Trigger Emails (Safe fire-and-forget wrapper)
            if (taskDto.AssigneeIds != null && taskDto.AssigneeIds.Any())
            {
                _ = SendAssignmentNotificationsAsync(taskDto.Id, taskDto.AssigneeIds, currentUser.Id);
            }

            return CreatedAtAction(nameof(GetTask), new { id = taskDto.Id }, taskDto);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<TaskItem>> UpdateTask(int id, [FromBody] TaskUpdateDto dto)
        {
            var currentUser = await GetCurrentUserWithDeptsAsync();

            // Detect newly added assignees by comparing with current state before update
            List<int> newAssigneeIds = new List<int>();
            if (dto.AssigneeIds != null)
            {
                var existingTask = await _context.Tasks.Include(t => t.Assignees).FirstOrDefaultAsync(t => t.Id == id);
                var existingAssigneeIds = existingTask?.Assignees.Select(a => a.UserId).ToList() ?? new List<int>();
                newAssigneeIds = dto.AssigneeIds.Except(existingAssigneeIds).ToList();

                Console.WriteLine($"[EmailDiff] Task {id}: Incoming={string.Join(",", dto.AssigneeIds)} | Existing={string.Join(",", existingAssigneeIds)} | NEW={string.Join(",", newAssigneeIds)}");
            }

            var task = await _taskService.UpdateTaskAsync(id, dto, currentUser.Id);

            if (task == null) return NotFound();

            // Create activity logs for NEW assignees so they appear in history correctly
            if (newAssigneeIds.Any())
            {
                foreach (var assigneeId in newAssigneeIds)
                {
                    var assigneeUser = await _context.Users.FindAsync(assigneeId);
                    var assigneeName = assigneeUser?.FullName ?? $"Kullanıcı #{assigneeId}";
                    await _activityLogger.LogChangeAsync(
                        currentUser.Id, "ASSIGN", "Task", id.ToString(), "Assignee", null, assigneeName
                    );
                }
            }
            if (dto.LabelIds != null)
            {
                // We should probably do the same for labels to prevent duplicate logs, but leaving as is for now or doing a lazy check:
                // Let's just keep the existing behavior for labels to avoid scope creep, or ideally fix it.
                foreach (var labelId in dto.LabelIds)
                {
                    var label = await _context.Labels.FindAsync(labelId);
                    var labelName = label?.Name ?? $"Etiket #{labelId}";
                    // Prevent duplicate logs if possible, but keep original for now to ensure stability
                    await _activityLogger.LogChangeAsync(
                        currentUser.Id, "UPDATE", "Task", id.ToString(), "Labels", null, labelName
                    );
                }
            }

            // Trigger Emails for ONLY newly added assignees
            if (newAssigneeIds.Any())
            {
                _ = SendAssignmentNotificationsAsync(id, newAssigneeIds, currentUser.Id);
            }

            await _hubContext.Clients.All.SendAsync("TaskUpdated", task);

            return Ok(task);
        }

        [HttpPut("{id}/status")]
        public async Task<ActionResult<TaskItem>> UpdateTaskStatus(int id, [FromBody] TaskStatusUpdateRequest request)
        {
            var currentUser = await GetCurrentUserWithDeptsAsync();
            var task = await _taskService.UpdateTaskStatusAsync(id, request.Status, currentUser.Id);

            if (task == null) return NotFound();

            await _hubContext.Clients.All.SendAsync("TaskUpdated", task);

            return Ok(task);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var currentUser = await GetCurrentUserWithDeptsAsync();
            bool isAdmin = currentUser.Role == "admin";

            var success = await _taskService.DeleteTaskAsync(id, currentUser.Id, isAdmin);

            if (!success) return StatusCode(403, "Yetkiniz yok veya görev bulunamadı.");

            await _hubContext.Clients.All.SendAsync("TaskDeleted", id);

            return NoContent();
        }

        // --- SUBTASKS ---

        [HttpGet("{taskId}/subtasks")]
        public async Task<ActionResult<IEnumerable<Subtask>>> GetSubtasks(int taskId)
        {
             var subtasks = await _taskService.GetSubtasksAsync(taskId);
             return Ok(subtasks);
        }

        [HttpPost("{taskId}/subtasks")]
        public async Task<ActionResult<Subtask>> PostSubtask(int taskId, [FromBody] SubtaskCreateDto dto)
        {
             var currentUser = await GetCurrentUserWithDeptsAsync();
             var subtask = await _taskService.AddSubtaskAsync(taskId, dto, currentUser.Id);
             
             if (subtask == null) return NotFound("Task not found");

             await _hubContext.Clients.All.SendAsync("SubtaskCreated", subtask);
             return CreatedAtAction(nameof(GetSubtasks), new { taskId }, subtask);
        }
        
        [HttpPut("subtasks/{subtaskId}")]
        public async Task<ActionResult<Subtask>> UpdateSubtask(int subtaskId, [FromBody] SubtaskUpdateDto dto)
        {
             var currentUser = await GetCurrentUserWithDeptsAsync();
             var subtask = await _taskService.UpdateSubtaskAsync(subtaskId, dto, currentUser.Id);

             if (subtask == null) return NotFound();
             
             await _hubContext.Clients.All.SendAsync("SubtaskUpdated", subtask);
             return Ok(subtask);
        }

        [HttpDelete("subtasks/{subtaskId}")]
        public async Task<IActionResult> DeleteSubtask(int subtaskId)
        {
             var currentUser = await GetCurrentUserWithDeptsAsync();
             var success = await _taskService.DeleteSubtaskAsync(subtaskId, currentUser.Id);
             
             if (!success) return NotFound();

             await _hubContext.Clients.All.SendAsync("SubtaskDeleted", subtaskId);
             return NoContent();
        }

        // --- COMMENTS ---

        [HttpGet("{taskId}/comments")]
        public async Task<ActionResult<IEnumerable<Comment>>> GetComments(int taskId)
        {
             var comments = await _taskService.GetCommentsAsync(taskId);
             return Ok(comments);
        }

        [HttpPost("{taskId}/comments")]
        public async Task<ActionResult<Comment>> PostComment(int taskId, [FromBody] CommentCreateDto dto)
        {
             var currentUser = await GetCurrentUserWithDeptsAsync();
             var comment = await _taskService.AddCommentAsync(taskId, dto.Text, currentUser.Id);

             if (comment == null) return NotFound();

             await _hubContext.Clients.All.SendAsync("CommentAdded", comment);
             return CreatedAtAction(nameof(GetComments), new { taskId }, comment);
        }

        [HttpDelete("comments/{commentId}")]
        public async Task<IActionResult> DeleteComment(int commentId)
        {
             var currentUser = await GetCurrentUserWithDeptsAsync();
             bool isAdmin = currentUser.Role == "admin";
             var success = await _taskService.DeleteCommentAsync(commentId, currentUser.Id, isAdmin);

             if (!success) return NotFound();
             
             await _hubContext.Clients.All.SendAsync("CommentDeleted", commentId);
             return NoContent();
        }

        // --- ATTACHMENTS (Basic implementation via Service) ---
        // For upload, usually we handle file stream in Controller, then pass metadata to Service.
        // Or Service handles stream (not ideal).
        // Let's assume Upload stays in Controller for file handling, but record creation goes to Service?
        // Current ITaskService has AddAttachmentAsync taking Attachment object.
        
        [HttpPost("{taskId}/attachments")]
        public async Task<ActionResult<Attachment>> UploadAttachment(int taskId, IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("Dosya seçilmedi.");

            var currentUser = await GetCurrentUserWithDeptsAsync();
            
            // File Save Logic (Keep in Controller or Helper)
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = Guid.NewGuid().ToString() + "_" + file.FileName;
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var attachment = new Attachment
            {
                TaskId = taskId,
                Name = file.FileName,
                Url = "/uploads/" + uniqueFileName, // Web path
                Type = file.ContentType,
                Size = file.Length,
                CreatedBy = currentUser.Id,
                CreatedAt = TimeHelper.Now
            };

            var created = await _taskService.AddAttachmentAsync(taskId, attachment, currentUser.Id);
            if (created == null) return NotFound("Task not found");

            return Ok(created);
        }

        private async Task SendAssignmentNotificationsAsync(int taskId, List<int> assigneeIds, int currentUserId)
        {
            try
            {
                using (var scope = _scopeFactory.CreateScope())
                {
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var emailSvc = scope.ServiceProvider.GetRequiredService<Unity.Infrastructure.Services.IEmailService>();

                    var task = await db.Tasks
                        .Include(t => t.Project)
                        .Include(t => t.Subtasks).ThenInclude(s => s.Assignees)
                        .FirstOrDefaultAsync(t => t.Id == taskId);

                    if (task == null) return;

                    var assigner = await db.Users.FindAsync(currentUserId);
                    var assignerName = assigner?.FullName ?? "Bir Üst Yönetici";

                    // Fetch Project and then Department
                    var project = await db.Projects.FindAsync(task.ProjectId);
                    var department = project != null ? await db.Departments.FindAsync(project.DepartmentId) : null;
                    var workGroup = department?.Name ?? (project?.Name ?? "Genel Çalışma Grubu");

                    var allUsers = await db.Users.Where(u => assigneeIds.Contains(u.Id)).ToListAsync();

                    foreach (var user in allUsers)
                    {
                        if (string.IsNullOrEmpty(user.Email)) continue;

                        var emailSubtasks = task.Subtasks.Select(s => new EmailSubtaskDto
                        {
                            Title = s.Title,
                            IsCompleted = s.IsCompleted
                        }).ToList();

                        await emailSvc.SendTaskAssignmentEmailAsync(
                            user.Email,
                            user.FullName,
                            task.Description,
                            assignerName,
                            workGroup,
                            project?.Name ?? "Projesiz",
                            task.Title,
                            null, // Root task
                            task.Priority,
                            task.DueDate,
                            task.ProjectId,
                            task.Id,
                            emailSubtasks
                        );
                    }
                }
            }
            catch (Exception ex)
            {
                // Log failure but don't crash the request
                Console.WriteLine($"[EmailError] Failed to send assignment emails: {ex.Message}");
            }
        }
    }
}
