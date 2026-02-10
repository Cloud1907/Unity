using System;
using System.Collections.Generic;

namespace Unity.Core.DTOs
{
    public class TaskPatchDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? TaskUrl { get; set; }
        public string? Status { get; set; }
        public string? Priority { get; set; }
        public string? TShirtSize { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public int? Progress { get; set; } // Can be int or string parsed to int in custom binder, but int is standard for JSON numbers
        public bool? IsPrivate { get; set; }
        
        // Additive or Replacement logic is tricky with DTOs.
        // Usually PATCH implies "replace if present". 
        // For collections, standard DTOs usually imply "replace collection".
        // The previous logic supported both single "assigneeId" (additive) and "assignees" (replace).
        // we'll support both properties to maintain backward compatibility if needed, 
        // or unify them. Let's support the existing API surface.
        
        public int? AssigneeId { get; set; } // Additive single
        public List<int>? Assignees { get; set; } // Strict int list
        public List<int>? Labels { get; set; } // Strict int list
        
        public List<AttachmentDto>? Attachments { get; set; }
    }

    public class AttachmentDto
    {
        public string Name { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public string? Type { get; set; }
        public long? Size { get; set; }
    }
}
