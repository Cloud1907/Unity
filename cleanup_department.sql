-- =============================================
-- Department Deep Cleanup Script (Hierarchical)
-- Use this script to manually delete a department and all related data.
-- =============================================

DECLARE @DeptId INT = 0; -- <-- SET THE DEPARTMENT ID HERE
SET NOCOUNT ON;

IF @DeptId = 0
BEGIN
    PRINT 'Error: Please set a valid @DeptId value at the top of the script.';
    RETURN;
END

BEGIN TRANSACTION;
BEGIN TRY
    PRINT 'Starting cleanup for Department ID: ' + CAST(@DeptId AS NVARCHAR(10));

    -- 1. Get Project IDs
    DECLARE @ProjectIds TABLE (Id INT);
    INSERT INTO @ProjectIds (Id) SELECT Id FROM Projects WHERE DepartmentId = @DeptId;

    -- 2. Get Task IDs
    DECLARE @TaskIds TABLE (Id INT);
    INSERT INTO @TaskIds (Id) SELECT Id FROM Tasks WHERE ProjectId IN (SELECT Id FROM @ProjectIds);

    -- 3. Get Subtask IDs
    DECLARE @SubtaskIds TABLE (Id INT);
    INSERT INTO @SubtaskIds (Id) SELECT Id FROM Subtasks WHERE TaskId IN (SELECT Id FROM @TaskIds);

    -- --- CLEANUP HIERARCHY ---

    -- 4. Subtask Level
    PRINT 'Cleaning up Subtask Assignees...';
    DELETE FROM TaskAssignees WHERE SubtaskId IN (SELECT Id FROM @SubtaskIds);
    
    PRINT 'Cleaning up Subtasks...';
    DELETE FROM Subtasks WHERE Id IN (SELECT Id FROM @SubtaskIds);

    -- 5. Task Level
    PRINT 'Cleaning up Task Assignees...';
    DELETE FROM TaskAssignees WHERE TaskId IN (SELECT Id FROM @TaskIds);
    
    PRINT 'Cleaning up Task Labels...';
    DELETE FROM TaskLabels WHERE TaskId IN (SELECT Id FROM @TaskIds);
    
    PRINT 'Cleaning up Comments...';
    DELETE FROM Comments WHERE TaskId IN (SELECT Id FROM @TaskIds);
    
    PRINT 'Cleaning up Attachments...';
    DELETE FROM Attachments WHERE TaskId IN (SELECT Id FROM @TaskIds);
    
    PRINT 'Cleaning up Tasks...';
    DELETE FROM Tasks WHERE Id IN (SELECT Id FROM @TaskIds);

    -- 6. Project Level
    PRINT 'Cleaning up Project Members...';
    DELETE FROM ProjectMembers WHERE ProjectId IN (SELECT Id FROM @ProjectIds);
    
    PRINT 'Cleaning up Project Labels...';
    DELETE FROM Labels WHERE ProjectId IN (SELECT Id FROM @ProjectIds);
    
    PRINT 'Cleaning up Projects...';
    DELETE FROM Projects WHERE Id IN (SELECT Id FROM @ProjectIds);

    -- 7. User-Department Links
    PRINT 'Cleaning up User-Department mappings...';
    DELETE FROM UserDepartments WHERE DepartmentId = @DeptId;

    -- 8. Department Level
    PRINT 'Deleting Department...';
    DELETE FROM Departments WHERE Id = @DeptId;

    COMMIT TRANSACTION;
    PRINT 'Cleanup completed successfully for Department ID: ' + CAST(@DeptId AS NVARCHAR(10));
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'Error occurred during cleanup: ' + ERROR_MESSAGE();
    PRINT 'All changes rolled back.';
END CATCH;
GO
