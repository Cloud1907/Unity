using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Unity.Core.DTOs;

namespace Unity.API.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body);
        Task SendTaskAssignmentEmailAsync(string to, string userName, string? description, string assignerName, string workGroupName, string projectName, string taskTitle, string? subtaskTitle, string priority, DateTime? dueDate, int taskId, List<EmailSubtaskDto> subtasks);
        Task SendWeeklySummaryEmailAsync(string to, UserWeeklyMetricsDto metrics);
    }
}
