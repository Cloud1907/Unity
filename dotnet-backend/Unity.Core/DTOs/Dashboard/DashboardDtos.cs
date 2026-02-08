namespace Unity.Core.DTOs.Dashboard
{
    public class DashboardStatsDto
    {
        public int UserId { get; set; }
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int TodoTasks { get; set; }
        public int InProgressTasks { get; set; }
        public int StuckTasks { get; set; }
        public int ReviewTasks { get; set; }
        public int OverdueTasks { get; set; }
        public double AverageProgress { get; set; }
    }

    public class DashboardAssigneeDto
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public string Avatar { get; set; }
    }

    public class DashboardTaskDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; }
        public string Status { get; set; } = "todo";
        public string Priority { get; set; } = "medium";
        public DateTime? DueDate { get; set; }
        public int? Progress { get; set; }
        
        // Project Info (Joined)
        public int ProjectId { get; set; }
        public string ProjectName { get; set; }
        public string ProjectColor { get; set; }

        // Assignees (Enriched)
        public List<DashboardAssigneeDto> Assignees { get; set; } = new();
    }

    public class DashboardViewModel
    {
        public DashboardStatsDto Stats { get; set; }
        public List<DashboardTaskDto> Tasks { get; set; }
        public int TotalCount { get; set; }
        public bool HasMore { get; set; }
    }
}
