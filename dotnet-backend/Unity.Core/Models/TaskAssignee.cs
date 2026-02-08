using System.ComponentModel.DataAnnotations;

namespace Unity.Core.Models
{
    public class TaskAssignee
    {
        [Key]
        public int Id { get; set; } // Surrogate Key required for nullable unique indexes logic

        public int UserId { get; set; }
        public User? User { get; set; }

        // Either TaskId OR SubtaskId should be set
        public int? TaskId { get; set; }
        [System.Text.Json.Serialization.JsonIgnore]
        public TaskItem? Task { get; set; }

        public int? SubtaskId { get; set; }
        [System.Text.Json.Serialization.JsonIgnore]
        public Subtask? Subtask { get; set; }
    }
}
