using Unity.Core.DTOs;
using Unity.Core.Models;
using Unity.Core.DTOs.Dashboard;

namespace Unity.Core.Interfaces
{
    public interface ITaskService
    {
        // Dashboard
        Task<DashboardStatsDto> GetDashboardStatsAsync(int userId);
        Task<PaginatedTasksResponse> GetDashboardTasksAsync(int userId, int page, int pageSize);

        // Task Management
        Task<PaginatedTasksResponse> GetTasksAsync(int? projectId, string? status, int? assignedTo, int page, int pageSize);
        Task<TaskItem?> GetTaskByIdAsync(int id);
        Task<TaskItemDto> CreateTaskAsync(TaskCreateDto dto, int userId);
        Task<TaskItem?> UpdateTaskAsync(int id, TaskUpdateDto dto, int userId); // Partial update
        Task<TaskItem?> UpdateTaskStatusAsync(int id, string status, int userId); // Specific status update logic
        Task<bool> DeleteTaskAsync(int id, int userId, bool isAdmin);

        // Subtasks
        Task<List<Subtask>> GetSubtasksAsync(int taskId);
        Task<Subtask?> AddSubtaskAsync(int taskId, SubtaskCreateDto dto, int userId);
        Task<Subtask?> UpdateSubtaskAsync(int subtaskId, SubtaskUpdateDto dto, int userId);
        Task<bool> ReorderSubtasksAsync(SubtaskReorderRequest req, int userId);
        Task<bool> DeleteSubtaskAsync(int subtaskId, int userId);

        // Comments
        Task<List<Comment>> GetCommentsAsync(int taskId);
        Task<Comment?> AddCommentAsync(int taskId, string content, int userId);
        Task<bool> DeleteCommentAsync(int commentId, int userId, bool isAdmin);

        // Attachments
        Task<Attachment?> AddAttachmentAsync(int taskId, Attachment attachment, int userId);
    }
}
