using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;
using Unity.Core.Helpers;

namespace Unity.Core.Models
{
    public class User
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public string? FullName { get; set; }

        [Required]
        [EmailAddress]
        public string? Email { get; set; }

        public string? Username { get; set; }


        
        public List<UserDepartment> Departments { get; set; } = new List<UserDepartment>();

        public string? Role { get; set; } = "member";

        public int? Manager { get; set; }
        public string? Avatar { get; set; } = "https://api.dicebear.com/7.x/avataaars/svg?seed=Default";
        public string? Color { get; set; }
        public string? JobTitle { get; set; }
        public bool IsActive { get; set; } = true;

        public string? Gender { get; set; }
        public string? PasswordHash { get; set; } = "";
        
        [NotMapped]
        public string? Password { get; set; }

        public DateTime CreatedAt { get; set; } = TimeHelper.Now;
        public DateTime UpdatedAt { get; set; } = TimeHelper.Now;

        [NotMapped]
        public List<int> ProjectIds { get; set; } = new List<int>();
    }
}
