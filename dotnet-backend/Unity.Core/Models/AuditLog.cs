using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Unity.Core.Models
{
    public class AuditLog
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; }  // Who performed the action
        
        public string UserName { get; set; } // Snapshot of name

        [Required]
        public string Action { get; set; } // CREATE, UPDATE, DELETE

        [Required]
        public string EntityName { get; set; } // Task, Project, etc.

        [Required]
        public string EntityId { get; set; } 

        public string Description { get; set; } // Human readable summary

        public string? OldValues { get; set; } // JSON
        public string? NewValues { get; set; } // JSON

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
