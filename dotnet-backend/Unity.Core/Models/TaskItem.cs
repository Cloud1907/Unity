using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using Unity.Core.Helpers;

namespace Unity.Core.Models
{
    [Table("Tasks")]
    public class TaskItem
    {
        [NotMapped]
        public List<int> AssigneeIds { get; set; } = new List<int>();

        [NotMapped]
        public List<int> LabelIds { get; set; } = new List<int>();

        [Key]
        public int Id { get; set; }

        public int ProjectId { get; set; }

        [ForeignKey("ProjectId")]
        public virtual Project Project { get; set; }

        [Required]
        public string Title { get; set; }

        public string? Description { get; set; }

        public List<TaskAssignee> Assignees { get; set; } = new List<TaskAssignee>();

        public int AssignedBy { get; set; }
        public string Status { get; set; } = "todo";
        public string Priority { get; set; } = "medium";

        // Relation: Labels (Many-to-Many)
        public List<TaskLabel> Labels { get; set; } = new List<TaskLabel>();

        public bool IsPrivate { get; set; } = false;

        public string? TShirtSize { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public int Progress { get; set; } = 0;

        public List<Subtask> Subtasks { get; set; } = new List<Subtask>();

        // Relations: Comments (One-to-Many)
        public List<Comment> Comments { get; set; } = new List<Comment>();

        // Relations: Attachments (One-to-Many)
        public List<Attachment> Attachments { get; set; } = new List<Attachment>();

        public int CreatedBy { get; set; } // Restored

        public DateTime CreatedAt { get; set; } = TimeHelper.Now;
        public DateTime UpdatedAt { get; set; } = TimeHelper.Now;

        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
    }
}

