using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Unity.Core.Helpers;

namespace Unity.Core.Models
{
    public class Subtask
    {
        [Key]
        public int Id { get; set; }

        public int TaskId { get; set; }
        
        [System.Text.Json.Serialization.JsonIgnore]
        [ForeignKey("TaskId")]
        public TaskItem? Task { get; set; }

        [Required]
        public string Title { get; set; }

        public bool IsCompleted { get; set; } = false;

        public int? AssigneeId { get; set; } // Nullable foreign key

        [ForeignKey("AssigneeId")]
        public User? Assignee { get; set; }

        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        
        public int CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = TimeHelper.Now;
    }
}
