using System;

namespace Unity.Core.DTOs
{
    public class CreateSubtaskRequest
    {
        public string Title { get; set; }
        public bool IsCompleted { get; set; }
        public int? AssigneeId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
    }

    public class CreateCommentRequest
    {
        public string Text { get; set; }
    }
}
