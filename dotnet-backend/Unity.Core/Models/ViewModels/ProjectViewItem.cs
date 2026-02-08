using System;

namespace Unity.Core.Models.ViewModels
{
    /// <summary>
    /// DTO for the vw_ProjectList SQL View
    /// Used for high-performance project listing queries
    /// </summary>
    public class ProjectViewItem
    {
        public int Id { get; set; }
        public int ProjectId { get; set; } // Legacy/Internal reference
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Icon { get; set; }
        public string? Color { get; set; }
        public string? Status { get; set; }
        public string? Priority { get; set; }
        public bool IsPrivate { get; set; }
        public int Owner { get; set; }
        public int DepartmentId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? DepartmentName { get; set; }
        public string? DepartmentColor { get; set; }
        public int TaskCount { get; set; }
        public int CompletedTaskCount { get; set; }
        public int MemberCount { get; set; }
    }
}
