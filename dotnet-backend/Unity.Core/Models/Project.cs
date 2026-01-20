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
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        public string? Description { get; set; }
        public string Icon { get; set; } = "📁";
        public string Color { get; set; } = "#0086c0";
        public int Owner { get; set; } // UserId
        
        // Stored as JSON
        public string MembersJson { get; set; } = "[]";

        [NotMapped]
        public List<int> Members 
        { 
            get => JsonSerializer.Deserialize<List<int>>(MembersJson ?? "[]") ?? new List<int>();
            set => MembersJson = JsonSerializer.Serialize(value);
        }

        public int DepartmentId { get; set; } // Changed from string Department name
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public double? Budget { get; set; }
        
        public string Status { get; set; } = "planning"; // planning, in_progress, on_hold, completed, cancelled
        public string Priority { get; set; } = "medium"; // low, medium, high, urgent
        
        public bool Favorite { get; set; } = false;
        public bool IsPrivate { get; set; } = false;

        public int CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
