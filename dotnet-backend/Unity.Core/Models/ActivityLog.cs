using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Unity.Core.Helpers;

namespace Unity.Core.Models
{
    public class ActivityLog
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public int UserId { get; set; }  // Who performed the action
        
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
        
        public string EntityType { get; set; } // Task, Project, etc.

        public string EntityId { get; set; } 

        public string ActionType { get; set; } // CREATE, UPDATE, DELETE

        public string FieldName { get; set; } // e.g. "Status", "Assignee"

        public string? OldValue { get; set; } // Primitive Value (e.g. "1")
        public string? NewValue { get; set; } // Primitive Value (e.g. "2")

        public string? OldValueDisplay { get; set; } // Human Readable (e.g. "Melih")
        public string? NewValueDisplay { get; set; } // Human Readable (e.g. "Tunç")

        public DateTime LogDate { get; set; } = TimeHelper.Now;
        
        public string? TraceId { get; set; } // For End-to-End Tracing
    }
}
