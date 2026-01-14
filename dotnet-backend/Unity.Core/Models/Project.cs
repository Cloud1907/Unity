using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Unity.Core.Models
{
    public class Project
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string Name { get; set; }

        public string? Description { get; set; }
        public string Icon { get; set; } = "📁";
        public string Color { get; set; } = "#0086c0";
        public string? Owner { get; set; } // UserId - Set by controller
        
        // Stored as JSON
        public string MembersJson { get; set; } = "[]";

        [NotMapped]
        public List<string> Members 
        { 
            get => JsonSerializer.Deserialize<List<string>>(MembersJson ?? "[]") ?? new List<string>();
            set => MembersJson = JsonSerializer.Serialize(value);
        }

        public string? Department { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public double? Budget { get; set; }
        
        public string Status { get; set; } = "planning"; // planning, in_progress, on_hold, completed, cancelled
        public string Priority { get; set; } = "medium"; // low, medium, high, urgent
        
        public bool Favorite { get; set; } = false;
        public bool IsPrivate { get; set; } = false;

        public string? CreatedBy { get; set; } // Set by controller
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
