using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Unity.Core.Helpers;

namespace Unity.Core.Models
{
    public class Attachment
    {
        [Key]
        public int Id { get; set; }

        public int TaskId { get; set; }
        
        [System.Text.Json.Serialization.JsonIgnore]
        [ForeignKey("TaskId")]
        public TaskItem Task { get; set; }

        [Required]
        public string Name { get; set; }
        
        [Required]
        public string Url { get; set; }

        public string Type { get; set; } = "unknown";
        public long Size { get; set; } = 0;

        public int CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = TimeHelper.Now;
    }
}
