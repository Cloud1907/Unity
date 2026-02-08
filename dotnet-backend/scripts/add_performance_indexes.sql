-- Performance Indexes for Unity Database
-- Run this script directly against the database

-- 1. Tasks: Index for filtering by ProjectId and IsDeleted (most common query)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tasks_ProjectId_IsDeleted' AND object_id = OBJECT_ID('Tasks'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Tasks_ProjectId_IsDeleted 
    ON Tasks (ProjectId, IsDeleted)
    INCLUDE (Title, Status, Priority, DueDate, Progress, CreatedAt, CreatedBy);
    PRINT 'Created: IX_Tasks_ProjectId_IsDeleted';
END

-- 2. Tasks: Index for Status filtering
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tasks_Status' AND object_id = OBJECT_ID('Tasks'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Tasks_Status 
    ON Tasks (Status);
    PRINT 'Created: IX_Tasks_Status';
END

-- 3. Tasks: Index for CreatedAt ordering (pagination)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tasks_CreatedAt' AND object_id = OBJECT_ID('Tasks'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Tasks_CreatedAt 
    ON Tasks (CreatedAt DESC);
    PRINT 'Created: IX_Tasks_CreatedAt';
END

-- 4. TaskAssignees: Index for user assignments
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TaskAssignees_UserId_TaskId' AND object_id = OBJECT_ID('TaskAssignees'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_TaskAssignees_UserId_TaskId 
    ON TaskAssignees (UserId, TaskId);
    PRINT 'Created: IX_TaskAssignees_UserId_TaskId';
END

-- 5. TaskLabels: Index for label lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TaskLabels_TaskId' AND object_id = OBJECT_ID('TaskLabels'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_TaskLabels_TaskId 
    ON TaskLabels (TaskId);
    PRINT 'Created: IX_TaskLabels_TaskId';
END

-- 6. Users: Index for IsDeleted filter
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_IsDeleted' AND object_id = OBJECT_ID('Users'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Users_IsDeleted 
    ON Users (IsDeleted)
    WHERE IsDeleted = 0;
    PRINT 'Created: IX_Users_IsDeleted (filtered)';
END

-- 7. Projects: Index for ProjectListViews optimization
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Projects_IsDeleted_DepartmentId' AND object_id = OBJECT_ID('Projects'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Projects_IsDeleted_DepartmentId 
    ON Projects (IsDeleted, DepartmentId);
    PRINT 'Created: IX_Projects_IsDeleted_DepartmentId';
END

PRINT '--- All indexes created successfully ---';
