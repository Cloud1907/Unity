using Microsoft.EntityFrameworkCore;
using Unity.Core.DTOs;
using Unity.Core.DTOs.Dashboard;
using Unity.Core.Interfaces;
using Unity.Core.Models;
using Unity.Infrastructure.Data;
using Unity.Core.Helpers;

namespace Unity.Infrastructure.Services
{
    public class TaskService : ITaskService
    {
        private readonly AppDbContext _context;

        public TaskService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<DashboardStatsDto> GetDashboardStatsAsync(int userId)
        {
            // RELIABLE STATS: Direct LINQ Query
            var stats = await _context.TaskAssignees
                .Where(ta => ta.UserId == userId && ta.Task != null && !ta.Task.IsDeleted)
                .Select(ta => ta.Task)
                .GroupBy(t => 1)
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

            return stats ?? new DashboardStatsDto { UserId = userId };
        }

        public async Task<PaginatedTasksResponse> GetDashboardTasksAsync(int userId, int page, int pageSize)
        {
             var baseQuery = _context.Tasks.AsNoTracking()
                .Where(t => t.Assignees.Any(a => a.UserId == userId) && !t.IsDeleted);

            var totalCount = await baseQuery.CountAsync();

            var tasks = await baseQuery
                .OrderByDescending(t => t.Priority)
                .ThenBy(t => t.DueDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new TaskItemDto
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
                    AssigneeIds = t.Assignees.Select(a => a.UserId).ToList()
                }).ToListAsync();

            return new PaginatedTasksResponse
            {
                Tasks = tasks,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                HasMore = (page * pageSize) < totalCount
            };
        }

