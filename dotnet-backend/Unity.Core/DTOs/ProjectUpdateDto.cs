using System;
using System.ComponentModel.DataAnnotations;

namespace Unity.Core.DTOs
{
    public class ProjectUpdateDto
    {
        [Required]
        public string Name { get; set; }
        
        public string? Description { get; set; }
        public string Icon { get; set; }
        public string Color { get; set; }
        public int? DepartmentId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public double? Budget { get; set; }
        public string Status { get; set; }
        public string Priority { get; set; }
        public bool IsPrivate { get; set; }
    }
}
