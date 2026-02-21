using Microsoft.EntityFrameworkCore;
using Unity.Core.Interfaces;
using Unity.Core.Models;
using Unity.Infrastructure.Data;
using Unity.Core.Helpers;

namespace Unity.Infrastructure.Services
{
    public class ProjectService : IProjectService
    {
        private readonly AppDbContext _context;

        public ProjectService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<dynamic>> GetProjectsAsync(int userId, string role, List<int> departmentIds)
        {
            // 1. Get IDs of projects where user is a member
            var memberProjectIds = await _context.ProjectMembers
                .AsNoTracking()
                .Where(pm => pm.UserId == userId)
                .Select(pm => pm.ProjectId)
                .ToListAsync();

            // 2. Fetch all with members (SplitQuery)
            var allProjects = await _context.Projects.AsNoTracking()
                .Include(p => p.Members)
                .AsSplitQuery()
                .Select(p => new
                {
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

            // 3. Filter in Memory
            // Strict Access Control:
            // - Owner
            // - OR Member
            // - OR (Public AND User is in Department) -- Applies to Admin too
            var visibleProjects = allProjects.Where(p =>
                p.Owner == userId ||
                memberProjectIds.Contains(p.ProjectId) ||
                (!p.IsPrivate && (departmentIds.Contains(p.DepartmentId)))
            ).ToList();

            return visibleProjects;
        }

        public async Task<Project?> GetProjectByIdAsync(int id, int userId, string role, List<int> departmentIds)
        {
            var project = await _context.Projects.AsNoTracking()
                .Include(p => p.Members).ThenInclude(m => m.User)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null) return null;

            // 1. Owner Access
            if (project.Owner == userId)
            {
                return project;
            }

            // 2. Member Access (Explicit Check)
            if (project.Members.Any(m => m.UserId == userId))
            {
                return project;
            }

            // 3. Department Access (Applies to Admin too)
            // Even if Admin, they must be in the department list to access public projects
            // Private projects are strictly Owner/Member only
            if (!project.IsPrivate && departmentIds != null && departmentIds.Contains(project.DepartmentId))
            {
                return project;
            }

            // 5. Explicit Deny
            return null;

            // DATA REPAIR Check (Optional, nice to keep)
            if (project.Id == 85 && project.Owner == 0)
            {
                // Simple repair attempt logic, avoiding context complex queries if possible
                 // ... omitted for brevity unless critical
            }

            return project;
        }

        public async Task<Project> CreateProjectAsync(Project project, int userId, string role, List<UserDepartment> departments)
        {
             // Department Validation Logic moved from Controller?
             // Or keep validation in Controller and just execute here?
             // Let's assume validation happens in Controller or here. 
             // Ideally here, but access to user deps is passed via params.

             project.CreatedBy = userId;
             project.Owner = userId;
             project.Members = new List<ProjectMember> { new ProjectMember { UserId = userId } };
             project.CreatedAt = TimeHelper.Now;
             project.UpdatedAt = TimeHelper.Now;
             
             _context.Projects.Add(project);
             await _context.SaveChangesAsync();
             return project;
        }

        public async Task<Project?> UpdateProjectAsync(int id, Project project, int userId, string role, List<int> departmentIds)
        {
            var existingProject = await _context.Projects
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (existingProject == null) return null;

            // Permission Check
            bool canEdit = string.Equals(role, "admin", StringComparison.OrdinalIgnoreCase) ||
                           existingProject.Owner == userId ||
                           existingProject.Members.Any(PM => PM.UserId == userId);

            if (!canEdit) return null; // or throw Forbidden

            existingProject.Name = project.Name;
            existingProject.Description = project.Description;
            existingProject.Icon = project.Icon;
            existingProject.Color = project.Color;
            existingProject.IsPrivate = project.IsPrivate;
            existingProject.Status = project.Status;
            existingProject.Priority = project.Priority;
            existingProject.UpdatedAt = TimeHelper.Now;

            if (project.Members != null && project.Members.Count > 0)
            {
                existingProject.Members = project.Members;
            }

            // _context.Entry(existingProject).State = EntityState.Modified; // EF tracks changes automatically when fetched
            await _context.SaveChangesAsync();
            return existingProject;
        }

        public async Task<bool> DeleteProjectAsync(int id, int userId, string role)
        {
             var project = await _context.Projects.FindAsync(id);
             if (project == null) return false;

             if (project.Owner != userId && role != "admin") return false; // Forbidden

             // Cascade Delete Logic
             var projectTasks = await _context.Tasks.Where(t => t.ProjectId == id).ToListAsync();
             if (projectTasks.Any())
             {
                 var taskIds = projectTasks.Select(t => t.Id).ToList();
                 var subtasks = await _context.Set<Subtask>().Where(s => taskIds.Contains(s.TaskId)).ToListAsync();
                 var subtaskIds = subtasks.Select(s => s.Id).ToList();

                 var assignees = await _context.Set<TaskAssignee>()
                     .Where(a => (a.TaskId != null && taskIds.Contains(a.TaskId.Value)) ||
                                 (a.SubtaskId != null && subtaskIds.Contains(a.SubtaskId.Value)))
                     .ToListAsync();
                 _context.Set<TaskAssignee>().RemoveRange(assignees);

                 _context.Set<Subtask>().RemoveRange(subtasks);

                 var comments = await _context.Comments.Where(c => taskIds.Contains(c.TaskId)).ToListAsync();
                 _context.Comments.RemoveRange(comments);

                 var taskLabels = await _context.Set<TaskLabel>().Where(tl => taskIds.Contains(tl.TaskId)).ToListAsync();
                 _context.Set<TaskLabel>().RemoveRange(taskLabels);

                 var attachments = await _context.Attachments.Where(a => taskIds.Contains(a.TaskId)).ToListAsync();
                 _context.Attachments.RemoveRange(attachments);

                 _context.Tasks.RemoveRange(projectTasks);
             }

             var labels = await _context.Labels.Where(l => l.ProjectId == id).ToListAsync();
             _context.Labels.RemoveRange(labels);

             var userPrefs = await _context.Set<UserProjectPreference>().Where(up => up.ProjectId == id).ToListAsync();
             _context.Set<UserProjectPreference>().RemoveRange(userPrefs);

             var members = await _context.Set<ProjectMember>().Where(pm => pm.ProjectId == id).ToListAsync();
             if (members.Any()) _context.Set<ProjectMember>().RemoveRange(members);

             // Log Cleanup
             var sId = id.ToString();
             var logs = await _context.Set<ActivityLog>().Where(a => a.EntityType == "Project" && a.EntityId == sId).ToListAsync();
             _context.Set<ActivityLog>().RemoveRange(logs);

             _context.Projects.Remove(project);
             await _context.SaveChangesAsync();
             return true;
        }

        public async Task<Project?> ToggleFavoriteAsync(int id, int userId, string role, List<int> departmentIds)
        {
             // Simplified logic, access check same as Get
             var project = await GetProjectByIdAsync(id, userId, role, departmentIds);
             if (project == null) return null;
             
             // project.Favorite = !project.Favorite; 
             // await _context.SaveChangesAsync();
             return project;
        }
    }
}
