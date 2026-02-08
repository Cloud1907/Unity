using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Unity.Core.DTOs
{
    public class ProjectCreateDto
    {
        [Required]
        public string Name { get; set; }
        
        public string? Description { get; set; }
        public string Icon { get; set; } = "Folder";
        public string Color { get; set; } = "#0086c0";
        public int DepartmentId { get; set; }
        public bool IsPrivate { get; set; }
        
        public List<int>? MemberIds { get; set; }
        
        // Optional: Budget, Dates if needed
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public double? Budget { get; set; }
    }
}
