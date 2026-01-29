using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Unity.Core.Helpers;

namespace Unity.Core.Models
{
    public class Comment
    {
        [Key]
        public int Id { get; set; }

        public int TaskId { get; set; }
        
        [System.Text.Json.Serialization.JsonIgnore]
        [ForeignKey("TaskId")]
        public TaskItem? Task { get; set; }

        [Required]
        public string Text { get; set; }

        public int CreatedBy { get; set; } // UserId
        
        [ForeignKey("CreatedBy")]
        public User? User { get; set; }

        public DateTime CreatedAt { get; set; } = TimeHelper.Now;
    }
}
