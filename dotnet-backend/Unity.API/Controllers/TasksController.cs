using Microsoft.AspNetCore.Authorization;
using Unity.Core.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using Unity.Core.Models;
using Unity.Infrastructure.Data;
using Unity.Infrastructure.Services;

using Microsoft.AspNetCore.SignalR;
using Unity.API.Hubs;
using Unity.Core.DTOs.Dashboard;
using Unity.Core.DTOs;

namespace Unity.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IAuditService _auditService;
        private readonly IActivityLogger _activityLogger;
        private readonly IHubContext<AppHub> _hubContext;
        private readonly Unity.Infrastructure.Services.IEmailService _emailService;
        private readonly IServiceScopeFactory _scopeFactory;

        public TasksController(AppDbContext context, IAuditService auditService, IActivityLogger activityLogger, IHubContext<AppHub> hubContext, Unity.Infrastructure.Services.IEmailService emailService, IServiceScopeFactory scopeFactory)
        {
            _context = context;
            _auditService = auditService;
            _activityLogger = activityLogger;
            _hubContext = hubContext;
            _emailService = emailService;
            _scopeFactory = scopeFactory;
        }

        private int GetCurrentUserId()
        {
            var claimId = User.FindFirst("id")?.Value
                          ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (int.TryParse(claimId, out int userId))
            {
                return userId;
            }
            throw new UnauthorizedAccessException("Invalid User Token.");
        }

        private async Task<User> GetCurrentUserWithDeptsAsync()
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.AsNoTracking()
                .Include(u => u.Departments)
                .FirstOrDefaultAsync(u => u.Id == userId);

            return user ?? throw new UnauthorizedAccessException("User not found.");
        }

        // ... methods ...


        [HttpGet("dashboard/stats")]
        public async Task<ActionResult<DashboardStatsDto>> GetDashboardStats()
        {
            var userId = Int32.Parse(User.FindFirst("id")?.Value ?? "0");

            // 1. RELIABLE STATS: Direct LINQ Query (Bypass view issues)
            var stats = await _context.TaskAssignees
                .Where(ta => ta.UserId == userId && ta.Task != null && !ta.Task.IsDeleted)
                .Select(ta => ta.Task)
                .GroupBy(t => 1) // Dummy group to aggregate
                .Select(g => new DashboardStatsDto
                {
                    UserId = userId,
                    TotalTasks = g.Count(),
                    CompletedTasks = g.Count(t => t.Status == "done"),
                    TodoTasks = g.Count(t => t.Status == "todo"),
                    InProgressTasks = g.Count(t => t.Status == "working" || t.Status == "in_progress"),
                    StuckTasks = g.Count(t => t.Status == "stuck"),
                    ReviewTasks = g.Count(t => t.Status == "review"),
                    OverdueTasks = g.Count(t => t.DueDate != null && t.DueDate < DateTime.UtcNow && t.Status != "done"),
                    AverageProgress = g.Average(t => (double)t.Progress)
                })
                .FirstOrDefaultAsync();

            if (stats == null)
            {
                return Ok(new DashboardStatsDto { UserId = userId });
            }

            return Ok(stats);
        }

        [HttpGet("dashboard/tasks")]
        public async Task<ActionResult<PaginatedTasksResponse>> GetDashboardTasks([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var userId = Int32.Parse(User.FindFirst("id")?.Value ?? "0");

            // 2. TASKS: Pagination & DTO Projection (Include all assigned tasks)
            var baseQuery = _context.Tasks.AsNoTracking()
                .Where(t => t.Assignees.Any(a => a.UserId == userId) && !t.IsDeleted);

            var totalCount = await baseQuery.CountAsync();

            var tasks = await baseQuery
                .OrderByDescending(t => t.Priority)
                .ThenBy(t => t.DueDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new DashboardTaskDto
                {
                    Id = t.Id,
                    Title = t.Title,
                    Status = t.Status,
                    Priority = t.Priority,
                    DueDate = t.DueDate,
                    Progress = t.Progress,
                    ProjectId = t.ProjectId,
                    ProjectName = t.Project.Name,
                    ProjectColor = t.Project.Color,
                    Assignees = t.Assignees.Select(a => new DashboardAssigneeDto
                    {
                        Id = a.User.Id,
                        FullName = a.User.FullName,
                        Avatar = a.User.Avatar
                    }).ToList()
                }).ToListAsync();

            return Ok(new
            {
                Tasks = tasks,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                HasMore = (page * pageSize) < totalCount
            });
        }



        [HttpGet]
        public async Task<ActionResult<PaginatedTasksResponse>> GetTasks(
            [FromQuery] int? projectId,
            [FromQuery] string? status,
            [FromQuery] int? assignedTo,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 500)
        {
            // ULTRA-FAST: Minimal query for list view
            var query = _context.Tasks.AsNoTracking()
                .Where(t => !t.IsDeleted);

            // Apply filters
            if (projectId.HasValue)
                query = query.Where(t => t.ProjectId == projectId.Value);

            if (!string.IsNullOrEmpty(status))
                query = query.Where(t => t.Status == status);

            if (assignedTo.HasValue)
                query = query.Where(t => t.Assignees.Any(a => a.UserId == assignedTo.Value));

            var totalCount = await query.CountAsync();

            // SINGLE QUERY - No sub-selects, no includes, just flat data
            var tasks = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new TaskItemDto
                {
                    Id = t.Id,
                    Title = t.Title,
                    TaskUrl = t.TaskUrl,
                    Status = t.Status,
                    Priority = t.Priority,
                    DueDate = t.DueDate,
                    Progress = t.Progress,
                    ProjectId = t.ProjectId,
                    ProjectName = t.Project.Name,
                    ProjectColor = t.Project.Color,
                    // ULTRA-FAST: Return empty for list view, load on demand
                    AssigneeIds = new List<int>(),
                    LabelIds = new List<int>(),
                    // REAL COUNTS: Constitution Rule #2 - "No Zero-Count Rule"
                    SubtaskCount = t.Subtasks.Count(),
                    Subtasks = t.Subtasks.Select(s => new SubtaskDto
                    {
                        Id = s.Id,
                        Title = s.Title,
                        IsCompleted = s.IsCompleted,
                        StartDate = s.StartDate,
                        DueDate = s.DueDate,
                        CreatedAt = s.CreatedAt,
                        AssigneeIds = s.Assignees.Select(a => a.UserId).ToList()
                    }).ToList(),
                    CommentCount = t.Comments.Count(),
                    AttachmentCount = t.Attachments.Count(),
                    CreatedBy = t.CreatedBy
                })
                .ToListAsync();

            // BATCH LOAD: Assignees and Labels in 2 separate queries (much faster than N+1)
            var taskIds = tasks.Select(t => t.Id).ToList();

            if (taskIds.Any())
            {
                var assignees = await _context.TaskAssignees
                    .Where(a => a.TaskId.HasValue && taskIds.Contains(a.TaskId.Value))
                    .Select(a => new { a.TaskId, a.UserId })
                    .ToListAsync();

                var labels = await _context.TaskLabels
                    .Where(l => taskIds.Contains(l.TaskId))
                    .Select(l => new { l.TaskId, l.LabelId })
                    .ToListAsync();

                var assigneesByTask = assignees.GroupBy(a => a.TaskId).ToDictionary(g => g.Key, g => g.Select(a => a.UserId).ToList());
                var labelsByTask = labels.GroupBy(l => l.TaskId).ToDictionary(g => g.Key, g => g.Select(l => l.LabelId).ToList());

                foreach (var task in tasks)
                {
                    if (assigneesByTask.TryGetValue(task.Id, out var aIds))
                        task.AssigneeIds = aIds;
                    if (labelsByTask.TryGetValue(task.Id, out var lIds))
                        task.LabelIds = lIds;
                }
            }

            return Ok(new PaginatedTasksResponse
            {
                Tasks = tasks,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                HasMore = (page * pageSize) < totalCount
            });
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<TaskItem>> GetTask(int id)
        {
            var task = await _context.Tasks.AsNoTracking()
                .Include(t => t.Assignees).ThenInclude(a => a.User)
                .Include(t => t.Labels)
                .Include(t => t.Subtasks.OrderBy(s => s.Position)).ThenInclude(s => s.Assignees)
                .Include(t => t.Comments).ThenInclude(c => c.User)
                .Include(t => t.Attachments)
                .AsSplitQuery() // PERFORMANCE FIX: Optimizes deep tree loading
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null) return NotFound();

            return Ok(task);
        }

        [HttpPost]
        public async Task<ActionResult<TaskItem>> PostTask([FromBody] JsonElement body)
        {
            try
            {
                var currentUser = await GetCurrentUserWithDeptsAsync();

                var task = new TaskItem
                {
                    AssignedBy = currentUser.Id,
                    CreatedBy = currentUser.Id,
                    CreatedAt = TimeHelper.Now,
                    UpdatedAt = TimeHelper.Now,
                    Status = "todo",
                    Priority = "medium",
                    Progress = 0
                };

                Console.WriteLine($"[DEBUG] PostTask Raw Body: {body.GetRawText()}");
                
                foreach (var prop in body.EnumerateObject())
                {
                    var val = prop.Value;
                    var name = prop.Name.ToLowerInvariant();
                    Console.WriteLine($"[DEBUG] Prop: '{prop.Name}' -> '{name}' | Kind: {val.ValueKind} | Val: {val}");

                    switch (name)
                    {
                        case "title":
                            if (val.ValueKind == JsonValueKind.String) task.Title = val.GetString();
                            break;
                        case "description":
                            if (val.ValueKind == JsonValueKind.String) task.Description = val.GetString();
                            break;
                        case "taskurl":
                            if (val.ValueKind == JsonValueKind.String) task.TaskUrl = val.GetString();
                            break;
                        case "status":
                            if (val.ValueKind == JsonValueKind.String) task.Status = val.GetString();
                            break;
                        case "priority":
                            if (val.ValueKind == JsonValueKind.String) task.Priority = val.GetString();
                            break;
                        case "projectid":
                            if (val.ValueKind == JsonValueKind.Number) task.ProjectId = val.GetInt32();
                            else if (val.ValueKind == JsonValueKind.String && int.TryParse(val.GetString(), out var pid)) task.ProjectId = pid;
                            break;
                        case "project": // Handle nested project object
                            if (val.ValueKind == JsonValueKind.Object && val.TryGetProperty("id", out var pidProp) && pidProp.ValueKind == JsonValueKind.Number)
                                task.ProjectId = pidProp.GetInt32();
                            break;
                        case "startdate":
                            if (val.ValueKind == JsonValueKind.String && val.TryGetDateTime(out var sd)) task.StartDate = sd.ToUniversalTime();
                            else if (val.ValueKind == JsonValueKind.Null) task.StartDate = null;
                            break;
                        case "duedate":
                            if (val.ValueKind == JsonValueKind.String && val.TryGetDateTime(out var dd)) task.DueDate = dd.ToUniversalTime();
                            else if (val.ValueKind == JsonValueKind.Null) task.DueDate = null;
                            break;
                        case "labels":
                            if (val.ValueKind == JsonValueKind.Array)
                            {
                                foreach (var item in val.EnumerateArray())
                                {
                                    int? lKey = null;
                                    if (item.ValueKind == JsonValueKind.Number) lKey = item.GetInt32();
                                    else if (item.ValueKind == JsonValueKind.String && int.TryParse(item.GetString(), out var lVal)) lKey = lVal;
                                    else if (item.ValueKind == JsonValueKind.Object)
                                    {
                                        if (item.TryGetProperty("id", out var idProp) || item.TryGetProperty("labelId", out idProp))
                                        {
                                            if (idProp.ValueKind == JsonValueKind.Number) lKey = idProp.GetInt32();
                                            else if (idProp.ValueKind == JsonValueKind.String && int.TryParse(idProp.GetString(), out var lObjVal)) lKey = lObjVal;
                                        }
                                    }
                                    if (lKey.HasValue) task.Labels.Add(new TaskLabel { LabelId = lKey.Value });
                                }
                            }
                            break;
                        case "assignees":
                            if (val.ValueKind == JsonValueKind.Array)
                            {
                                foreach (var item in val.EnumerateArray())
                                {
                                    int? uid = null;
                                    if (item.ValueKind == JsonValueKind.Number) uid = item.GetInt32();
                                    else if (item.ValueKind == JsonValueKind.String && int.TryParse(item.GetString(), out var uVal)) uid = uVal;
                                    else if (item.ValueKind == JsonValueKind.Object)
                                    {
                                        if (item.TryGetProperty("id", out var idProp) || item.TryGetProperty("userId", out idProp))
                                        {
                                            if (idProp.ValueKind == JsonValueKind.Number) uid = idProp.GetInt32();
                                            else if (idProp.ValueKind == JsonValueKind.String && int.TryParse(idProp.GetString(), out var uObjVal)) uid = uObjVal;
                                        }
                                    }
                                    if (uid.HasValue) task.Assignees.Add(new TaskAssignee { UserId = uid.Value });
                                }
                            }
                            break;
                    }
                }

                if (string.IsNullOrEmpty(task.Title))
                    return BadRequest(new { message = "Başlık (Title) zorunludur." });

                if (task.ProjectId == 0)
                    return BadRequest(new { message = "Proje seçimi zorunludur." });

                // Auto-assign creator logic REMOVED per user request
                // if (task.Assignees.Count == 0) ...

                _context.Tasks.Add(task);
                await _context.SaveChangesAsync();

                // CLEAN READ PATTERN: Ensure we return the full object with all relationships
                _context.ChangeTracker.Clear();

                var freshTask = await _context.Tasks.AsNoTracking()
                    .Include(t => t.Assignees).ThenInclude(a => a.User)
                    .Include(t => t.Labels).ThenInclude(l => l.Label)
                    .Include(t => t.Subtasks).ThenInclude(s => s.Assignees)
                    .Include(t => t.Comments).ThenInclude(c => c.User)
                    .Include(t => t.Attachments)
                    .FirstOrDefaultAsync(t => t.Id == task.Id);

                if (freshTask != null)
                {
                    freshTask.LabelIds = freshTask.Labels.Select(l => l.LabelId).ToList();
                    freshTask.AssigneeIds = freshTask.Assignees.Select(a => a.UserId).ToList();
                }

                await _auditService.LogAsync(
                    currentUser.Id.ToString(),
                    "CREATE_TASK",
                    "Task",
                    task.Id.ToString(),
                    null,
                    freshTask ?? (object)task,
                    $"Task '{task.Title}' created."
                );

                await _hubContext.Clients.All.SendAsync("TaskCreated", freshTask ?? task);

                // Send Email Notifications Async
                if (task.Assignees != null && task.Assignees.Any())
                {
                    var assignedUserIds = task.Assignees.Select(a => a.UserId).Distinct().ToList();
                    SendAssignmentEmailsInBackground(task.Id, assignedUserIds, currentUser.Id);
                }

                return CreatedAtAction(nameof(GetTask), new { id = task.Id }, freshTask ?? task);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] PostTask failed: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return StatusCode(500, new { message = "Bir hata oluştu.", error = ex.Message });
            }
        }

        private async Task<bool> HasWriteAccessAsync(TaskItem task, User user)
        {
            Console.WriteLine($"[DEBUG] HasWriteAccessAsync checking: User={user.Id}, Task={task.Id}, Project={task.ProjectId}");

            if (string.Equals(user.Role, "admin", StringComparison.OrdinalIgnoreCase)) { Console.WriteLine(" - Access GRANTED: Admin"); return true; }
            if (task.CreatedBy == user.Id) { Console.WriteLine(" - Access GRANTED: Creator"); return true; }
            if (task.AssignedBy == user.Id) { Console.WriteLine(" - Access GRANTED: Assigner"); return true; }
            if (task.Assignees != null && task.Assignees.Any(ta => ta.UserId == user.Id)) { Console.WriteLine(" - Access GRANTED: Assignee"); return true; }

            // Allow Write Access if User is Project Owner OR Project Member
            var project = await _context.Projects
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.Id == task.ProjectId);

            if (project != null)
            {
                Console.WriteLine($" - Project Check: Owner={project.Owner}, MembersCount={project.Members.Count}");
                // Permit access if project is Public
                if (!project.IsPrivate) { Console.WriteLine(" - Access GRANTED: Public Project"); return true; }

                if (project.Owner == user.Id) { Console.WriteLine(" - Access GRANTED: Project Owner"); return true; }
                if (project.Members.Any(pm => pm.UserId == user.Id)) { Console.WriteLine(" - Access GRANTED: Project Member"); return true; }
            }

            Console.WriteLine(" - Access DENIED");
            return false;
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<TaskItem>> PutTask(int id, TaskItem task)
        {

            if (id != task.Id) return BadRequest();

            // Fetch old task with relationships to manage updates correctly
            // Fetch old task with relationships to manage updates correctly
            var existingTask = await _context.Tasks
                .Include(t => t.Assignees)
                .Include(t => t.Labels)
                .Include(t => t.Subtasks).ThenInclude(s => s.Assignees)
                .Include(t => t.Comments).ThenInclude(c => c.User)
                .Include(t => t.Attachments)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (existingTask == null) return NotFound();



            // Security Check
            // Security Check
            var currentUser = await GetCurrentUserWithDeptsAsync();
            if (!await HasWriteAccessAsync(existingTask, currentUser))
            {
                return StatusCode(403, new
                {
                    message = "Bu görevi güncelleme yetkiniz yok. Sadece görev sahibi, proje üyeleri veya atanan kişiler düzenleyebilir.",
                    title = "Yetkisiz İşlem"
                });
            }

            // Capture old state for audit
            var oldStateClone = JsonSerializer.Serialize(existingTask); // Simple snapshot

            // Manual Field Updates
            existingTask.Title = task.Title;
            existingTask.Description = task.Description;
            existingTask.TaskUrl = task.TaskUrl;
            existingTask.Status = task.Status;
            existingTask.Priority = task.Priority;
            existingTask.DueDate = task.DueDate;
            existingTask.StartDate = task.StartDate;
            existingTask.TShirtSize = task.TShirtSize;
            existingTask.Progress = task.Progress;
            existingTask.UpdatedAt = TimeHelper.Now;

            // Update Assignees
            if (task.Assignees != null)
            {
                // Detect newly added assignees for email notification
                var oldAssigneeIds = existingTask.Assignees.Select(a => a.UserId).ToHashSet();
                var newAssigneeIds = task.Assignees.Select(a => a.UserId).ToHashSet();
                var addedAssigneeIds = newAssigneeIds.Where(uid => !oldAssigneeIds.Contains(uid)).ToList();

                existingTask.Assignees.Clear();
                foreach (var assignee in task.Assignees)
                {
                    existingTask.Assignees.Add(new TaskAssignee { UserId = assignee.UserId, TaskId = id });
                }

                if (addedAssigneeIds.Any())
                {
                    SendAssignmentEmailsInBackground(id, addedAssigneeIds, currentUser.Id);
                }
            }

            // Update Labels
            if (task.Labels != null)
            {
                existingTask.Labels.Clear();
                foreach (var label in task.Labels)
                {
                    existingTask.Labels.Add(new TaskLabel { LabelId = label.LabelId, TaskId = id });
                }
            }



            // Note: Subtasks, Comments, Attachments are handled by separate endpoints, 
            // but if the frontend sends them here, we might need to handle or ignore. 
            // Better to ignore here as they have their own controllers usually.

            try
            {
                await _context.SaveChangesAsync();



                // CLEAN READ PATTERN:
                // Clear the change tracker to remove stale state from memory
                _context.ChangeTracker.Clear();

                // Re-fetch the task from the database to ensure we return exactly what is persisted
                var freshTask = await _context.Tasks.AsNoTracking()
                    .Include(t => t.Assignees)
                    .Include(t => t.Labels)
                    .Include(t => t.Subtasks).ThenInclude(s => s.Assignees)
                    .Include(t => t.Comments).ThenInclude(c => c.User)
                    .Include(t => t.Attachments)
                    .FirstOrDefaultAsync(t => t.Id == id);

                var userId = GetCurrentUserId();
                // Async audit (fire and forget or await)
                await _auditService.LogAsync(
                    userId.ToString(),
                    "UPDATE_TASK",
                    "Task",
                    task.Id.ToString(),
                    oldStateClone,
                    task, // New state (approx)
                    $"Task '{task.Title}' updated."
                );

                // Clean read
                // ... (code omitted for brevity in call) ...

                // Broadcast
                await _hubContext.Clients.All.SendAsync("TaskUpdated", freshTask);

                return Ok(freshTask);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Tasks.Any(e => e.Id == id)) return NotFound();
                else throw;
            }
        }

        [HttpPatch("{id:int}")]
        public async Task<ActionResult<TaskItem>> PatchTask(int id, [FromBody] JsonElement body)
        {
            var task = await _context.Tasks
                .Include(t => t.Assignees)
                .Include(t => t.Labels)
                .Include(t => t.Subtasks).ThenInclude(s => s.Assignees)
                .Include(t => t.Comments).ThenInclude(c => c.User)
                .Include(t => t.Attachments)
                .FirstOrDefaultAsync(t => t.Id == id);
            if (task == null) return NotFound();

            // Security Check
            // Security Check
            var currentUser = await GetCurrentUserWithDeptsAsync();
            if (!await HasWriteAccessAsync(task, currentUser))
            {
                return StatusCode(403, new
                {
                    message = "Bu görevi güncelleme yetkiniz yok.",
                    title = "Yetkisiz İşlem"
                });
            }

            // Capture old values for logging
            var oldStartDate = task.StartDate;
            var oldDueDate = task.DueDate;

            foreach (var property in body.EnumerateObject())
            {
                switch (property.Name.ToLower())
                {
                    case "title":
                        if (property.Value.ValueKind == JsonValueKind.String)
                        {
                            var oldTitle = task.Title;
                            task.Title = property.Value.GetString();
                            await _activityLogger.LogChangeAsync(currentUser.Id, "UPDATE", "Task", task.Id.ToString(), "Title", oldTitle, task.Title);
                        }
                        break;
                    case "description":
                        if (property.Value.ValueKind == JsonValueKind.String)
                        {
                            var oldDesc = task.Description;
                            task.Description = property.Value.GetString();
                            await _activityLogger.LogChangeAsync(currentUser.Id, "UPDATE", "Task", task.Id.ToString(), "Description", oldDesc, task.Description);
                        }
                        else if (property.Value.ValueKind == JsonValueKind.Null)
                        {
                            var oldDesc = task.Description;
                            task.Description = null;
                            await _activityLogger.LogChangeAsync(currentUser.Id, "UPDATE", "Task", task.Id.ToString(), "Description", oldDesc, null);
                        }
                        break;
                    case "taskurl":
                        if (property.Value.ValueKind == JsonValueKind.String)
                        {
                            var oldUrl = task.TaskUrl;
                            task.TaskUrl = property.Value.GetString();
                            await _activityLogger.LogChangeAsync(currentUser.Id, "UPDATE", "Task", task.Id.ToString(), "TaskUrl", oldUrl, task.TaskUrl);
                        }
                        else if (property.Value.ValueKind == JsonValueKind.Null)
                        {
                            var oldUrl = task.TaskUrl;
                            task.TaskUrl = null;
                            await _activityLogger.LogChangeAsync(currentUser.Id, "UPDATE", "Task", task.Id.ToString(), "TaskUrl", oldUrl, null);
                        }
                        break;
                    case "status":
                if (property.Value.ValueKind == JsonValueKind.String)
                {
                    var oldStatus = task.Status;
                    var newStatus = property.Value.GetString();

                    // 1. Validation: Cannot mark as 'done' if incomplete subtasks exist
                    if (newStatus == "done")
                    {
                         var incompleteSubtasks = await _context.Subtasks
                            .AnyAsync(s => s.TaskId == id && !s.IsCompleted);

                        if (incompleteSubtasks)
                        {
                            return BadRequest(new { message = "Alt görevler tamamlanmadan ana görev kapatılamaz." });
                        }
                        
                        // Auto-Progress Rule 1: specific to 'done'
                        if (task.Progress < 100) task.Progress = 100;
                    }

                    // 2. Automation: Progress Logic for 'working' (Devam Ediyor)
                    if ((newStatus == "working" || newStatus == "review") && task.Progress == 0)
                    {
                        task.Progress = 25;
                    }

                    // 3. Automation: CompletedAt Logic
                    if (newStatus == "done" && oldStatus != "done")
                    {
                        // Mark as completed now
                        task.CompletedAt = DateTime.UtcNow;
                    }
                    else if (newStatus != "done" && oldStatus == "done")
                    {
                        // Re-opened: Clear completion date
                        task.CompletedAt = null;
                        
                        // Optional: Reset progress if moving back to todo? (Keeping simple for now per user request)
                        if (newStatus == "todo") task.Progress = 0;
                    }

                    task.Status = newStatus;
                    await _activityLogger.LogChangeAsync(currentUser.Id, "UPDATE", "Task", task.Id.ToString(), "Status", oldStatus, task.Status);
                }
                break;
                    case "priority":
                        if (property.Value.ValueKind == JsonValueKind.String)
                        {
                            var oldPriority = task.Priority;
                            task.Priority = property.Value.GetString();
                            await _activityLogger.LogChangeAsync(currentUser.Id, "UPDATE", "Task", task.Id.ToString(), "Priority", oldPriority, task.Priority);
                        }
                        break;
                    case "tshirtsize":
                        if (property.Value.ValueKind == JsonValueKind.String)
                        {
                            var oldSize = task.TShirtSize;
                            task.TShirtSize = property.Value.GetString();
                            await _activityLogger.LogChangeAsync(currentUser.Id, "UPDATE", "Task", task.Id.ToString(), "TShirtSize", oldSize, task.TShirtSize);
                        }
                        else if (property.Value.ValueKind == JsonValueKind.Null)
                        {
                            var oldSize = task.TShirtSize;
                            task.TShirtSize = null;
                            await _activityLogger.LogChangeAsync(currentUser.Id, "UPDATE", "Task", task.Id.ToString(), "TShirtSize", oldSize, null);
                        }
                        break;
                    case "startdate":
                        if (property.Value.TryGetDateTime(out var startDate))
                            task.StartDate = startDate.ToUniversalTime();
                        else if (property.Value.ValueKind == JsonValueKind.Null)
                            task.StartDate = null;
                        break;
                    case "duedate":
                        if (property.Value.TryGetDateTime(out var dueDate))
                            task.DueDate = dueDate.ToUniversalTime();
                        else if (property.Value.ValueKind == JsonValueKind.Null)
                            task.DueDate = null;
                        break;
                    case "progress":
                        if (property.Value.ValueKind == JsonValueKind.Number && property.Value.TryGetInt32(out var progress))
                            task.Progress = progress;
                        else if (property.Value.ValueKind == JsonValueKind.String && int.TryParse(property.Value.GetString(), out var pParsed))
                            task.Progress = pParsed;
                        break;
                    case "assignees":
                        if (property.Value.ValueKind == JsonValueKind.Array)
                        {
                            var newAssigneeIds = new HashSet<int>();
                            foreach (var item in property.Value.EnumerateArray())
                            {
                                int? uid = null;
                                if (item.ValueKind == JsonValueKind.Number) uid = item.GetInt32();
                                else if (item.ValueKind == JsonValueKind.String && int.TryParse(item.GetString(), out var val)) uid = val;

                                if (uid.HasValue) newAssigneeIds.Add(uid.Value);
                            }

                            // Capture old set for logging
                            var oldAssigneeIds = task.Assignees.Select(a => a.UserId).ToHashSet();

                            // Sync Logic for Assignees (Surrogate Key Safe)
                            var toRemove = task.Assignees.Where(a => !newAssigneeIds.Contains(a.UserId)).ToList();
                            foreach (var r in toRemove)
                            {
                                _context.TaskAssignees.Remove(r);
                                await _activityLogger.LogChangeAsync(currentUser.Id, "UNASSIGN", "Task", task.Id.ToString(), "Assignee", r.UserId, null);
                            }

                            var newAssigneeIdsForEmail = new List<int>();
                            var existingIds = task.Assignees.Select(a => a.UserId).ToHashSet();
                            foreach (var newId in newAssigneeIds)
                            {
                                if (!existingIds.Contains(newId))
                                {
                                    task.Assignees.Add(new TaskAssignee { UserId = newId, TaskId = id });
                                    await _activityLogger.LogChangeAsync(currentUser.Id, "ASSIGN", "Task", task.Id.ToString(), "Assignee", null, newId);
                                    if (newId != currentUser.Id) newAssigneeIdsForEmail.Add(newId);
                                }
                            }

                            if (newAssigneeIdsForEmail.Any())
                            {
                                SendAssignmentEmailsInBackground(id, newAssigneeIdsForEmail, currentUser.Id);
                            }
                        }
                        break;
                    case "labels":
                        if (property.Value.ValueKind == JsonValueKind.Array)
                        {
                            var newLabelIds = new HashSet<int>();
                            foreach (var item in property.Value.EnumerateArray())
                            {
                                int? lKey = null;
                                if (item.ValueKind == JsonValueKind.Number) lKey = item.GetInt32();
                                else if (item.ValueKind == JsonValueKind.String && int.TryParse(item.GetString(), out var val)) lKey = val;
                                else if (item.ValueKind == JsonValueKind.Object)
                                {
                                    if (item.TryGetProperty("id", out var idProp) || item.TryGetProperty("Id", out idProp) || item.TryGetProperty("labelId", out idProp) || item.TryGetProperty("LabelId", out idProp))
                                    {
                                        if (idProp.ValueKind == JsonValueKind.Number) lKey = idProp.GetInt32();
                                        else if (idProp.ValueKind == JsonValueKind.String && int.TryParse(idProp.GetString(), out var valObj)) lKey = valObj;
                                    }
                                }

                                if (lKey.HasValue) newLabelIds.Add(lKey.Value);
                            }

                            // Sync Logic for Labels (Composite Key Safe)
                            // Remove ones not in new list
                            var toRemove = task.Labels.Where(l => !newLabelIds.Contains(l.LabelId)).ToList();
                            foreach (var r in toRemove) _context.TaskLabels.Remove(r);

                            // Add new ones
                            var existingLabelIds = task.Labels.Select(l => l.LabelId).ToHashSet();
                            foreach (var newId in newLabelIds)
                            {
                                if (!existingLabelIds.Contains(newId))
                                {
                                    task.Labels.Add(new TaskLabel { LabelId = newId, TaskId = id });
                                }
                            }
                        }
                        break;
                    case "subtasks":
                        if (property.Value.ValueKind == JsonValueKind.Array || property.Value.ValueKind == JsonValueKind.String)
                        {
                            // Subtasks are now managed via /api/tasks/{id}/subtasks
                        }
                        break;
                    case "comments":
                        if (property.Value.ValueKind == JsonValueKind.Array || property.Value.ValueKind == JsonValueKind.String)
                        {
                            // Comments are now managed via /api/tasks/{id}/comments
                        }
                        break;
                    case "attachments":
                        if (property.Value.ValueKind == JsonValueKind.Array)
                        {
                            var incomingAttachments = new List<Attachment>();
                            foreach (var item in property.Value.EnumerateArray())
                            {
                                incomingAttachments.Add(new Attachment
                                {
                                    TaskId = id,
                                    Name = item.TryGetProperty("name", out var nameProp) ? nameProp.GetString() : "Dosya",
                                    Url = item.TryGetProperty("url", out var urlProp) ? urlProp.GetString() : "",
                                    Type = item.TryGetProperty("type", out var typeProp) ? typeProp.GetString() : "unknown",
                                    Size = item.TryGetProperty("size", out var sizeProp) && sizeProp.ValueKind == JsonValueKind.Number ? sizeProp.GetInt64() : 0,
                                    CreatedBy = currentUser.Id,
                                    CreatedAt = TimeHelper.Now
                                });
                            }

                            // SMART SYNC: Clear/Add instead of simple Clear causes Issues?
                            // Logic: 
                            // 1. Identify files to remove (in DB but not in incoming)
                            // 2. Identify files to add (in incoming but not in DB)
                            // 3. Keep existing ones (in both)

                            var incomingUrls = incomingAttachments.Select(a => a.Url).ToHashSet();
                            var existingUrls = task.Attachments.Select(a => a.Url).ToHashSet();

                            // 1. Remove deleted
                            var toRemove = task.Attachments.Where(a => !incomingUrls.Contains(a.Url)).ToList();
                            foreach (var del in toRemove)
                            {
                                _context.Attachments.Remove(del);
                            }

                            // 2. Add new
                            foreach (var newAtt in incomingAttachments)
                            {
                                if (!existingUrls.Contains(newAtt.Url))
                                {
                                    task.Attachments.Add(newAtt);
                                }
                            }
                        }
                        break;
                }
            }

            task.UpdatedAt = TimeHelper.Now;

            // DEBUG: Log attachments being saved
            Console.WriteLine($"[DEBUG] PatchTask {id}: Attachments count = {task.Attachments?.Count ?? 0}");
            foreach (var att in task.Attachments ?? new List<Attachment>())
            {
                Console.WriteLine($"[DEBUG]   - Attachment: Id={att.Id}, Name={att.Name}, Url={att.Url}");
            }

            try
            {
                await _context.SaveChangesAsync();

                // Detailed Activity Logging for Dates
                if (oldStartDate != task.StartDate)
                {
                    await _activityLogger.LogChangeAsync(currentUser.Id, "UPDATE", "Task", task.Id.ToString(), "StartDate", oldStartDate, task.StartDate);
                }
                if (oldDueDate != task.DueDate)
                {
                    await _activityLogger.LogChangeAsync(currentUser.Id, "UPDATE", "Task", task.Id.ToString(), "DueDate", oldDueDate, task.DueDate);
                }
            }
            catch (Exception dbEx)
            {
                Console.WriteLine($"[CRITICAL] DB Save Failed: {dbEx}");
                return StatusCode(500, new { message = "Veritabanı kayıt hatası", error = dbEx.Message });
            }

            // CLEAN READ PATTERN: Ensure we return the full object with all relationships
            _context.ChangeTracker.Clear();

            var freshTask = await _context.Tasks.AsNoTracking()
                .Include(t => t.Assignees).ThenInclude(a => a.User)
                .Include(t => t.Labels).ThenInclude(l => l.Label)
                .Include(t => t.Subtasks).ThenInclude(s => s.Assignees)
                .Include(t => t.Comments).ThenInclude(c => c.User)
                .Include(t => t.Attachments)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (freshTask != null)
            {
                freshTask.LabelIds = freshTask.Labels.Select(l => l.LabelId).ToList();
                freshTask.AssigneeIds = freshTask.Assignees.Select(a => a.UserId).ToList();
            }

            // Broadcast
            try
            {
                await _hubContext.Clients.All.SendAsync("TaskUpdated", freshTask);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WARNING] SignalR Broadcast Failed: {ex.Message}");
            }

            return Ok(freshTask);
        }

        [HttpPut("{id:int}/status")]
        public async Task<ActionResult<TaskItem>> UpdateStatus(int id, [FromQuery] string status)
        {
            var task = await _context.Tasks
                .Include(t => t.Assignees)
                .FirstOrDefaultAsync(t => t.Id == id);
            if (task == null) return NotFound();

            // Security Check
            var currentUser = await GetCurrentUserWithDeptsAsync();
            if (!await HasWriteAccessAsync(task, currentUser))
            {
                return StatusCode(403, new
                {
                    message = "Bu görevin durumunu güncelleme yetkiniz yok.",
                    title = "Yetkisiz İşlem"
                });
            }

            var oldStatus = task.Status;
            task.Status = status;

            // 1. Validation: Cannot mark as 'done' if incomplete subtasks exist
            if (status == "done")
            {
                var incompleteSubtasks = await _context.Subtasks
                    .AnyAsync(s => s.TaskId == id && !s.IsCompleted);

                if (incompleteSubtasks)
                {
                    return BadRequest(new { message = "Alt görevler tamamlanmadan ana görev kapatılamaz." });
                }
                
                // Auto-Progress Rule 1: specific to 'done'
                if (task.Progress < 100) task.Progress = 100;
            }

            // 2. Automation: Progress Logic for 'working' (Devam Ediyor)
            // If status is 'working' and progress is 0, bump to 25.
            if ((status == "working" || status == "review") && task.Progress == 0)
            {
                task.Progress = 25;
            }

            task.UpdatedAt = TimeHelper.Now;
            await _context.SaveChangesAsync();

            var userId = GetCurrentUserId();
            await _activityLogger.LogChangeAsync(
                userId,
                "UPDATE",
                "Task",
                task.Id.ToString(),
                "Status",
                oldStatus,
                status
            );

            // CLEAN READ PATTERN:
            // Clear the change tracker to remove stale state from memory
            _context.ChangeTracker.Clear();

            // Re-fetch with subtasks to prevent UI wipe on broadcast
            var freshTask = await _context.Tasks.AsNoTracking()
                .Include(t => t.Assignees).ThenInclude(a => a.User)
                .Include(t => t.Labels).ThenInclude(l => l.Label)
                .Include(t => t.Subtasks).ThenInclude(s => s.Assignees)
                .Include(t => t.Comments).ThenInclude(c => c.User)
                .Include(t => t.Attachments)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (freshTask != null)
            {
                freshTask.LabelIds = freshTask.Labels.Select(l => l.LabelId).ToList();
                freshTask.AssigneeIds = freshTask.Assignees.Select(a => a.UserId).ToList();
            }

            // Broadcast
            await _hubContext.Clients.All.SendAsync("TaskUpdated", freshTask);

            return Ok(freshTask);
        }

        [HttpPost("{id:int}/subtasks")]
        public async Task<ActionResult<Subtask>> CreateSubtask(int id, [FromBody] Unity.Core.DTOs.CreateSubtaskRequest request)
        {
            var task = await _context.Tasks
                .Include(t => t.Assignees)
                .Include(t => t.Subtasks)
                .FirstOrDefaultAsync(t => t.Id == id);
            if (task == null) return NotFound();

            var currentUser = await GetCurrentUserWithDeptsAsync();
            // Basic write access check
            if (!await HasWriteAccessAsync(task, currentUser))
            {
                return StatusCode(403, new { message = "Yetkisiz işlem." });
            }

            var subtask = new Subtask
            {
                TaskId = id,
                Title = request.Title,
                IsCompleted = request.IsCompleted,
                CreatedBy = currentUser.Id,
                CreatedAt = TimeHelper.Now,
                StartDate = request.StartDate,
                DueDate = request.DueDate,
                Position = request.Position ?? (task.Subtasks.Any() ? task.Subtasks.Max(s => s.Position) + 1 : 0)
            };

            if (request.AssigneeId.HasValue)
            {
                subtask.Assignees.Add(new TaskAssignee { UserId = request.AssigneeId.Value });
            }

            _context.Subtasks.Add(subtask);
            await _context.SaveChangesAsync();

            // Clear tracker to ensure fresh read of parent with new subtask
            _context.ChangeTracker.Clear();

            // Broadcast Parent Task Update
            var parentTask = await _context.Tasks.AsNoTracking()
                .Include(t => t.Assignees)
                .Include(t => t.Labels)
                .Include(t => t.Subtasks).ThenInclude(s => s.Assignees)
                .Include(t => t.Comments).ThenInclude(c => c.User)
                .Include(t => t.Attachments)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (parentTask != null)
            {
                await _hubContext.Clients.All.SendAsync("TaskUpdated", parentTask);
            }

            // Send Email Notifications Async
            if (request.AssigneeId.HasValue && request.AssigneeId.Value != currentUser.Id)
            {
                SendAssignmentEmailsInBackground(task.Id, new List<int> { request.AssigneeId.Value }, currentUser.Id, $"{task.Title} / {subtask.Title}");
            }

            return Ok(subtask);
        }

        [HttpPost("{id:int}/comments")]
        public async Task<ActionResult<Comment>> CreateComment(int id, [FromBody] Unity.Core.DTOs.CreateCommentRequest request)
        {
            var task = await _context.Tasks
                .Include(t => t.Assignees)
                .FirstOrDefaultAsync(t => t.Id == id);
            if (task == null) return NotFound();

            var currentUser = await GetCurrentUserWithDeptsAsync();
            // Commenting allowed if you can view the task usually, but strict write access is safer
            // Assuming anyone who can view internal tasks can comment
            if (!await HasWriteAccessAsync(task, currentUser))
            {
                // Maybe relax for comments? For now keep consistent.
                return StatusCode(403, new { message = "Yetkisiz işlem." });
            }

            var comment = new Comment
            {
                TaskId = id,
                Text = request.Text,
                CreatedBy = currentUser.Id,
                CreatedAt = TimeHelper.Now
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            return Ok(comment);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null) return NotFound();

            var currentUser = await GetCurrentUserWithDeptsAsync();

            // Strict Delete Permission: Only Creator or Admin
            if (task.CreatedBy != currentUser.Id && currentUser.Role != "admin")
            {
                return StatusCode(403, new
                {
                    message = "Görevi sadece oluşturan kişi veya yönetici silebilir.",
                    title = "Yetkisiz İşlem"
                });
            }

            // Soft Delete Implementation
            try 
            {
                Console.WriteLine($"[DEBUG] DeleteTask Requested for ID: {id}");
                task.IsDeleted = true;
                task.DeletedAt = DateTime.UtcNow;
                
                _context.Entry(task).State = EntityState.Modified;
                
                Console.WriteLine($"[DEBUG] Saving Soft Delete for Task {id}...");
                await _context.SaveChangesAsync();
                Console.WriteLine($"[DEBUG] Task {id} Soft Deleted Successfully.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DELETE ERROR] {ex.Message}");
                Console.WriteLine($"[DELETE STACK] {ex.StackTrace}");
                return StatusCode(500, "Görevi silerken bir hata oluştu.");
            }

            // Broadcast
            await _hubContext.Clients.All.SendAsync("TaskDeleted", id);

            return NoContent();
        }

        [HttpDelete("subtasks/{subtaskId}")]
        public async Task<IActionResult> DeleteSubtask(int subtaskId)
        {

            var subtask = await _context.Subtasks.FindAsync(subtaskId);
            if (subtask == null)
            {

                return NotFound();
            }

            var task = await _context.Tasks
                .Include(t => t.Assignees)
                .FirstOrDefaultAsync(t => t.Id == subtask.TaskId);

            if (task == null) return NotFound();

            var currentUser = await GetCurrentUserWithDeptsAsync();
            if (!await HasWriteAccessAsync(task, currentUser))
            {

                return StatusCode(403, new { message = "Yetkisiz işlem." });
            }

            _context.Subtasks.Remove(subtask);
            await _context.SaveChangesAsync();

            // Clear tracker to ensure fresh read
            _context.ChangeTracker.Clear();

            // Broadcast Parent Task Update
            var parentTask = await _context.Tasks.AsNoTracking()
                 .Include(t => t.Assignees)
                 .Include(t => t.Labels)
                 .Include(t => t.Subtasks).ThenInclude(s => s.Assignees)
                 .Include(t => t.Comments).ThenInclude(c => c.User)
                 .Include(t => t.Attachments)
                 .FirstOrDefaultAsync(t => t.Id == task.Id);

            if (parentTask != null)
            {
                await _hubContext.Clients.All.SendAsync("TaskUpdated", parentTask);
            }

            return NoContent();
        }

        [HttpDelete("comments/{commentId}")]
        public async Task<IActionResult> DeleteComment(int commentId)
        {
            // ... (existing code, can skip logging for now to keep focus on subtasks)
            var comment = await _context.Comments.FindAsync(commentId);
            if (comment == null) return NotFound();

            var task = await _context.Tasks
                .Include(t => t.Assignees)
                .FirstOrDefaultAsync(t => t.Id == comment.TaskId);

            if (task == null) return NotFound();

            var currentUser = await GetCurrentUserWithDeptsAsync();

            // Allow if admin, task owner, or comment creator
            bool canDelete = string.Equals(currentUser.Role, "admin", StringComparison.OrdinalIgnoreCase) ||
                             task.AssignedBy == currentUser.Id ||
                             comment.CreatedBy == currentUser.Id;

            if (!canDelete)
            {
                return StatusCode(403, new { message = "Yorumu silme yetkiniz yok." });
            }

            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        [HttpDelete("attachments/{attachmentId}")]
        public async Task<IActionResult> DeleteAttachment(int attachmentId)
        {
            // ... existing code
            var attachment = await _context.Attachments.FindAsync(attachmentId);
            if (attachment == null) return NotFound();

            var task = await _context.Tasks
                .Include(t => t.Assignees)
                .FirstOrDefaultAsync(t => t.Id == attachment.TaskId);

            if (task == null) return NotFound();

            var currentUser = await GetCurrentUserWithDeptsAsync();

            // Allow if admin, task owner, or uploader
            bool canDelete = string.Equals(currentUser.Role, "admin", StringComparison.OrdinalIgnoreCase) ||
                             task.AssignedBy == currentUser.Id ||
                             attachment.CreatedBy == currentUser.Id;

            if (!canDelete)
            {
                return StatusCode(403, new { message = "Dosyayı silme yetkiniz yok." });
            }

            // Optional: Delete physical file from 'wwwroot/uploads' if needed
            // For now, just removing DB record.

            _context.Attachments.Remove(attachment);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPut("reorder-subtasks")]
        public async Task<IActionResult> BulkUpdateSubtaskPositions([FromBody] JsonElement body)
        {
            if (body.ValueKind != JsonValueKind.Object || !body.TryGetProperty("items", out var itemsElement) || itemsElement.ValueKind != JsonValueKind.Array)
            {
                return BadRequest("Geçersiz istek formatı.");
            }

            var items = new List<SubtaskReorderItem>();
            foreach (var item in itemsElement.EnumerateArray())
            {
                if (item.TryGetProperty("id", out var idProp) && item.TryGetProperty("position", out var posProp))
                {
                    items.Add(new SubtaskReorderItem { Id = idProp.GetInt32(), Position = posProp.GetInt32() });
                }
            }

            if (!items.Any()) return BadRequest("Sıralanacak öğe bulunamadı.");

            var currentUser = await GetCurrentUserWithDeptsAsync();
            var subtaskIds = items.Select(i => i.Id).ToList();
            
            var subtasks = await _context.Subtasks
                .Include(s => s.Task)
                .Where(s => subtaskIds.Contains(s.Id))
                .ToListAsync();

            if (subtasks.Count == 0) return NotFound("Alt görevler bulunamadı.");

            if (!await HasWriteAccessAsync(subtasks.First().Task, currentUser))
            {
                return StatusCode(403, new { message = "Sıralama değiştirme yetkiniz yok." });
            }

            foreach (var subtask in subtasks)
            {
                var update = items.First(i => i.Id == subtask.Id);
                subtask.Position = update.Position;
            }

            try
            {
                await _context.SaveChangesAsync();
                Console.WriteLine($"[DEBUG] Bulk Subtask Reorder Successful for Task {subtasks.First().TaskId}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Bulk Subtask Reorder Failed: {ex.Message}");
                return StatusCode(500, new { message = "Sunucu hatası: Sıralama kaydedilemedi" });
            }

            // Broadcast Parent Task Update
            var firstSubtask = subtasks.First();
            var parentTask = await _context.Tasks.AsNoTracking()
                 .Include(t => t.Assignees)
                 .Include(t => t.Labels)
                 .Include(t => t.Subtasks.OrderBy(s => s.Position)).ThenInclude(s => s.Assignees)
                 .Include(t => t.Comments).ThenInclude(c => c.User)
                 .Include(t => t.Attachments)
                 .FirstOrDefaultAsync(t => t.Id == firstSubtask.TaskId);

            if (parentTask != null)
            {
                try { await _hubContext.Clients.All.SendAsync("TaskUpdated", parentTask); } catch (Exception ex) { Console.WriteLine($"[WARNING] SignalR Failed: {ex.Message}"); }
            }

            return Ok(new { message = "Sıralama güncellendi" });
        }

        [HttpPut("subtasks/{subtaskId}")]
        public async Task<ActionResult<Subtask>> UpdateSubtask(int subtaskId, [FromBody] JsonElement body)
        {
            var subtask = await _context.Subtasks
                .Include(s => s.Assignees)
                .FirstOrDefaultAsync(s => s.Id == subtaskId);
            if (subtask == null) return NotFound();

            var task = await _context.Tasks
                .Include(t => t.Assignees)
                .FirstOrDefaultAsync(t => t.Id == subtask.TaskId);

            if (task == null) return NotFound();

            var currentUser = await GetCurrentUserWithDeptsAsync();
            if (!await HasWriteAccessAsync(task, currentUser))
            {
                return StatusCode(403, new { message = "Yetkisiz işlem." });
            }

            // Capture new assignees for email
            var newAssigneeIdsForEmail = new HashSet<int>();

            // Capture old values for logging
            var oldSubStartDate = subtask.StartDate;
            var oldSubDueDate = subtask.DueDate;

            // ROBUST PARTIAL UPDATE (PATCH-LIKE BEHAVIOR)
            // We iterate over the JSON properties to determine what to update.
            // This prevents "missing" fields from overwriting existing data with null.

            foreach (var property in body.EnumerateObject())
            {
                if (property.NameEquals("title"))
                {
                    if (property.Value.ValueKind == JsonValueKind.String)
                        subtask.Title = property.Value.GetString();
                }
                else if (property.NameEquals("isCompleted"))
                {
                    if (property.Value.ValueKind == JsonValueKind.True || property.Value.ValueKind == JsonValueKind.False)
                        subtask.IsCompleted = property.Value.GetBoolean();
                }
                else if (property.NameEquals("assigneeId"))
                {
                    if (property.Value.ValueKind == JsonValueKind.Number)
                    {
                        var newUid = property.Value.GetInt32();
                        subtask.Assignees.Clear();
                        subtask.Assignees.Add(new TaskAssignee { UserId = newUid, SubtaskId = subtaskId });
                        await _activityLogger.LogChangeAsync(currentUser.Id, "ASSIGN", "Subtask", subtask.Id.ToString(), "Assignee", null, newUid);
                        if (newUid != currentUser.Id) newAssigneeIdsForEmail.Add(newUid);
                    }
                    else if (property.Value.ValueKind == JsonValueKind.String && int.TryParse(property.Value.GetString(), out var uid))
                    {
                        subtask.Assignees.Clear();
                        subtask.Assignees.Add(new TaskAssignee { UserId = uid, SubtaskId = subtaskId });
                        await _activityLogger.LogChangeAsync(currentUser.Id, "ASSIGN", "Subtask", subtask.Id.ToString(), "Assignee", null, uid);
                        if (uid != currentUser.Id) newAssigneeIdsForEmail.Add(uid);
                    }
                    else if (property.Value.ValueKind == JsonValueKind.Null)
                    {
                        subtask.Assignees.Clear();
                        await _activityLogger.LogChangeAsync(currentUser.Id, "UNASSIGN", "Subtask", subtask.Id.ToString(), "Assignee", null, null);
                    }
                }
                else if (property.NameEquals("assignees"))
                {
                    if (property.Value.ValueKind == JsonValueKind.Array)
                    {
                        Console.WriteLine($"[DEBUG] UpdateSubtask Assignees: Processing array...");
                        var newAssigneeIds = new HashSet<int>();
                        foreach (var item in property.Value.EnumerateArray())
                        {
                            int? uid = null;
                            if (item.ValueKind == JsonValueKind.Number) uid = item.GetInt32();
                            else if (item.ValueKind == JsonValueKind.String && int.TryParse(item.GetString(), out var parsed)) uid = parsed;

                            if (uid.HasValue) newAssigneeIds.Add(uid.Value);
                        }
                        Console.WriteLine($"[DEBUG] New Assignee IDs: {string.Join(",", newAssigneeIds)}");

                        // Remove removed assignees
                        var toRemove = subtask.Assignees.Where(a => !newAssigneeIds.Contains(a.UserId)).ToList();
                        Console.WriteLine($"[DEBUG] Removing {toRemove.Count} assignees...");
                        foreach (var item in toRemove)
                        {
                            _context.TaskAssignees.Remove(item);
                            await _activityLogger.LogChangeAsync(currentUser.Id, "UNASSIGN", "Subtask", subtask.Id.ToString(), "Assignee", item.UserId, null);
                        }

                        // Add new assignees
                        var existingIds = subtask.Assignees.Select(a => a.UserId).ToHashSet();
                        foreach (var newId in newAssigneeIds)
                        {
                            if (!existingIds.Contains(newId))
                            {
                                Console.WriteLine($"[DEBUG] Adding assignee {newId} to subtask {subtaskId}");
                                subtask.Assignees.Add(new TaskAssignee { UserId = newId, SubtaskId = subtaskId });
                                await _activityLogger.LogChangeAsync(currentUser.Id, "ASSIGN", "Subtask", subtask.Id.ToString(), "Assignee", null, newId);
                                if (newId != currentUser.Id) newAssigneeIdsForEmail.Add(newId);
                            }
                        }
                    }
                }
                else if (property.NameEquals("startDate"))
                {
                    if (property.Value.ValueKind == JsonValueKind.String && property.Value.TryGetDateTime(out var date))
                    {
                        subtask.StartDate = date.ToUniversalTime();
                    }
                    else if (property.Value.ValueKind == JsonValueKind.Null)
                    {
                        subtask.StartDate = null;
                    }
                }
                else if (property.NameEquals("dueDate"))
                {
                    if (property.Value.ValueKind == JsonValueKind.String && property.Value.TryGetDateTime(out var date))
                    {
                        subtask.DueDate = date.ToUniversalTime();
                    }
                    else if (property.Value.ValueKind == JsonValueKind.Null)
                    {
                        subtask.DueDate = null;
                    }
                }
                else if (property.NameEquals("position"))
                {
                    if (property.Value.ValueKind == JsonValueKind.Number)
                    {
                        subtask.Position = property.Value.GetInt32();
                    }
                }
            }

            try
            {
                await _context.SaveChangesAsync();

                // Log date changes for subtasks
                if (oldSubStartDate != subtask.StartDate)
                {
                    await _activityLogger.LogChangeAsync(currentUser.Id, "UPDATE", "Subtask", subtask.Id.ToString(), "StartDate", oldSubStartDate, subtask.StartDate);
                }
                if (oldSubDueDate != subtask.DueDate)
                {
                    await _activityLogger.LogChangeAsync(currentUser.Id, "UPDATE", "Subtask", subtask.Id.ToString(), "DueDate", oldSubDueDate, subtask.DueDate);
                }
            }
            catch (Exception dbEx)
            {
                Console.WriteLine($"[CRITICAL] Subtask DB Save Failed: {dbEx}");
                return StatusCode(500, new { message = "Alt görev kayıt hatası", error = dbEx.Message });
            }

            // Clear tracker to ensure fresh read
            _context.ChangeTracker.Clear();

            // Broadcast Parent Task Update
            var parentTask = await _context.Tasks.AsNoTracking()
                 .Include(t => t.Assignees)
                 .Include(t => t.Labels)
                 .Include(t => t.Subtasks).ThenInclude(s => s.Assignees)
                 .Include(t => t.Comments).ThenInclude(c => c.User)
                 .Include(t => t.Attachments)
                 .FirstOrDefaultAsync(t => t.Id == task.Id);

            if (parentTask != null)
            {
                try { await _hubContext.Clients.All.SendAsync("TaskUpdated", parentTask); } catch (Exception ex) { Console.WriteLine($"[WARNING] SignalR Failed: {ex.Message}"); }
            }

            // Send Email Notifications for New Assignees
            if (newAssigneeIdsForEmail.Count > 0)
            {
                SendAssignmentEmailsInBackground(task.Id, newAssigneeIdsForEmail.ToList(), currentUser.Id, $"{task.Title} / {subtask.Title}");
            }


            return Ok(subtask);
        }
        private void SendAssignmentEmailsInBackground(int taskId, List<int> assigneeIds, int currentUserId, string taskTitleOverride = null)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    using (var scope = _scopeFactory.CreateScope())
                    {
                        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                        var emailService = scope.ServiceProvider.GetRequiredService<Unity.Infrastructure.Services.IEmailService>();

                        // Fetch Task with Subtasks and their Assignees
                        var task = await context.Tasks
                            .Include(t => t.Assignees).ThenInclude(a => a.User)
                            .Include(t => t.Subtasks).ThenInclude(s => s.Assignees).ThenInclude(sa => sa.User)
                            .FirstOrDefaultAsync(t => t.Id == taskId);

                        if (task == null) return;

                        var project = await context.Projects.FindAsync(task.ProjectId);
                        var projectTitle = project?.Name ?? "Bilinmeyen Proje";

                        var department = await context.Departments.FindAsync(project?.DepartmentId);
                        var workGroupName = department?.Name ?? "Genel Çalışma Grubu";

                        var currentUser = await context.Users.FindAsync(currentUserId);
                        var assignerName = currentUser?.FullName ?? "Bir Kullanıcı";

                        // Prepare Subtasks DTO
                        var subtasksDto = task.Subtasks.Select(s => new EmailSubtaskDto
                        {
                            Id = s.Id,
                            Title = s.Title,
                            IsCompleted = s.IsCompleted,
                            StartDate = s.StartDate,
                            Assignees = s.Assignees.Select(a => new EmailAssigneeDto
                            {
                                UserId = a.UserId,
                                FullName = a.User.FullName,
                                Initials = (a.User.FullName != null) 
                                    ? new string(a.User.FullName.Split(' ', StringSplitOptions.RemoveEmptyEntries).Select(s => s[0]).ToArray()).ToUpper().Substring(0, Math.Min(2, a.User.FullName.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length))
                                    : "??",
                                ColorClass = a.User.Avatar // Using Avatar field for color if available, or fallback in service
                            }).ToList()
                        }).ToList();

                        foreach (var userId in assigneeIds)
                        {
                            if (userId == currentUserId) continue;

                            var assignedUser = await context.Users.FindAsync(userId);
                            if (assignedUser != null && !string.IsNullOrEmpty(assignedUser.Email))
                            {
                                await emailService.SendTaskAssignmentEmailAsync(
                                    assignedUser.Email,
                                    assignedUser.FullName,
                                    task.Description,
                                    assignerName,
                                    workGroupName,
                                    projectTitle,
                                    task.Title,
                                    null, // We are sending main task email with subtasks list
                                    task.Priority ?? "Normal",
                                    task.DueDate,
                                    task.ProjectId,
                                    task.Id,
                                    subtasksDto
                                );
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    try
                    {
                        var errorPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "email_error.txt");
                        System.IO.File.WriteAllText(errorPath, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] ERROR: {ex.Message}\n{ex.StackTrace}");
                    }
                    catch { }
                    Console.WriteLine($"Error sending assignment email: {ex.Message}");
                }
            });
        }
    }
}
