using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Unity.Core.Models;

namespace Unity.Core.DTOs
{
    public class TaskUpdateDto
    {
        public string? Title { get; set; }
        public int? ProjectId { get; set; }
        
        public string? Description { get; set; }
        public string? TaskUrl { get; set; }
        public string? Status { get; set; }
        public string? Priority { get; set; }
        public bool? IsPrivate { get; set; } // Make bool nullable too for "undefined" check? Or default false?
        public string? TShirtSize { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public int? Progress { get; set; }

        // Optional: Replace collections
        public List<int>? AssigneeIds { get; set; }
        public List<int>? LabelIds { get; set; }
    }

    public class TaskStatusUpdateRequest
    {
        public string Status { get; set; }
    }
}
