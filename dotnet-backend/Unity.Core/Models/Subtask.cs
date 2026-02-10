using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Unity.Core.Models
{
    [Table("Subtasks")]
    public class Subtask
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Title { get; set; }

        public bool IsCompleted { get; set; } = false;

        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public int Position { get; set; } = 0;

        public int TaskId { get; set; }
        [ForeignKey("TaskId")]
        [System.Text.Json.Serialization.JsonIgnore]
        public TaskItem Task { get; set; }

        // Many-to-Many via TaskAssignee (using the same table)
        public List<TaskAssignee> Assignees { get; set; } = new List<TaskAssignee>();

        public int CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
