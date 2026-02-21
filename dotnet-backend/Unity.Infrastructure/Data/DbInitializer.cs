using Unity.Core.Models;
using Unity.Core.Helpers;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Data;
using System.Linq;
using System;
using System.Collections.Generic;

namespace Unity.Infrastructure.Data
{
    public static class DbInitializer
    {
        public static void Initialize(AppDbContext context)
        {
            // context.Database.EnsureCreated(); // EnsureCreated skips migrations. 

            // CLEANUP: Remove zombie assignees that violate new constraints (Deep-Clean)
            try
            {
                // We use raw SQL because migration might fail if we don't clean first.
                // This targets the specific constraint issue: TaskId IS NULL OR SubtaskId IS NULL
                var cleanupCmd = "IF OBJECT_ID('dbo.TaskAssignees', 'U') IS NOT NULL DELETE FROM TaskAssignees WHERE TaskId IS NULL AND SubtaskId IS NULL";
                context.Database.ExecuteSqlRaw(cleanupCmd);
                Console.WriteLine("DEBUG: Zombie TaskAssignees cleaned up.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Cleanup Warning: {ex.Message}");
            }

            context.Database.Migrate(); // Auto-apply all pending migrations

            // Schema Migration Patch: Ensure IsMaster column exists
            try
            {
                // Check if column exists, if not add it (SQL Server syntax)
                var command = "IF COL_LENGTH('Departments', 'IsMaster') IS NULL BEGIN ALTER TABLE Departments ADD IsMaster BIT NOT NULL DEFAULT 0 END";
                context.Database.ExecuteSqlRaw(command);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Migration Warning: {ex.Message}");
            }

            // Schema Migration Patch: Ensure CreatedAt column exists on Departments
            try
            {
                var addCreatedAtCmd = "IF COL_LENGTH('Departments', 'CreatedAt') IS NULL BEGIN ALTER TABLE Departments ADD CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE() END";
                context.Database.ExecuteSqlRaw(addCreatedAtCmd);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Migration Warning (CreatedAt): {ex.Message}");
            }

            // Schema Migration Patch: Ensure Position column exists on Subtasks for reordering
            try
            {
                var addPositionCmd = "IF COL_LENGTH('Subtasks', 'Position') IS NULL BEGIN ALTER TABLE Subtasks ADD Position INT NOT NULL DEFAULT 0 END";
                context.Database.ExecuteSqlRaw(addPositionCmd);
                Console.WriteLine("DEBUG: Subtasks.Position column verified/added.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Migration Warning (Subtasks Position): {ex.Message}");
            }

            // Schema Migration Patch: Create UserColumnPreferences table if not exists (New Requirement)
            try
            {
                Console.WriteLine("DEBUG: Checking/Creating UserColumnPreferences table...");
                var createTableCmd = @"
                    IF OBJECT_ID('dbo.UserColumnPreferences', 'U') IS NULL
                    BEGIN
                        CREATE TABLE UserColumnPreferences (
                            Id INT IDENTITY(1,1) PRIMARY KEY,
                            UserId INT NOT NULL,
                            Preferences NVARCHAR(MAX) DEFAULT '{}',
                            CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                            UpdatedAt DATETIME2 NULL
                        );
                        CREATE INDEX IX_UserColumnPreferences_UserId ON UserColumnPreferences(UserId);
                    END";

                // Use ExecuteSqlRaw without parameters and double-escape braces
                context.Database.ExecuteSqlRaw(createTableCmd.Replace("{}", "{{}}"));

                // Migration Patch: Ensure SidebarPreferences column exists if table existed previously
                var addSidebarPrefsCmd = "IF COL_LENGTH('UserColumnPreferences', 'SidebarPreferences') IS NULL BEGIN ALTER TABLE UserColumnPreferences ADD SidebarPreferences NVARCHAR(MAX) NOT NULL DEFAULT '{{}}' END";
                context.Database.ExecuteSqlRaw(addSidebarPrefsCmd);

                Console.WriteLine("DEBUG: Table creation and migration logic executed.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"CRITICAL ERROR: Table Creation FAILED: {ex.Message}");
            }

            // Schema Migration Patch: Create UserWorkspacePreferences table (Structured Preferences)
            try
            {
                Console.WriteLine("DEBUG: Checking/Creating UserWorkspacePreferences table...");
                var createWorkspacePrefsTable = @"
                    IF OBJECT_ID('dbo.UserWorkspacePreferences', 'U') IS NULL
                    BEGIN
                        CREATE TABLE UserWorkspacePreferences (
                            Id INT IDENTITY(1,1) PRIMARY KEY,
                            UserId INT NOT NULL,
                            DepartmentId INT NOT NULL,
                            SortOrder INT NOT NULL DEFAULT 0,
                            IsVisible BIT NOT NULL DEFAULT 1,
                            IsCollapsed BIT NOT NULL DEFAULT 0,
                            CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                            UpdatedAt DATETIME2 NULL,
                            CONSTRAINT FK_UserWorkspacePreferences_User FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
                            CONSTRAINT FK_UserWorkspacePreferences_Department FOREIGN KEY (DepartmentId) REFERENCES Departments(Id) ON DELETE CASCADE
                        );
                        CREATE INDEX IX_UserWorkspacePreferences_UserId ON UserWorkspacePreferences(UserId);
                        CREATE UNIQUE INDEX IX_UserWorkspacePreferences_UserDept ON UserWorkspacePreferences(UserId, DepartmentId);
                    END";
                context.Database.ExecuteSqlRaw(createWorkspacePrefsTable.Replace("{}", "{{}}"));

                // Migrate existing SidebarPreferences JSON to UserWorkspacePreferences table
                Console.WriteLine("DEBUG: Migrating SidebarPreferences JSON to UserWorkspacePreferences...");
                var userPrefs = context.UserColumnPreferences
                    .Where(p => p.SidebarPreferences != null && p.SidebarPreferences != "{}")
                    .ToList();

                foreach (var pref in userPrefs)
                {
                    try
                    {
                        var json = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(pref.SidebarPreferences);
                        if (json == null) continue;

                        var order = json.ContainsKey("order") && json["order"].ValueKind == JsonValueKind.Array
                            ? json["order"].EnumerateArray().Select(e => e.GetInt32()).ToList()
                            : new List<int>();

                        var visibility = new Dictionary<int, bool>();
                        if (json.ContainsKey("visibility") && json["visibility"].ValueKind == JsonValueKind.Object)
                        {
                            foreach (var prop in json["visibility"].EnumerateObject())
                            {
                                if (int.TryParse(prop.Name, out int deptId))
                                {
                                    visibility[deptId] = prop.Value.GetBoolean();
                                }
                            }
                        }

                        // Create UserWorkspacePreference entries
                        for (int i = 0; i < order.Count; i++)
                        {
                            var deptId = order[i];
                            var isVisible = visibility.ContainsKey(deptId) ? visibility[deptId] : true;

                            // Check if already exists
                            var exists = context.UserWorkspacePreferences
                                .Any(uwp => uwp.UserId == pref.UserId && uwp.DepartmentId == deptId);

                            if (!exists)
                            {
                                context.UserWorkspacePreferences.Add(new UserWorkspacePreference
                                {
                                    UserId = pref.UserId,
                                    DepartmentId = deptId,
                                    SortOrder = i,
                                    IsVisible = isVisible,
                                    IsCollapsed = false, // Default to expanded
                                    CreatedAt = TimeHelper.Now
                                });
                            }
                        }
                    }
                    catch (Exception migEx)
                    {
                        Console.WriteLine($"Migration warning for UserId {pref.UserId}: {migEx.Message}");
                    }
                }

                context.SaveChanges();
                Console.WriteLine("DEBUG: UserWorkspacePreferences migration completed.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"CRITICAL ERROR: UserWorkspacePreferences Creation FAILED: {ex.Message}");
            }

            // Schema Migration Patch: Ensure UsedAt column exists on MagicLinks for grace period logic
            try
            {
                var addUsedAtCmd = "IF COL_LENGTH('MagicLinks', 'UsedAt') IS NULL BEGIN ALTER TABLE MagicLinks ADD UsedAt DATETIME2 NULL END";
                context.Database.ExecuteSqlRaw(addUsedAtCmd);
                Console.WriteLine("DEBUG: MagicLinks.UsedAt column verified/added.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Migration Warning (MagicLinks UsedAt): {ex.Message}");
            }

                // Schema Migration Patch: Ensure CompletedAt column exists on Tasks (New Requirement)
                try
                {
                    var addCompletedAtCmd = "IF COL_LENGTH('Tasks', 'CompletedAt') IS NULL BEGIN ALTER TABLE Tasks ADD CompletedAt DATETIME2 NULL END";
                    context.Database.ExecuteSqlRaw(addCompletedAtCmd);
                    Console.WriteLine("DEBUG: Tasks.CompletedAt column verified/added.");

                    // BACKFILL: Recover actual completion dates from ActivityLogs (User Approved)
                    var recoveryCmd = @"
                        UPDATE Tasks
                        SET CompletedAt = LogData.ActualCompletionDate
                        FROM Tasks t
                        INNER JOIN (
                            SELECT 
                                TRY_CAST(EntityId AS INT) as TaskId, 
                                MAX(LogDate) as ActualCompletionDate
                            FROM ActivityLogs
                            WHERE EntityType = 'Task' 
                              AND FieldName = 'Status' 
                              AND NewValue = 'done'
                            GROUP BY EntityId
                        ) LogData ON t.Id = LogData.TaskId
                        WHERE t.Status = 'done';";
                    context.Database.ExecuteSqlRaw(recoveryCmd);
                    Console.WriteLine("DEBUG: Recovered actual completion dates from logs.");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Migration Warning (Tasks CompletedAt): {ex.Message}");
                }

                // Create SQL View for Dashboard Performance Optimization
                try
                {
                    Console.WriteLine("DEBUG: Creating/Updating vw_DashboardTasks View...");
                    var createViewCmd = @"
                    IF OBJECT_ID('dbo.vw_DashboardTasks', 'V') IS NOT NULL
                        DROP VIEW dbo.vw_DashboardTasks;";
                    context.Database.ExecuteSqlRaw(createViewCmd);

                    // Create the view (must be separate batch)
                    var viewSql = @"
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
    t.CompletedAt,
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
WHERE t.IsDeleted = 0;";
                    context.Database.ExecuteSqlRaw(viewSql);
                    Console.WriteLine("DEBUG: vw_DashboardTasks View Created Successfully.");

                // Create View for Dashboard Statistics (Performance Optimization)
                var createStatsViewCmd = @"
                    CREATE OR REPLACE VIEW ""vw_UserDashboardStats"" AS
                    SELECT 
                        u.""Id"" as ""UserId"",
                        COUNT(t.""Id"") as ""TotalTasks"",
                        SUM(CASE WHEN t.""Status"" = 'done' THEN 1 ELSE 0 END) as ""CompletedTasks"",
                        SUM(CASE WHEN t.""Status"" = 'todo' THEN 1 ELSE 0 END) as ""TodoTasks"",
                        SUM(CASE WHEN t.""Status"" IN ('working', 'in_progress') THEN 1 ELSE 0 END) as ""InProgressTasks"",
                        SUM(CASE WHEN t.""Status"" = 'stuck' THEN 1 ELSE 0 END) as ""StuckTasks"",
                        SUM(CASE WHEN t.""Status"" = 'review' THEN 1 ELSE 0 END) as ""ReviewTasks"",
                        SUM(CASE WHEN t.""DueDate"" < CURRENT_TIMESTAMP AND t.""Status"" != 'done' THEN 1 ELSE 0 END) as ""OverdueTasks"",
                        COALESCE(AVG(t.""Progress""), 0) as ""AverageProgress""
                    FROM ""Users"" u
                    LEFT JOIN ""TaskAssignees"" ta ON u.""Id"" = ta.""UserId""
                    LEFT JOIN ""Tasks"" t ON ta.""TaskId"" = t.""Id"" AND t.""IsDeleted"" = 0
                    WHERE u.""IsDeleted"" = 0
                    GROUP BY u.""Id"";";

                // For SQL Server (Development Env), use CREATE VIEW, but since we might be on Postgres in prod or SQLite in test,
                // we need dialect awareness. Assuming Postgres given the quotes in the Plan file, but usually local is SQL Server?
                // Wait, User is on Mac, likely using Postgres or SQLite. 
                // Let's stick to standard SQL if possible, or T-SQL for "IF.. DROP.. CREATE" pattern.
                // Reverting to T-SQL friendly pattern for local dev compatibility if generic.

                var tSqlStatsView = @"
                    IF OBJECT_ID('dbo.vw_UserDashboardStats', 'V') IS NOT NULL DROP VIEW dbo.vw_UserDashboardStats;
                    EXEC('
                    CREATE VIEW dbo.vw_UserDashboardStats AS
                    SELECT 
                        u.Id as UserId,
                        COUNT(t.Id) as TotalTasks,
                        SUM(CASE WHEN t.Status = ''done'' THEN 1 ELSE 0 END) as DoneTasks,
                        SUM(CASE WHEN t.Status = ''todo'' THEN 1 ELSE 0 END) as TodoTasks,
                        SUM(CASE WHEN t.Status IN (''working'', ''in_progress'') THEN 1 ELSE 0 END) as InProgressTasks,
                        SUM(CASE WHEN t.Status = ''stuck'' THEN 1 ELSE 0 END) as StuckTasks,
                        SUM(CASE WHEN t.Status = ''review'' THEN 1 ELSE 0 END) as ReviewTasks,
                        SUM(CASE WHEN t.DueDate < GETDATE() AND t.Status != ''done'' THEN 1 ELSE 0 END) as OverdueTasks,
                        COALESCE(AVG(t.Progress), 0) as AverageProgress
                    FROM Users u
                    LEFT JOIN TaskAssignees ta ON u.Id = ta.UserId
                    LEFT JOIN Tasks t ON ta.TaskId = t.Id AND t.IsDeleted = 0
                    WHERE u.IsDeleted = 0
                    GROUP BY u.Id
                    ');";

                context.Database.ExecuteSqlRaw(tSqlStatsView);
                Console.WriteLine("DEBUG: vw_UserDashboardStats View Created Successfully.");

                // Create View for Project Listing Optimization (TECHNICAL_CONSTITUTION 2.1)
                var projectListView = @"
                    IF OBJECT_ID('dbo.vw_ProjectList', 'V') IS NOT NULL DROP VIEW dbo.vw_ProjectList;";
                context.Database.ExecuteSqlRaw(projectListView);

                var createProjectListView = @"
CREATE VIEW vw_ProjectList AS
SELECT 
    p.Id AS Id,
    p.Id AS ProjectId,
    p.Name,
    p.Description,
    p.Icon,
    p.Color,
    p.Status,
    p.Priority,
    p.IsPrivate,
    p.Owner,
    p.DepartmentId,
    p.CreatedAt,
    p.UpdatedAt,
    d.Name AS DepartmentName,
    d.Color AS DepartmentColor,
    (SELECT COUNT(*) FROM Tasks t WHERE t.ProjectId = p.Id AND t.IsDeleted = 0) AS TaskCount,
    (SELECT COUNT(*) FROM Tasks t WHERE t.ProjectId = p.Id AND t.IsDeleted = 0 AND t.Status = 'done') AS CompletedTaskCount,
    (SELECT COUNT(*) FROM ProjectMembers pm WHERE pm.ProjectId = p.Id) AS MemberCount
FROM Projects p
INNER JOIN Departments d ON p.DepartmentId = d.Id AND d.IsDeleted = 0
WHERE p.IsDeleted = 0;";
                context.Database.ExecuteSqlRaw(createProjectListView);
                Console.WriteLine("DEBUG: vw_ProjectList View Created Successfully.");

            }
            catch (Exception ex)
            {
                Console.WriteLine($"View Creation Warning: {ex.Message}");
            }

            // PERFORMANCE INDEXES - Critical for query speed
            try
            {
                Console.WriteLine("DEBUG: Creating Performance Indexes...");

                // 1. Tasks: Index for filtering by ProjectId and IsDeleted (most common query)
                context.Database.ExecuteSqlRaw(@"
                    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tasks_ProjectId_IsDeleted' AND object_id = OBJECT_ID('Tasks'))
                    CREATE NONCLUSTERED INDEX IX_Tasks_ProjectId_IsDeleted 
                    ON Tasks (ProjectId, IsDeleted)
                    INCLUDE (Title, Status, Priority, DueDate, Progress, CreatedAt, CreatedBy)");

                // 2. Tasks: Index for Status filtering
                context.Database.ExecuteSqlRaw(@"
                    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tasks_Status' AND object_id = OBJECT_ID('Tasks'))
                    CREATE NONCLUSTERED INDEX IX_Tasks_Status ON Tasks (Status)");

                // 3. Tasks: Index for CreatedAt ordering (pagination)
                context.Database.ExecuteSqlRaw(@"
                    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tasks_CreatedAt' AND object_id = OBJECT_ID('Tasks'))
                    CREATE NONCLUSTERED INDEX IX_Tasks_CreatedAt ON Tasks (CreatedAt DESC)");

                // 4. TaskAssignees: Index for user assignments
                context.Database.ExecuteSqlRaw(@"
                    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TaskAssignees_UserId_TaskId' AND object_id = OBJECT_ID('TaskAssignees'))
                    CREATE NONCLUSTERED INDEX IX_TaskAssignees_UserId_TaskId ON TaskAssignees (UserId, TaskId)");

                // 5. TaskLabels: Index for label lookups
                context.Database.ExecuteSqlRaw(@"
                    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TaskLabels_TaskId' AND object_id = OBJECT_ID('TaskLabels'))
                    CREATE NONCLUSTERED INDEX IX_TaskLabels_TaskId ON TaskLabels (TaskId)");

                // 6. Users: Filtered index for non-deleted users
                context.Database.ExecuteSqlRaw(@"
                    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_IsDeleted' AND object_id = OBJECT_ID('Users'))
                    CREATE NONCLUSTERED INDEX IX_Users_IsDeleted ON Users (IsDeleted) WHERE IsDeleted = 0");

                // 7. Projects: Index for listing
                context.Database.ExecuteSqlRaw(@"
                    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Projects_IsDeleted_DepartmentId' AND object_id = OBJECT_ID('Projects'))
                    CREATE NONCLUSTERED INDEX IX_Projects_IsDeleted_DepartmentId ON Projects (IsDeleted, DepartmentId)

                -- 8. Subtasks: CRITICAL for List View Counts
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Subtasks_TaskId' AND object_id = OBJECT_ID('Subtasks'))
                    CREATE NONCLUSTERED INDEX IX_Subtasks_TaskId ON Subtasks (TaskId)

                -- 9. Comments: CRITICAL for List View Counts
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Comments_TaskId' AND object_id = OBJECT_ID('Comments'))
                    CREATE NONCLUSTERED INDEX IX_Comments_TaskId ON Comments (TaskId)");

                Console.WriteLine("DEBUG: Performance Indexes Created Successfully.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Index Creation Warning: {ex.Message}");
            }

            // Ensure DB is seeded only if empty
            // ONE-TIME CLEANUP: Clear residual default avatars that were forced by previous logic
            try
            {
                var usersWithDefaults = context.Users
                    .Where(u => u.Avatar != null && (u.Avatar.Contains("notionists") || u.Avatar.Contains("avataaars")))
                    .ToList();

                if (usersWithDefaults.Any())
                {
                    foreach (var u in usersWithDefaults) u.Avatar = null;
                    context.SaveChanges();
                    Console.WriteLine($"DEBUG: Cleaned up {usersWithDefaults.Count} legacy default avatars.");
                }

                // EMERGENCY CLEANUP: Remove accidental project duplicates
                // Why: Previous seed logic checked for duplicates without IgnoreQueryFilters,
                // so it re-created projects that were soft-deleted. This restores the clean state.
                var duplicateGroups = context.Projects.IgnoreQueryFilters()
                    .AsEnumerable() // Client-side group (safer for mixed providers)
                    .GroupBy(p => p.Name)
                    .Where(g => g.Count() > 1)
                    .ToList();

                if (duplicateGroups.Any())
                {
                    var toDelete = new List<Project>();
                    foreach (var group in duplicateGroups)
                    {
                        // Identify seeds we care about
                        var isSeedProject = group.Key.Contains("Stokbar") || group.Key.Contains("Enroute") ||
                                          group.Key.Contains("Quest") || group.Key.Contains("Yönetim") ||
                                          group.Key.Contains("Satış") || group.Key.Contains("İK") ||
                                          group.Key.Contains("Pazarlama") || group.Key.Contains("Mobile") ||
                                          group.Key.Contains("Bütçe") || group.Key.Contains("AI Team");

                        if (isSeedProject)
                        {
                            // Keep the logic simple: Keep the OLDEST (lowest ID), delete the REST (new duplicates).
                            // This ensures the soft-deleted original remains, and the active duplicate is gone.
                            var dups = group.OrderBy(p => p.Id).Skip(1);
                            toDelete.AddRange(dups);
                        }
                    }

                    if (toDelete.Any())
                    {
                        context.Projects.RemoveRange(toDelete);
                        context.SaveChanges();
                        Console.WriteLine($"DEBUG: Removed {toDelete.Count} accidental project duplicates.");
                    }
                }

            }
            catch (Exception ex)
            {
                Console.WriteLine($"Cleanup Warning: {ex.Message}");
            }

            // IDEMPOTENT SEEDING (Constitution Safe-Guard)
            // Instead of returning early, we check and seed missing critical data.
            // FIXED: Must use IgnoreQueryFilters to see Soft-Deleted records too!

            // Maps to track legacy String IDs to new Int IDs
            var deptMap = context.Departments.IgnoreQueryFilters().AsEnumerable().GroupBy(d => d.Name).ToDictionary(g => g.Key, g => g.First().Id);
            var userMap = context.Users.IgnoreQueryFilters().AsEnumerable().GroupBy(u => u.Username).ToDictionary(g => g.Key, g => g.First().Id);
            var projectMap = context.Projects.IgnoreQueryFilters().AsEnumerable().GroupBy(p => p.Name).ToDictionary(g => g.Key, g => g.First().Id);
            var labelMap = context.Labels.IgnoreQueryFilters().AsEnumerable().GroupBy(l => l.Name + "_" + l.ProjectId).ToDictionary(g => g.Key, g => g.First().Id);

            // Password Hash
            var passwordHash = BCrypt.Net.BCrypt.HashPassword("test123");





            /* 
               [DISABLED BY USER ORDER] - Auto-seeding is disabled to prevent duplicate/demo data creation.
               Use provided SQL scripts for data management.
            
            // ... (Seeding Logic Removed) ...
            */

            // Clean exit
            return;



        }
    }
}
