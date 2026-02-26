using System;
using System.Collections.Generic;

namespace Unity.Core.DTOs
{
    public class UserWeeklyMetricsDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; }

        public int CompletedTasksCount { get; set; }
        public int OverdueTasksCount { get; set; }
        public int UpcomingTasksCount { get; set; } // Next 7 days
        public int TasksAssignedByMeCompletedCount { get; set; } // Bonus stat

        public List<TaskSummaryDto> CompletedTasks { get; set; } = new List<TaskSummaryDto>();
        public List<TaskSummaryDto> OverdueTasks { get; set; } = new List<TaskSummaryDto>();
        public List<TaskSummaryDto> UpcomingTasks { get; set; } = new List<TaskSummaryDto>();

        // We include a raw AI summary string here that will be populated by Gemini
        public string? AiGeneratedSummaryHtml { get; set; }
    }

    public class TaskSummaryDto
    {
        public int TaskId { get; set; }
        public string Title { get; set; }
        public DateTime? DueDate { get; set; }
        public string ProjectName { get; set; }
        public string Priority { get; set; }
        public string CreatorName { get; set; }
        
        // Co-assignees to mention in the email if overdue
        public List<string> OtherAssigneeNames { get; set; } = new List<string>(); 
    }

    public class TriggerWeeklySummaryDto
    {
        public string? TargetEmail { get; set; }
    }
}
