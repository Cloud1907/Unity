using System;
using System.Collections.Generic;

namespace Unity.Core.DTOs
{
    public class CreateSubtaskRequest
    {
        public string Title { get; set; }
        public bool IsCompleted { get; set; }
        public int? AssigneeId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public int? Position { get; set; }
    }

    public class CreateCommentRequest
    {
        public string Text { get; set; }
    }

    public class SubtaskReorderRequest
    {
        public List<SubtaskReorderItem> Items { get; set; }
    }

    public class SubtaskReorderItem
    {
        public int Id { get; set; }
        public int Position { get; set; }
    }
}
