using System;
using System.ComponentModel.DataAnnotations;

namespace Unity.Core.Models
{
    public class Department
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string Name { get; set; }

        public string? Description { get; set; }

        public string? HeadOfDepartment { get; set; } // Could be a User Id optionally

        public string? Color { get; set; } // Hex color code
    }
}
