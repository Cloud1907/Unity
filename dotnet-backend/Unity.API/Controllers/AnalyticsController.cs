using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Unity.Infrastructure.Data;
using Unity.Core.Models;

namespace Unity.API.Controllers
{
    [Authorize]
    public class AnalyticsController : BaseController
    {
        public AnalyticsController(AppDbContext context) : base(context)
        {
        }

        // CONSTITUTION CHECK: Use strict integer joins for Workload
        // User -> UserDepartment -> Departments
        // Departments -> Projects
        // Projects -> Tasks
        
        [HttpGet("workload")]
        public async Task<IActionResult> GetWorkload()
        {
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            // 1. Get User's Departments (Strict Hierarchy)
            var userDeptIds = await _context.UserDepartments
                .Where(ud => ud.UserId == userId)
                .Select(ud => ud.DepartmentId)
                .ToListAsync();

            if (!userDeptIds.Any())
            {
                return Ok(new List<object>()); // Empty if no departments
            }

            // 2. Fetch Projects in those Departments (Constitution: Dept -> Project)
            // We optimize by selecting flattened data directly
            var projects = await _context.Projects.AsNoTracking()
                .Where(p => userDeptIds.Contains(p.DepartmentId) && !p.IsDeleted)
                .Select(p => new 
                {
                    ProjectId = p.Id,
                    ProjectName = p.Name,
                    DepartmentId = p.DepartmentId,
                    DepartmentName = p.Members.FirstOrDefault(m => m.ProjectId == p.Id) != null ? "My Project" : "Department Project" // Simplified logic
                })
                .ToListAsync();

            var projectIds = projects.Select(p => p.ProjectId).ToList();

            // 3. Fetch Tasks for these Projects (Constitution: Project -> Task)
            var tasks = await _context.Tasks.AsNoTracking()
                .Where(t => projectIds.Contains(t.ProjectId) && !t.IsDeleted)
                .Select(t => new 
                {
                    t.Id,
                    t.ProjectId,
                    t.Status,
                    t.DueDate
                })
                .ToListAsync();

            // 4. Aggregate Data in Memory
            var workload = projects.Select(p => new 
            {
                id = p.ProjectId,
                name = p.ProjectName,
                activeCount = tasks.Count(t => t.ProjectId == p.ProjectId && t.Status != "done"),
                completedCount = tasks.Count(t => t.ProjectId == p.ProjectId && t.Status == "done"),
                overdueCount = tasks.Count(t => t.ProjectId == p.ProjectId && t.Status != "done" && t.DueDate.HasValue && t.DueDate.Value < DateTime.UtcNow),
                totalCount = tasks.Count(t => t.ProjectId == p.ProjectId)
            })
            .Where(w => w.totalCount > 0) // Hide empty projects to reduce noise
            .OrderByDescending(w => w.activeCount)
            .Take(10) // Top 10 Active Projects
            .ToList();

            return Ok(workload);
        }

        [HttpGet("overview")]
        public async Task<IActionResult> GetOverview()
        {
             var userId = GetCurrentUserId();
             
             // Simple aggregate for reports overview
             var stats = await _context.DashboardStatsView
                .FirstOrDefaultAsync(s => s.UserId == userId);

             if (stats == null) return Ok(new { total = 0, completionRate = 0 });

            return Ok(new 
            {
                total = stats.TotalTasks,
                completed = stats.DoneTasks,
                overdue = stats.OverdueTasks,
                completionRate = stats.TotalTasks > 0 ? (double)stats.DoneTasks / stats.TotalTasks * 100 : 0
            });
        }
    }
}
