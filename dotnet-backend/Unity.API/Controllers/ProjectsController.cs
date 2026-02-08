using Microsoft.AspNetCore.Authorization;
using Unity.Core.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using Unity.Core.Models;
using Unity.Infrastructure.Data;

namespace Unity.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProjectsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProjectsController(AppDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {


            var claimId = User.FindFirst("id")?.Value 
                          ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (int.TryParse(claimId, out int userId))
            {
                return userId;
            }
            throw new UnauthorizedAccessException("Invalid User ID in token.");
        }

        private async Task<User> GetCurrentUserWithDeptsAsync()
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.AsNoTracking()
                .Include(u => u.Departments)
                .FirstOrDefaultAsync(u => u.Id == userId);
                
            return user ?? throw new UnauthorizedAccessException("User not found.");
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<dynamic>>> GetProjects()
        {
            var currentUser = await GetCurrentUserWithDeptsAsync();
            var userDepts = currentUser.Departments?.Select(d => d.DepartmentId).ToList() ?? new List<int>();

            // 1. Get IDs of projects where user is a member (Lightweight query)
            var memberProjectIds = await _context.ProjectMembers
                .AsNoTracking()
                .Where(pm => pm.UserId == currentUser.Id)
                .Select(pm => pm.ProjectId)
                .ToListAsync();

            // 2. Fetch from Optimized SQL View (Lightweight DTOs)
            // 2. Fetch from TABLE with Members (Fixing "User List/Bilinmeyen User" visibility issue)
            // Replaces ProjectListViews usage which caused invisible members on frontend (filterProjectUsers)
            var allProjects = await _context.Projects.AsNoTracking()
                .Include(p => p.Members)
                .AsSplitQuery() // PERFORMANCE FIX: Avoid Cartesian explosion
                .Select(p => new {
                     p.Id,
                     ProjectId = p.Id,
                     p.Name,
                     p.Description,
                     p.DepartmentId,
                     p.Owner,
                     p.Color,
                     p.Status,
                     p.Priority,
                     p.Icon,
                     p.IsPrivate,
                     p.CreatedAt,
                     p.UpdatedAt,
                     Members = p.Members.Select(m => new { m.UserId }) 
                })
                .ToListAsync();

            // 3. Filter in Memory (Fast because DTO is small)
            var visibleProjects = allProjects.Where(p => 
                currentUser.Role == "admin" ||
                p.Owner == currentUser.Id || 
                memberProjectIds.Contains(p.ProjectId) || 
                userDepts.Contains(p.DepartmentId)
            ).ToList();

            return Ok(visibleProjects);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Project>> GetProject(int id)
        {
            var project = await _context.Projects.AsNoTracking()
                .Include(p => p.Members).ThenInclude(m => m.User)
                .FirstOrDefaultAsync(p => p.Id == id);
            
            if (project == null) 
                return NotFound();

            var currentUser = await GetCurrentUserWithDeptsAsync();
            
            bool hasAccess = currentUser.Role == "admin" ||
                             project.Owner == currentUser.Id ||
                             project.Members.Any(PM => PM.UserId == currentUser.Id) ||
                             currentUser.Departments.Any(d => d.DepartmentId == project.DepartmentId);

            if (!hasAccess) 
                return Forbid();

            // DATA REPAIR: Restore Owner for Project 85 if corrupted (corrupted by prior bug)
            if (project.Id == 85 && project.Owner == 0)
            {
                var levent = await _context.Users.FirstOrDefaultAsync(u => u.Email == "levent.demiralp@univera.com.tr");
                if (levent != null)
                {
                    _context.Entry(project).State = EntityState.Modified;
                    project.Owner = levent.Id;
                    project.CreatedBy = levent.Id;
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"[REPAIR] Restored ownership for Project 85 to User {levent.Id}");
                }
            }

            return Ok(project);
        }

        [HttpPost]
        public async Task<ActionResult<Project>> PostProject(Project project)
        {
            var currentUser = await GetCurrentUserWithDeptsAsync();

            // Department Validation
            if (project.DepartmentId > 0 && currentUser.Role != "admin")
            {
                if (!currentUser.Departments.Any(d => d.DepartmentId == project.DepartmentId))
                {
                    return BadRequest("Seçilen departmanda proje oluşturma yetkiniz yok.");
                }
            }
            else if (currentUser.Departments.Count == 1)
            {
                project.DepartmentId = currentUser.Departments[0].DepartmentId;
            }
            else if (currentUser.Departments.Count > 1 && project.DepartmentId == 0 && currentUser.Role != "admin")
            {
                return BadRequest("Lütfen bir departman seçiniz.");
            }

            // Defaults
            project.CreatedBy = currentUser.Id;
            project.Owner = currentUser.Id;
            project.Members = new List<ProjectMember> { new ProjectMember { UserId = currentUser.Id } };
            project.CreatedAt = TimeHelper.Now;
            project.UpdatedAt = TimeHelper.Now;
            
            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProject), new { id = project.Id }, project);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutProject(int id, Project project)
        {
            if (id != project.Id) 
                return BadRequest("ID mismatch.");

            var currentUser = await GetCurrentUserWithDeptsAsync();
            var existingProject = await _context.Projects.AsNoTracking()
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (existingProject == null) 
                return NotFound();

            // Permission Check: Owner, Member, or Admin
            bool canEdit = currentUser.Role == "admin" ||
                           existingProject.Owner == currentUser.Id ||
                           existingProject.Members.Any(PM => PM.UserId == currentUser.Id);

            if (!canEdit) 
                return Forbid();

            // MERGE LOGIC: Don't overwrite metadata (Owner, CreatedBy, CreatedAt)
            // If these fields are 0/Min in the incoming model (common for DTO-like updates),
            // they would destroy the record.
            
            existingProject.Name = project.Name;
            existingProject.Description = project.Description;
            existingProject.Icon = project.Icon;
            existingProject.Color = project.Color;
            existingProject.IsPrivate = project.IsPrivate;
            existingProject.Status = project.Status;
            existingProject.Priority = project.Priority;
            existingProject.UpdatedAt = TimeHelper.Now;
            
            // Allow members update if present
            if (project.Members != null && project.Members.Count > 0)
            {
                 existingProject.Members = project.Members;
            }

            _context.Entry(existingProject).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Projects.Any(e => e.Id == id)) return NotFound();
                else throw;
            }

            return Ok(existingProject);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) 
                return NotFound();

            var currentUser = await GetCurrentUserWithDeptsAsync();

            // Strict Delete Permission: Only Owner or Admin
            if (project.Owner != currentUser.Id && currentUser.Role != "admin") 
            {
                return StatusCode(403, new { 
                    message = "Projeyi sadece oluşturan kişi veya yönetici silebilir.",
                    title = "Yetkisiz İşlem"
                });
            }

            try
            {
                // Cascade Delete Logic: Manually remove all related entities to prevent FK constraints
                // 1. Get all tasks for this project
                var projectTasks = await _context.Tasks
                    .Where(t => t.ProjectId == id)
                    .ToListAsync();

                if (projectTasks.Any())
                {
                    var taskIds = projectTasks.Select(t => t.Id).ToList();

                    // 2. Get Subtasks first (need IDs for Assignee cleanup)
                    var subtasks = await _context.Set<Subtask>().Where(s => taskIds.Contains(s.TaskId)).ToListAsync();
                    var subtaskIds = subtasks.Select(s => s.Id).ToList();

                    // 3. Delete ALL Task Assignees (Linked to Task OR Subtask) - Fixes FK_TaskAssignees_Subtasks_SubtaskId
                    var assignees = await _context.Set<TaskAssignee>()
                        .Where(a => (a.TaskId != null && taskIds.Contains(a.TaskId.Value)) || 
                                    (a.SubtaskId != null && subtaskIds.Contains(a.SubtaskId.Value)))
                        .ToListAsync();
                    _context.Set<TaskAssignee>().RemoveRange(assignees);

                    // 4. Delete Subtasks
                    _context.Set<Subtask>().RemoveRange(subtasks);

                    // 5. Delete Task Comments
                    var comments = await _context.Comments.Where(c => taskIds.Contains(c.TaskId)).ToListAsync();
                    _context.Comments.RemoveRange(comments);

                    // 6. Delete Task Labels
                    var taskLabels = await _context.Set<TaskLabel>().Where(tl => taskIds.Contains(tl.TaskId)).ToListAsync();
                    _context.Set<TaskLabel>().RemoveRange(taskLabels);

                    // 7. Delete Attachments
                    var attachments = await _context.Attachments.Where(a => taskIds.Contains(a.TaskId)).ToListAsync();
                    _context.Attachments.RemoveRange(attachments);

                    // 8. Finally remove the tasks
                    _context.Tasks.RemoveRange(projectTasks);
                }

                // 9. Delete Project Labels
                var labels = await _context.Labels.Where(l => l.ProjectId == id).ToListAsync();
                _context.Labels.RemoveRange(labels);

                // 10. Delete User Project Preferences (Favorites, etc.) - CRITICAL: Has FK to Project
                var userPrefs = await _context.Set<UserProjectPreference>().Where(up => up.ProjectId == id).ToListAsync();
                _context.Set<UserProjectPreference>().RemoveRange(userPrefs);

                // 11. Delete Project Members (if explicit table exists)
                var members = await _context.Set<ProjectMember>().Where(pm => pm.ProjectId == id).ToListAsync();
                if (members.Any())
                {
                    _context.Set<ProjectMember>().RemoveRange(members);
                }

                // 12. Cleanup Logs (Optional but safer to avoid bad references)
                // Use string conversion for EntityId which is common in logs
                var sId = id.ToString();
                var activityLogs = await _context.Set<ActivityLog>()
                    .Where(a => a.EntityType == "Project" && a.EntityId == sId)
                    .ToListAsync();
                _context.Set<ActivityLog>().RemoveRange(activityLogs);

                // 13. Remove Project
                _context.Projects.Remove(project);
                
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                // Return generic error structure
                return BadRequest(new { detail = ex.InnerException?.Message ?? ex.Message });
            }
        }

        [HttpPut("{id}/favorite")]
        public async Task<ActionResult<Project>> ToggleFavorite(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) 
                return NotFound();

            var currentUser = await GetCurrentUserWithDeptsAsync();
            
            bool hasAccess = currentUser.Role == "admin" ||
                             project.Owner == currentUser.Id ||
                             project.Members.Any(PM => PM.UserId == currentUser.Id) ||
                             currentUser.Departments.Any(d => d.DepartmentId == project.DepartmentId);

            if (!hasAccess) 
                return Forbid();

            // Notes: 'Favorite' is currently a shared property on the Project model. 
            // In a future schema update, this should be moved to a UserProjectPreference table.
            // project.Favorite = !project.Favorite;
            
            // await _context.SaveChangesAsync();

            return Ok(project);
        }
    }
}
