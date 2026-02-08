-- Migration: Create View for Dashboard Statistics
-- Date: 2024-02-05
-- Constitutional Rule: 2.1 View Usage

CREATE OR REPLACE VIEW "vw_UserDashboardStats" AS
SELECT 
    u."Id" as "UserId",
    COUNT(t."Id") as "TotalTasks",
    SUM(CASE WHEN t."Status" = 'done' THEN 1 ELSE 0 END) as "CompletedTasks",
    SUM(CASE WHEN t."Status" = 'todo' THEN 1 ELSE 0 END) as "TodoTasks",
    SUM(CASE WHEN t."Status" IN ('working', 'in_progress') THEN 1 ELSE 0 END) as "InProgressTasks",
    SUM(CASE WHEN t."Status" = 'stuck' THEN 1 ELSE 0 END) as "StuckTasks",
    SUM(CASE WHEN t."Status" = 'review' THEN 1 ELSE 0 END) as "ReviewTasks",
    SUM(CASE WHEN t."DueDate" < CURRENT_TIMESTAMP AND t."Status" != 'done' THEN 1 ELSE 0 END) as "OverdueTasks",
    COALESCE(AVG(t."Progress"), 0) as "AverageProgress"
FROM "Users" u
LEFT JOIN "TaskAssignees" ta ON u."Id" = ta."UserId"
LEFT JOIN "Tasks" t ON ta."TaskId" = t."Id" AND t."IsDeleted" = false
WHERE u."IsDeleted" = false
GROUP BY u."Id";
