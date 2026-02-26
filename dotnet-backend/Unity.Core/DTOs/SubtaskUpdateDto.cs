using System.Collections.Generic;

namespace Unity.Core.DTOs
{
    public class SubtaskUpdateDto
    {
        public string? Title { get; set; }
        public bool? IsCompleted { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public List<int>? AssigneeIds { get; set; }
    }
}
