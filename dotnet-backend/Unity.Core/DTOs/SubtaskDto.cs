using System;
using System.Collections.Generic;

namespace Unity.Core.DTOs
{
    public class SubtaskDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public List<int> AssigneeIds { get; set; } = new List<int>();
        public DateTime CreatedAt { get; set; }
    }
}
