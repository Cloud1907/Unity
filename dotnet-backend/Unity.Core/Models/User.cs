using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace Unity.Core.Models
{
    public class User
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string FullName { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        public string? Username { get; set; }

        public string DepartmentsJson { get; set; } = "[]";

        [NotMapped]
        public List<string> Departments 
        { 
            get => System.Text.Json.JsonSerializer.Deserialize<List<string>>(DepartmentsJson ?? "[]") ?? new List<string>();
            set => DepartmentsJson = System.Text.Json.JsonSerializer.Serialize(value);
        }

        public string Role { get; set; } = "member";

        public string? Manager { get; set; }
        public string? Avatar { get; set; }
        public string? Color { get; set; }
        public string? JobTitle { get; set; }
        public bool IsActive { get; set; } = true;

        public string PasswordHash { get; set; } = "";
        
        [NotMapped]
        public string? Password { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [NotMapped]
        public List<string> ProjectIds { get; set; } = new List<string>();
    }
}
