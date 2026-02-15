using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Unity.Infrastructure.Data;
using Unity.Core.Models.ViewModels;

namespace Unity.API.Controllers
{
    /// <summary>
    /// Dashboard API - Optimized queries using SQL Views
    /// STRICT WORKSPACE ISOLATION: Users only see their own department's data
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirst("id")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out int id) ? id : 0;
        }

        /// <summary>
        /// Get dashboard tasks grouped by Department -> Project hierarchy
        /// SECURITY: No admin bypass - users only see their departments
        /// </summary>
        /// <param name="dateFilter">week, month, year - Only applies to completed tasks</param>
        [HttpGet("my-tasks")]
        public async Task<IActionResult> GetMyDashboardTasks([FromQuery] string dateFilter = "week")
        {
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            // STRICT: Get user's departments (NO admin bypass!)
            var userDeptIds = await _context.UserDepartments
                .Where(ud => ud.UserId == userId)
                .Select(ud => ud.DepartmentId)
                .ToListAsync();

            if (!userDeptIds.Any())
            {
                return Ok(new { departments = new List<object>(), stats = new { total = 0, active = 0, completed = 0, overdue = 0 } });
            }

            // Calculate date range for completed tasks filtering
            var now = DateTime.UtcNow;
            DateTime completedSince = dateFilter switch
            {
                "month" => new DateTime(now.Year, now.Month, 1),
                "year" => now.AddYears(-1),
                _ => now.AddDays(-7) // Last 7 days
            };

            // Query from SQL View - much faster than joins
            var allTasks = await _context.DashboardTasksView
                .Where(t => userDeptIds.Contains(t.DepartmentId))
                .ToListAsync();

            // Filter: Active tasks always show, completed tasks filtered by date
            var filteredTasks = allTasks.Where(t =>
                t.Status != "done" || // Active tasks always visible
                (t.Status == "done" && t.UpdatedAt >= completedSince) // Completed in date range
            ).ToList();

            // Distinct tasks (due to LEFT JOIN on assignees creating duplicates)
            var distinctActiveTasks = filteredTasks
                .Where(t => t.Status != "done")
                .GroupBy(t => t.TaskId)
                .Select(g => g.First())
                .ToList();

            var distinctCompletedTasks = filteredTasks
                .Where(t => t.Status == "done")
                .GroupBy(t => t.TaskId)
                .Select(g => g.First())
                .ToList();

            // Calculate overdue tasks
            var overdueTasks = distinctActiveTasks
                .Where(t => t.DueDate.HasValue && t.DueDate.Value < now)
                .ToList();

            // Group by Department -> Project -> Tasks
            var departments = filteredTasks
                .GroupBy(t => new { t.DepartmentId, t.DepartmentName, t.DepartmentColor })
                .Select(deptGroup =>
                {
                    var deptTasks = deptGroup.ToList();
                    var distinctDeptTasks = deptTasks.GroupBy(t => t.TaskId).Select(g => g.First()).ToList();
                    
                    return new
                    {
                        id = deptGroup.Key.DepartmentId,
                        name = deptGroup.Key.DepartmentName,
                        color = deptGroup.Key.DepartmentColor ?? "#6366f1",
                        projects = deptTasks
                            .GroupBy(t => new { t.ProjectId, t.ProjectName, t.ProjectColor })
                            .Select(projGroup =>
                            {
                                var projTasks = projGroup.GroupBy(t => t.TaskId).Select(g => g.First()).ToList();
                                var projectOverdue = projTasks.Count(t => t.Status != "done" && t.DueDate.HasValue && t.DueDate.Value < now);
                                
                                return new
                                {
                                    id = projGroup.Key.ProjectId,
                                    name = projGroup.Key.ProjectName,
                                    color = projGroup.Key.ProjectColor,
                                    tasks = projTasks.Select(t => new
                                    {
                                        id = t.TaskId,
                                        title = t.Title,
                                        status = t.Status,
                                        priority = t.Priority,
                                        progress = t.Progress,
                                        dueDate = t.DueDate,
                                        isOverdue = t.Status != "done" && t.DueDate.HasValue && t.DueDate.Value < now,
                                        assignees = deptTasks
                                            .Where(at => at.TaskId == t.TaskId && at.AssigneeId.HasValue)
                                            .Select(at => at.AssigneeId!.Value)
                                            .Distinct()
                                            .ToList()
                                    }).ToList(),
                                    stats = new
                                    {
                                        total = projTasks.Count,
                                        active = projTasks.Count(t => t.Status != "done"),
                                        completed = projTasks.Count(t => t.Status == "done"),
                                        overdue = projectOverdue,
                                        todo = projTasks.Count(t => t.Status == "todo"),
                                        working = projTasks.Count(t => t.Status == "working" || t.Status == "in_progress"),
                                        stuck = projTasks.Count(t => t.Status == "stuck"),
                                        review = projTasks.Count(t => t.Status == "review")
                                    }
                                };
                            })
                            .Where(p => p.tasks.Any()) // Filter empty projects
                            .OrderBy(p => p.name)
                            .ToList(),
                        stats = new
                        {
                            total = distinctDeptTasks.Count,
                            active = distinctDeptTasks.Count(t => t.Status != "done"),
                            completed = distinctDeptTasks.Count(t => t.Status == "done"),
                            overdue = distinctDeptTasks.Count(t => t.Status != "done" && t.DueDate.HasValue && t.DueDate.Value < now),
                            projectCount = deptTasks.Select(t => t.ProjectId).Distinct().Count()
                        }
                    };
                })
                .Where(d => d.projects.Any()) // Filter empty departments
                .OrderBy(d => d.name)
                .ToList();

            return Ok(new
            {
                departments,
                stats = new
                {
                    total = distinctActiveTasks.Count + distinctCompletedTasks.Count,
                    active = distinctActiveTasks.Count,
                    completed = distinctCompletedTasks.Count,
                    overdue = overdueTasks.Count,
                    todo = distinctActiveTasks.Count(t => t.Status == "todo"),
                    working = distinctActiveTasks.Count(t => t.Status == "working" || t.Status == "in_progress"),
                    stuck = distinctActiveTasks.Count(t => t.Status == "stuck"),
                    review = distinctActiveTasks.Count(t => t.Status == "review")
                }
            });
        }
    }
}
