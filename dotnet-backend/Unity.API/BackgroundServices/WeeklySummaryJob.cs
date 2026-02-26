using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Unity.Infrastructure.Data;
using Unity.Core;
using Unity.Core.DTOs;
using Unity.Core.Helpers;
using Unity.API.Services;

namespace Unity.API.BackgroundServices
{
    public class WeeklySummaryJob
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<WeeklySummaryJob> _logger;

        public WeeklySummaryJob(IServiceScopeFactory scopeFactory, ILogger<WeeklySummaryJob> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        public async Task ProcessWeeklySummariesAsync(string? targetEmail = null, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation($"Starting weekly summary generation process (MANUAL TRIGGER)... " + (!string.IsNullOrEmpty(targetEmail) ? $"Target: {targetEmail}" : "All Active Users"));
            var now = TimeHelper.Now;
            var sevenDaysAgo = now.AddDays(-7);
            var nextSevenDays = now.AddDays(7);

            using (var scope = _scopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var aiService = scope.ServiceProvider.GetRequiredService<IGenerativeAIService>();
                var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

                var query = dbContext.Users.Where(u => u.IsActive && !u.IsDeleted && !string.IsNullOrEmpty(u.Email));
                
                if (!string.IsNullOrEmpty(targetEmail))
                {
                    query = query.Where(u => u.Email == targetEmail);
                }

                var targetUsers = await query.ToListAsync(cancellationToken);

                if (!targetUsers.Any())
                {
                    _logger.LogWarning($"[EmailDiagnostic] No target users found. Email filter: {targetEmail ?? "none"}");
                    return;
                }

                _logger.LogInformation($"[EmailDiagnostic] Found {targetUsers.Count} active users to process. Processing started...");

                foreach (var user in targetUsers)
                {
                    _logger.LogInformation($"[EmailDiagnostic] Starting processing for User: {user.Email} (ID: {user.Id})");
                    if (cancellationToken.IsCancellationRequested) break;

                    try
                    {
                        // 1. GATHER DATA — load all tasks assigned to user, with project info
                        var userTasks = await dbContext.Tasks
                            .Include(t => t.Assignees)
                                .ThenInclude(a => a.User)
                            .Include(t => t.Project)
                            .Include(t => t.CreatedByUser)
                            .Where(t => !t.IsDeleted && t.Assignees.Any(a => a.UserId == user.Id))
                            .ToListAsync(cancellationToken);

                        // 2. BUILD CATEGORIZED TASK LISTS
                        var completedTasks = userTasks
                            .Where(t => t.Status == "done" && t.CompletedAt >= sevenDaysAgo)
                            .Select(t => new TaskSummaryDto
                            {
                                TaskId = t.Id,
                                Title = t.Title,
                                ProjectName = t.Project?.Name ?? "Genel",
                                Priority = TranslatePriority(t.Priority),
                                CreatorName = t.CreatedByUser?.FullName ?? "Sistem",
                                DueDate = t.DueDate,
                                OtherAssigneeNames = t.Assignees
                                    .Where(a => a.UserId != user.Id)
                                    .Select(a => a.User?.FullName ?? "")
                                    .Where(n => !string.IsNullOrEmpty(n))
                                    .ToList()
                            })
                            .ToList();

                        var overdueTasks = userTasks
                            .Where(t => t.Status != "done" && t.DueDate.HasValue && t.DueDate.Value < now)
                            .Select(t => new TaskSummaryDto
                            {
                                TaskId = t.Id,
                                Title = t.Title,
                                ProjectName = t.Project?.Name ?? "Genel",
                                Priority = TranslatePriority(t.Priority),
                                CreatorName = t.CreatedByUser?.FullName ?? "Sistem",
                                DueDate = t.DueDate,
                                OtherAssigneeNames = t.Assignees
                                    .Where(a => a.UserId != user.Id)
                                    .Select(a => a.User?.FullName ?? "")
                                    .Where(n => !string.IsNullOrEmpty(n))
                                    .ToList()
                            })
                            .ToList();

                        var upcomingTasks = userTasks
                            .Where(t => t.Status != "done" && t.DueDate.HasValue && t.DueDate.Value >= now && t.DueDate.Value <= nextSevenDays)
                            .Select(t => new TaskSummaryDto
                            {
                                TaskId = t.Id,
                                Title = t.Title,
                                ProjectName = t.Project?.Name ?? "Genel",
                                Priority = TranslatePriority(t.Priority),
                                CreatorName = t.CreatedByUser?.FullName ?? "Sistem",
                                DueDate = t.DueDate,
                                OtherAssigneeNames = t.Assignees
                                    .Where(a => a.UserId != user.Id)
                                    .Select(a => a.User?.FullName ?? "")
                                    .Where(n => !string.IsNullOrEmpty(n))
                                    .ToList()
                            })
                            .ToList();

                        var metrics = new UserWeeklyMetricsDto
                        {
                            UserId = user.Id,
                            FullName = user.FullName ?? user.Username ?? "Kullanıcı",

                            CompletedTasksCount = completedTasks.Count,
                            OverdueTasksCount = overdueTasks.Count,
                            UpcomingTasksCount = upcomingTasks.Count,

                            CompletedTasks = completedTasks,
                            OverdueTasks = overdueTasks,
                            UpcomingTasks = upcomingTasks
                        };

                        // Tasks the user created/assigned that were completed by ANYONE recently
                        metrics.TasksAssignedByMeCompletedCount = await dbContext.Tasks
                            .Where(t => !t.IsDeleted && t.CreatedBy == user.Id && t.Status == "done" && t.CompletedAt >= sevenDaysAgo)
                            .CountAsync(cancellationToken);

                        // If user did absolutely nothing, skip
                        if (metrics.CompletedTasksCount == 0 && metrics.OverdueTasksCount == 0 && 
                            metrics.UpcomingTasksCount == 0 && metrics.TasksAssignedByMeCompletedCount == 0)
                        {
                            _logger.LogWarning($"[EmailDiagnostic] Skipping user {user.Email}: No tasks or metrics to report this week.");
                            continue;
                        }

                        // 3. GENERATE AI INSIGHT
                        _logger.LogInformation($"[EmailDiagnostic] Generating AI insight for {user.Email}...");
                        metrics.AiGeneratedSummaryHtml = await aiService.GenerateWeeklyInsightAsync(metrics);

                        // 4. SEND EMAIL
                        _logger.LogInformation($"[EmailDiagnostic] Sending weekly summary email to {user.Email}...");
                        await emailService.SendWeeklySummaryEmailAsync(user.Email!, metrics);
                        
                        _logger.LogInformation($"[EmailDiagnostic] SUCCESS: Weekly summary sent to {user.Email}");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"[EmailDiagnostic] ERROR: Failed to process weekly summary for user {user.Id} ({user.Email})");
                    }
                }
            }
            
            _logger.LogInformation("Completed weekly summary generation process.");
        }

        private string TranslatePriority(string? priority)
        {
            return (priority?.ToLower()) switch
            {
                "urgent" => "Acil",
                "high" => "Yüksek",
                "medium" => "Orta",
                "low" => "Düşük",
                _ => "Orta"
            };
        }
    }
}
