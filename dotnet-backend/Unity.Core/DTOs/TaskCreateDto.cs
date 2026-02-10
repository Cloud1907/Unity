using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Unity.Core.DTOs
{
    public class TaskCreateDto
    {
        [Required]
        public string Title { get; set; }

        public int ProjectId { get; set; }

        public string? Description { get; set; }
        
        public string? TaskUrl { get; set; }

        public string? Status { get; set; } = "todo";

        public string? Priority { get; set; } = "medium";

        public DateTime? StartDate { get; set; }

        public DateTime? DueDate { get; set; }

        public List<int>? AssigneeIds { get; set; }
        public List<int>? LabelIds { get; set; }
    }
}
