using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unity.Core.Models;
using Unity.Infrastructure.Data;
using System.Text.Json;

namespace Unity.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TasksController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly Unity.Infrastructure.Services.IAuditService _auditService;

        public TasksController(AppDbContext context, Unity.Infrastructure.Services.IAuditService auditService)
        {
            _context = context;
            _auditService = auditService;
        }

        // Mock Helper
        private async Task<User> GetCurrentUserAsync()
        {
            if (Request.Headers.TryGetValue("X-Test-User-Id", out var userId))
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.ToString());
                if (user != null) return user;
            }
            return await _context.Users.FirstOrDefaultAsync() ?? new User { Id = "test-user", Departments = new List<string> { "IT" } };
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TaskItem>>> GetTasks([FromQuery] string? projectId)
        {
            var currentUser = await GetCurrentUserAsync();
            var userDeptList = currentUser.Departments ?? new List<string>();

            Console.WriteLine($"DEBUG: GetTasks Called. User: {currentUser.Id} ({currentUser.FullName})");
            Console.WriteLine($"DEBUG: User Departments: {string.Join(", ", userDeptList)}");

            // 1. Get all tasks (filtered by projectId if provided)
            IQueryable<TaskItem> query = _context.Tasks;
            if (!string.IsNullOrEmpty(projectId))
            {
                query = query.Where(t => t.ProjectId == projectId);
            }
            var allTasks = await query.ToListAsync();
            Console.WriteLine($"DEBUG: Total Tasks in DB (pre-filter): {allTasks.Count}");

            // 2. Get all projects to check permissions (CACHE THIS in real app)
            var allProjects = await _context.Projects.ToListAsync();
            var accessibleProjectIds = allProjects.Where(p => 
                currentUser.Role == "admin" || // Admin bypass
                p.Owner == currentUser.Id || 
                p.Members.Contains(currentUser.Id) || 
                (userDeptList.Contains(p.Department) && !p.IsPrivate)
            ).Select(p => p.Id).ToHashSet();
            Console.WriteLine($"DEBUG: Accessible Projects: {string.Join(", ", accessibleProjectIds)}");

            // 3. Filter Tasks
            // Visible if: Parent Project is Accessible AND (Task Local Visibility)
            var visibleTasks = allTasks.Where(t => 
                t.ProjectId != null && accessibleProjectIds.Contains(t.ProjectId) && 
                (!t.IsPrivate || 
                 t.AssignedBy == currentUser.Id || 
                 (t.Assignees != null && t.Assignees.Contains(currentUser.Id)))
            ).ToList();
            Console.WriteLine($"DEBUG: Visible Tasks: {visibleTasks.Count}");

            return visibleTasks;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TaskItem>> GetTask(string id)
        {
            var task = await _context.Tasks.FindAsync(id);

            if (task == null)
            {
                return NotFound();
            }

            return task;
        }

        [HttpPost]
        public async Task<ActionResult<TaskItem>> PostTask(TaskItem task)
        {
            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();
            
            var currentUser = await GetCurrentUserAsync();
            await _auditService.LogAsync(currentUser.Id, "CREATE_TASK", "Task", task.Id, null, task, $"Task '{task.Title}' created.");

            return CreatedAtAction("GetTask", new { id = task.Id }, task);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<TaskItem>> PutTask(string id, TaskItem task)
        {
            if (id != task.Id)
            {
                return BadRequest();
            }

            // Capture old state not fully efficient here due to EntityState.Modified, 
            // but for audit we might want to fetch AsNoTracking first if we need accurate diff.
            // For now, logging the 'task' input as NEW value. Old value is tricky without extra fetch.
            // Let's do a quick fetch for old state since audit is important.
            var oldTask = await _context.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id);
            
            _context.Entry(task).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
                var currentUser = await GetCurrentUserAsync();
                await _auditService.LogAsync(currentUser.Id, "UPDATE_TASK", "Task", task.Id, oldTask, task, $"Task '{task.Title}' updated.");
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TaskExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            // Return the updated task so frontend can update its state
            return Ok(task);
        }

        [HttpPatch("{id}")]
        public async Task<ActionResult<TaskItem>> PatchTask(string id, [FromBody] System.Text.Json.JsonElement body)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null) return NotFound();

            foreach (var property in body.EnumerateObject())
            {
                switch (property.Name.ToLower())
                {
                    case "title":
                        if (property.Value.ValueKind == JsonValueKind.String) task.Title = property.Value.GetString();
                        break;
                    case "description":
                        if (property.Value.ValueKind == JsonValueKind.String) task.Description = property.Value.GetString();
                        else if (property.Value.ValueKind == JsonValueKind.Null) task.Description = null;
                        break;
                    case "status":
                        if (property.Value.ValueKind == JsonValueKind.String) task.Status = property.Value.GetString();
                        break;
                    case "priority":
                        if (property.Value.ValueKind == JsonValueKind.String) task.Priority = property.Value.GetString();
                        break;
                    case "tshirtsize":
                        if (property.Value.ValueKind == JsonValueKind.String) task.TShirtSize = property.Value.GetString();
                        else if (property.Value.ValueKind == JsonValueKind.Null) task.TShirtSize = null;
                        break;
                    case "startdate":
                        if (property.Value.TryGetDateTime(out var startDate)) task.StartDate = startDate.ToUniversalTime();
                        else if (property.Value.ValueKind == JsonValueKind.Null) task.StartDate = null;
                        break;
                    case "duedate":
                        if (property.Value.TryGetDateTime(out var dueDate)) task.DueDate = dueDate.ToUniversalTime();
                        else if (property.Value.ValueKind == JsonValueKind.Null) task.DueDate = null;
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
                             var list = new List<string>();
                             foreach (var item in property.Value.EnumerateArray())
                             {
                                 if (item.ValueKind == JsonValueKind.String) list.Add(item.GetString());
                             }
                             task.Assignees = list;
                         }
                         break;
                    case "labels":
                         if (property.Value.ValueKind == JsonValueKind.Array)
                         {
                             var list = new List<string>();
                             foreach (var item in property.Value.EnumerateArray())
                             {
                                 if (item.ValueKind == JsonValueKind.String) list.Add(item.GetString());
                             }
                             task.Labels = list;
                         }
                         break;
                    case "subtasks":
                        if (property.Value.ValueKind == JsonValueKind.Array)
                            task.SubtasksJson = property.Value.GetRawText();
                        break;
                    case "comments":
                        if (property.Value.ValueKind == JsonValueKind.Array)
                            task.CommentsJson = property.Value.GetRawText();
                        break;
                    case "attachments":
                        if (property.Value.ValueKind == JsonValueKind.Array)
                            task.AttachmentsJson = property.Value.GetRawText();
                        break;
                }
            }

            task.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(task);
        }
        
        [HttpPut("{id}/status")]
        public async Task<ActionResult<TaskItem>> UpdateStatus(string id, [FromQuery] string status)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null) return NotFound();
            
            var oldStatus = task.Status;
            task.Status = status;
            task.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            
            var currentUser = await GetCurrentUserAsync();
            await _auditService.LogAsync(currentUser.Id, "UPDATE_STATUS", "Task", task.Id, new { Status = oldStatus }, new { Status = status }, $"Task status changed to {status}.");
            
            return Ok(task);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(string id)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null)
            {
                return NotFound();
            }

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool TaskExists(string id)
        {
            return _context.Tasks.Any(e => e.Id == id);
        }
    }
}
