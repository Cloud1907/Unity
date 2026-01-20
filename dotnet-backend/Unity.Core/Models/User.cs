using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace Unity.Core.Models
{
    public class User
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public string FullName { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        public string? Username { get; set; }

        public string DepartmentsJson { get; set; } = "[]";

        [NotMapped]
        public List<int> Departments 
        { 
            get => System.Text.Json.JsonSerializer.Deserialize<List<int>>(DepartmentsJson ?? "[]") ?? new List<int>();
            set => DepartmentsJson = System.Text.Json.JsonSerializer.Serialize(value);
        }

        public string Role { get; set; } = "member";

        public int? Manager { get; set; }
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
        public List<int> ProjectIds { get; set; } = new List<int>();
    }
}