        public async Task<PaginatedTasksResponse> GetTasksAsync(int? projectId, string? status, int? assignedTo, int page, int pageSize)
        {
            var query = _context.Tasks.AsNoTracking()
                .Where(t => !t.IsDeleted);

            if (projectId.HasValue)
                query = query.Where(t => t.ProjectId == projectId.Value);

            if (!string.IsNullOrEmpty(status))
                query = query.Where(t => t.Status == status);

            if (assignedTo.HasValue)
                query = query.Where(t => t.Assignees.Any(a => a.UserId == assignedTo.Value));

            var totalCount = await query.CountAsync();

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
                    CompletedAt = t.CompletedAt,
                    ProjectId = t.ProjectId,
                    ProjectName = t.Project.Name,
                    ProjectColor = t.Project.Color,
                    AssigneeIds = new List<int>(), // Populated below
                    LabelIds = new List<int>(),    // Populated below
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

            // Batch Load Relations
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
                    if (assigneesByTask.TryGetValue(task.Id, out var aIds)) task.AssigneeIds = aIds;
                    if (labelsByTask.TryGetValue(task.Id, out var lIds)) task.LabelIds = lIds;
                }
            }

            return new PaginatedTasksResponse
            {
                Tasks = tasks,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                HasMore = (page * pageSize) < totalCount
            };
        }

        public async Task<TaskItem?> GetTaskByIdAsync(int id)
        {
            return await _context.Tasks.AsNoTracking()
                .Include(t => t.Assignees).ThenInclude(a => a.User)
                .Include(t => t.Labels).ThenInclude(l => l.Label)
                .Include(t => t.Subtasks.OrderBy(s => s.Position)).ThenInclude(s => s.Assignees).ThenInclude(a => a.User)
                .Include(t => t.Comments).ThenInclude(c => c.User)
                .Include(t => t.Attachments)
                .AsSplitQuery()
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<TaskItemDto> CreateTaskAsync(TaskCreateDto dto, int userId)
        {
            var task = new TaskItem
            {
                Title = dto.Title,
                Description = dto.Description,
                TaskUrl = dto.TaskUrl,
                ProjectId = dto.ProjectId,
                Status = dto.Status ?? "todo",
                Priority = dto.Priority ?? "medium",
                StartDate = dto.StartDate?.ToUniversalTime(),
                DueDate = dto.DueDate?.ToUniversalTime(),
                AssignedBy = userId,
                CreatedBy = userId,
                CreatedAt = TimeHelper.Now,
                UpdatedAt = TimeHelper.Now,
                Progress = 0
            };

            if (dto.AssigneeIds != null)
            {
                foreach (var uid in dto.AssigneeIds)
                {
                     task.Assignees.Add(new TaskAssignee { UserId = uid });
                }
            }

            if (dto.LabelIds != null)
            {
                foreach (var lid in dto.LabelIds)
                {
                    task.Labels.Add(new TaskLabel { LabelId = lid });
                }
            }
            
            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            // Use the GetTask logic to return full DTO, but for now just Basic Mapping
            // Ideally we should reuse a DTO mapper, but copying minimal fields logic from Controller
           
            // Re-fetch to be safe with relations (Clean Read Pattern)
            _context.ChangeTracker.Clear();
             var freshTask = await _context.Tasks.AsNoTracking()
                .Include(t => t.Assignees).ThenInclude(a => a.User)
                .Include(t => t.Labels).ThenInclude(l => l.Label)
                .Include(t => t.Project)
                .FirstOrDefaultAsync(t => t.Id == task.Id);

             // Map to DTO
             return new TaskItemDto
             {
                 Id = freshTask.Id,
                 Title = freshTask.Title,
                 Description = freshTask.Description,
                 TaskUrl = freshTask.TaskUrl,
                 Status = freshTask.Status,
                 Priority = freshTask.Priority,
                 ProjectId = freshTask.ProjectId,
                 ProjectName = freshTask.Project?.Name,
                 ProjectColor = freshTask.Project?.Color,
                 StartDate = freshTask.StartDate,
                 DueDate = freshTask.DueDate,
                 Progress = freshTask.Progress,
                 CreatedAt = freshTask.CreatedAt,
                 CreatedBy = freshTask.CreatedBy,
                 AssigneeIds = freshTask.Assignees.Select(a => a.UserId).ToList(),
                 LabelIds = freshTask.Labels.Select(l => l.LabelId).ToList(),
                 SubtaskCount = 0,
                 CommentCount = 0,
                 AttachmentCount = 0
             };
        }

        public async Task<TaskItem?> UpdateTaskAsync(int id, TaskUpdateDto dto, int userId)
        {
             var task = await _context.Tasks
                .Include(t => t.Assignees)
                .Include(t => t.Labels)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null) return null;

            if (dto.Title != null) task.Title = dto.Title;
            if (dto.Description != null) task.Description = dto.Description;
            if (dto.TaskUrl != null) task.TaskUrl = dto.TaskUrl;
            if (dto.Status != null) task.Status = dto.Status;
            if (dto.Priority != null) task.Priority = dto.Priority;
            if (dto.ProjectId.HasValue) task.ProjectId = dto.ProjectId.Value;
            if (dto.StartDate.HasValue) task.StartDate = dto.StartDate.Value.ToUniversalTime();
            if (dto.DueDate.HasValue) task.DueDate = dto.DueDate.Value.ToUniversalTime();
            if (dto.Progress.HasValue) 
            {
                task.Progress = dto.Progress.Value;
            }

            // Auto-set CompletedAt and Progress based on Status
            if (dto.Status != null)
            {
                if (dto.Status == "done")
                {
                    task.Progress = 100;
                    if (task.CompletedAt == null) task.CompletedAt = DateTime.UtcNow;
                }
                else
                {
                    task.CompletedAt = null;
                    if (!dto.Progress.HasValue)
                    {
                        if ((dto.Status == "working" || dto.Status == "in_progress" || dto.Status == "review") && task.Progress == 0) 
                            task.Progress = 25;
                        if (dto.Status == "todo") 
                            task.Progress = 0;
                    }
                }
            }

            task.UpdatedAt = TimeHelper.Now;

            // Update Relations
            if (dto.AssigneeIds != null)
            {
                var toRemoveA = task.Assignees.ToList();
                _context.TaskAssignees.RemoveRange(toRemoveA);
                task.Assignees.Clear();
                foreach (var uid in dto.AssigneeIds) task.Assignees.Add(new TaskAssignee { UserId = uid, TaskId = task.Id });
            }

            if (dto.LabelIds != null)
            {
                 var toRemoveL = task.Labels.ToList();
                 _context.TaskLabels.RemoveRange(toRemoveL);
                 task.Labels.Clear();
                 foreach (var lid in dto.LabelIds) task.Labels.Add(new TaskLabel { LabelId = lid, TaskId = task.Id });
            }

            await _context.SaveChangesAsync();
            
            // Re-fetch with all relations populated
            _context.ChangeTracker.Clear();
            return await _context.Tasks.AsNoTracking()
                .Include(t => t.Assignees).ThenInclude(a => a.User)
                .Include(t => t.Labels).ThenInclude(l => l.Label)
                .Include(t => t.Subtasks.OrderBy(s => s.Position)).ThenInclude(s => s.Assignees).ThenInclude(a => a.User)
                .Include(t => t.Comments).ThenInclude(c => c.User)
                .Include(t => t.Attachments)
                .AsSplitQuery()
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<TaskItem?> UpdateTaskStatusAsync(int id, string status, int userId)
        {
             var task = await _context.Tasks.FindAsync(id);
             if (task == null) return null;

             task.Status = status;
             
             if (status == "done") 
             {
                 task.Progress = 100;
                 if (task.CompletedAt == null) task.CompletedAt = DateTime.UtcNow;
             }
             else
             {
                 task.CompletedAt = null; // Clear if re-opened
             }

             if ((status == "working" || status == "in_progress" || status == "review") && task.Progress == 0) task.Progress = 25;
             if (status == "todo") task.Progress = 0;

             task.UpdatedAt = TimeHelper.Now;
             await _context.SaveChangesAsync();
             return task;
        }

        public async Task<bool> DeleteTaskAsync(int id, int userId, bool isAdmin)
        {
            var task = await _context.Tasks
                .Include(t => t.Assignees)
                .FirstOrDefaultAsync(t => t.Id == id);
            if (task == null) return false;

            // Permission: admin, creator, assignee, or project owner can delete
            var isCreator = task.CreatedBy == userId;
            var isAssignee = task.Assignees.Any(a => a.UserId == userId);
            var project = await _context.Projects.FindAsync(task.ProjectId);
            var isProjectOwner = project != null && project.Owner == userId;

            if (!isAdmin && !isCreator && !isAssignee && !isProjectOwner) return false;

            _context.Tasks.Remove(task); 
            
            await _context.SaveChangesAsync();
            return true;
        }

        // Subtasks & Comments implementations...
        public async Task<List<Subtask>> GetSubtasksAsync(int taskId)
        {
            return await _context.Subtasks
                .Where(s => s.TaskId == taskId)
                .OrderBy(s => s.Position)
                .ToListAsync();
        }

        public async Task<Subtask?> AddSubtaskAsync(int taskId, SubtaskCreateDto dto, int userId)
        {
             var subtask = new Subtask
            {
                TaskId = taskId,
                Title = dto.Title,
                IsCompleted = dto.IsCompleted,
                StartDate = dto.StartDate,
                DueDate = dto.DueDate,
                Position = dto.Position,
                CreatedBy = userId,
                CreatedAt = TimeHelper.Now
            };

            if (dto.AssigneeIds != null && dto.AssigneeIds.Any())
            {
                foreach (var id in dto.AssigneeIds)
                {
                    subtask.Assignees.Add(new TaskAssignee { UserId = id });
                }
            }

            _context.Subtasks.Add(subtask);
            await _context.SaveChangesAsync();
            
            // Re-fetch to populate User objects for DTO
            _context.ChangeTracker.Clear();
            return await _context.Subtasks.AsNoTracking()
                .Include(s => s.Assignees).ThenInclude(a => a.User)
                .FirstOrDefaultAsync(s => s.Id == subtask.Id);
        }

        public async Task<Subtask?> UpdateSubtaskAsync(int subtaskId, SubtaskUpdateDto dto, int userId)
        {
             var subtask = await _context.Subtasks
                 .Include(s => s.Assignees)
                 .FirstOrDefaultAsync(s => s.Id == subtaskId);
                 
             if (subtask == null) return null;

             if (dto.Title != null) subtask.Title = dto.Title;
             if (dto.IsCompleted.HasValue) subtask.IsCompleted = dto.IsCompleted.Value;
             if (dto.StartDate.HasValue) subtask.StartDate = dto.StartDate;
             if (dto.DueDate.HasValue) subtask.DueDate = dto.DueDate;
             
             if (dto.AssigneeIds != null)
             {
                 var toRemoveA = subtask.Assignees.ToList();
                 _context.TaskAssignees.RemoveRange(toRemoveA);
                 subtask.Assignees.Clear();
                 foreach (var id in dto.AssigneeIds)
                 {
                     subtask.Assignees.Add(new TaskAssignee { SubtaskId = subtaskId, UserId = id });
                 }
             }

             await _context.SaveChangesAsync();
             
             // Re-fetch Subtask to populate User objects
             _context.ChangeTracker.Clear();
             return await _context.Subtasks.AsNoTracking()
                 .Include(s => s.Assignees).ThenInclude(a => a.User)
                 .FirstOrDefaultAsync(s => s.Id == subtaskId);
        }

         public async Task<bool> DeleteSubtaskAsync(int subtaskId, int userId)
        {
             var subtask = await _context.Subtasks.FindAsync(subtaskId);
             if (subtask == null) return false;
             
             _context.Subtasks.Remove(subtask);
             await _context.SaveChangesAsync();
             return true;
        }

        public async Task<bool> ReorderSubtasksAsync(SubtaskReorderRequest req, int userId)
        {
            if (req.Items == null || !req.Items.Any()) return false;

            var subtaskIds = req.Items.Select(x => x.Id).ToList();
            var subtasks = await _context.Subtasks
                .Where(s => subtaskIds.Contains(s.Id))
                .ToListAsync();

            if (!subtasks.Any()) return false;

            foreach (var item in req.Items)
            {
                var subtask = subtasks.FirstOrDefault(s => s.Id == item.Id);
                if (subtask != null)
                {
                    subtask.Position = item.Position;
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<Comment?> AddCommentAsync(int taskId, string content, int userId)
        {
             var comment = new Comment
            {
                TaskId = taskId,
                CreatedBy = userId,
                Text = content,
                CreatedAt = TimeHelper.Now
            };
            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();
            
            // Return with User for display
             return await _context.Comments.Include(c => c.User).FirstOrDefaultAsync(c => c.Id == comment.Id);
        }

        public async Task<List<Comment>> GetCommentsAsync(int taskId)
        {
            return await _context.Comments
                .Include(c => c.User)
                .Where(c => c.TaskId == taskId)
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<bool> DeleteCommentAsync(int commentId, int userId, bool isAdmin)
        {
             var comment = await _context.Comments.FindAsync(commentId);
             if (comment == null) return false;
             
             if (comment.CreatedBy != userId && !isAdmin) return false;

             _context.Comments.Remove(comment);
             await _context.SaveChangesAsync();
             return true;
        }

        public async Task<Attachment?> AddAttachmentAsync(int taskId, Attachment attachment, int userId)
        {
            attachment.TaskId = taskId;
            attachment.CreatedBy = userId;
            attachment.CreatedAt = TimeHelper.Now;
            
            _context.Attachments.Add(attachment);
            await _context.SaveChangesAsync();
            return attachment;
        }
    }
}
