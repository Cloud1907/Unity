using Microsoft.EntityFrameworkCore.Migrations;

namespace Unity.Infrastructure.Migrations
{
    /// <summary>
    /// Manual migration to create SQL View for dashboard performance optimization.
    /// This view is KEYLESS and read-only.
    /// </summary>
    public partial class AddDashboardTasksViewManual : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // First drop the view if it exists (in case of re-application)
            migrationBuilder.Sql("DROP VIEW IF EXISTS vw_DashboardTasks;");
            
            // Create SQL View for high-performance dashboard queries
            // NOTE: SQL Server uses 0/1 for boolean columns
            migrationBuilder.Sql(@"
CREATE VIEW vw_DashboardTasks AS
SELECT 
    t.Id AS TaskId,
    t.Title,
    t.Status,
    t.Priority,
    t.Progress,
    t.DueDate,
    t.StartDate,
    t.UpdatedAt,
    t.ProjectId,
    p.Name AS ProjectName,
    p.Color AS ProjectColor,
    p.DepartmentId,
    d.Name AS DepartmentName,
    d.Color AS DepartmentColor,
    ta.UserId AS AssigneeId
FROM Tasks t
INNER JOIN Projects p ON t.ProjectId = p.Id AND p.IsDeleted = 0
INNER JOIN Departments d ON p.DepartmentId = d.Id AND d.IsDeleted = 0
LEFT JOIN TaskAssignees ta ON t.Id = ta.TaskId
WHERE t.IsDeleted = 0;
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP VIEW IF EXISTS vw_DashboardTasks;");
        }
    }
}
