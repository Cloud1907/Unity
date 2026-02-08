using System;

namespace Unity.Core.Models.ViewModels
{
    /// <summary>
    /// DTO for the vw_DashboardTasks SQL View
    /// Used for high-performance dashboard queries
    /// </summary>
    public class DashboardTaskView
    {
        public int TaskId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Status { get; set; } = "todo";
        public string Priority { get; set; } = "medium";
        public int Progress { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? UpdatedAt { get; set; }
        
        // Project info
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public string ProjectColor { get; set; } = "#0086c0";
        
        // Department (Workspace) info
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public string? DepartmentColor { get; set; }
        
        // Assignee (flattened - one row per assignee)
        public int? AssigneeId { get; set; }
        
        // Computed fields
        public bool IsOverdue => DueDate.HasValue && DueDate.Value < DateTime.UtcNow && Status != "done";
    }
}
