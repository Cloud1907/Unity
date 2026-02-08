using Microsoft.EntityFrameworkCore.Migrations;

namespace Unity.Infrastructure.Migrations
{
    public partial class AddUserDashboardStatsView : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var sql = @"
                CREATE OR ALTER VIEW vw_UserDashboardStats AS
                SELECT 
                    u.Id as UserId,
                    COUNT(t.Id) as TotalTasks,
                    SUM(CASE WHEN t.Status IN ('todo', 'backlog') THEN 1 ELSE 0 END) as TodoTasks,
                    SUM(CASE WHEN t.Status IN ('working', 'in_progress') THEN 1 ELSE 0 END) as InProgressTasks,
                    SUM(CASE WHEN t.Status = 'stuck' THEN 1 ELSE 0 END) as StuckTasks,
                    SUM(CASE WHEN t.Status = 'review' THEN 1 ELSE 0 END) as ReviewTasks,
                    SUM(CASE WHEN t.Status = 'done' THEN 1 ELSE 0 END) as DoneTasks,
                    SUM(CASE WHEN t.DueDate < GETDATE() AND t.Status != 'done' THEN 1 ELSE 0 END) as OverdueTasks,
                    ISNULL(AVG(CASE WHEN t.Status != 'done' THEN CAST(t.Progress AS FLOAT) ELSE NULL END), 0) as AverageProgress
                FROM Users u
                LEFT JOIN TaskAssignees ta ON u.Id = ta.UserId
                LEFT JOIN Tasks t ON ta.TaskId = t.Id AND t.IsDeleted = 0
                WHERE u.IsActive = 1
                GROUP BY u.Id
            ";

            migrationBuilder.Sql(sql);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP VIEW IF EXISTS vw_UserDashboardStats");
        }
    }
}
