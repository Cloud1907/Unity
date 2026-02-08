using System;
using System.Collections.Generic;

namespace Unity.Core.DTOs
{
    public class TaskItemDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Status { get; set; }
        public string? Priority { get; set; }
        public DateTime? DueDate { get; set; }
        public int? Progress { get; set; }
        public int ProjectId { get; set; }
        public string? ProjectName { get; set; }
        public string? ProjectColor { get; set; }
        
        public List<int> AssigneeIds { get; set; } = new();
        public List<int> LabelIds { get; set; } = new();
        
        public int SubtaskCount { get; set; }
        public int CommentCount { get; set; }
        public int AttachmentCount { get; set; }
        public int CreatedBy { get; set; }
    }

    public class PaginatedTasksResponse
    {
        public List<TaskItemDto> Tasks { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public bool HasMore { get; set; }
    }
}
