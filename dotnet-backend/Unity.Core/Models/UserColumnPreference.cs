using System;
using System.ComponentModel.DataAnnotations;

namespace Unity.Core.Models
{
    public class UserColumnPreference
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }
        
        // JSON string containing column visibility settings
        public string Preferences { get; set; } = "{}";
        
        // JSON string containing sidebar workspace preferences (order, visibility)
        public string SidebarPreferences { get; set; } = "{}";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
