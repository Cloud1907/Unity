using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Unity.Core.DTOs;

namespace Unity.Infrastructure.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body);
        Task SendTaskAssignmentEmailAsync(string to, string userName, string? description, string assignerName, string workGroupName, string projectName, string taskTitle, string? subtaskTitle, string priority, DateTime? dueDate, int projectId, int taskId, List<EmailSubtaskDto> subtasks);
    }
}
