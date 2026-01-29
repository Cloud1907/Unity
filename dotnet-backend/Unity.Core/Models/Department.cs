using System;
using System.ComponentModel.DataAnnotations;

namespace Unity.Core.Models
{
    public class Department
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        public string? Description { get; set; }

        public string? HeadOfDepartment { get; set; } // Could be a User Id optionally

        public string? Color { get; set; } // Hex color code
        
        public bool IsMaster { get; set; } = false; // Master workspaces created by Admin

        public int CreatedBy { get; set; } // User ID of the creator
    }
}
