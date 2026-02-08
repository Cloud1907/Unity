using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unity.Infrastructure.Data;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.Generic;
using System;

namespace Unity.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DebugController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DebugController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("check-legacy-data")]
        public async Task<IActionResult> CheckLegacyData()
        {
            var connection = _context.Database.GetDbConnection();
            await connection.OpenAsync();
            var command = connection.CreateCommand();
            
            try 
            {
                // Check if Subtasks table exists and count rows
                command.CommandText = "SELECT COUNT(*) FROM Subtasks";
                var count = (int)(await command.ExecuteScalarAsync() ?? 0);
                
                // Get sample data structure to help with migration mapping
                command.CommandText = "SELECT TOP 1 * FROM Subtasks";
                var columns = new List<string>();
                using (var reader = await command.ExecuteReaderAsync())
                {
                    if (reader.HasRows)
                    {
                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            columns.Add(reader.GetName(i) + " (" + reader.GetDataTypeName(i) + ")");
                        }
                    }
                }

                return Ok(new { TableExists = true, RowCount = count, Columns = columns });
            }
            catch (Exception ex)
            {
                return Ok(new { TableExists = false, Error = ex.Message });
            }
            finally
            {
                await connection.CloseAsync();
            }
        }
        [HttpGet("check-alignment")]
        public async Task<IActionResult> CheckAlignment()
        {
            var connection = _context.Database.GetDbConnection();
            await connection.OpenAsync();
            var command = connection.CreateCommand();
            
            try 
            {
                var result = new Dictionary<string, object>();

                // 1. Get First 3 Subtasks
                command.CommandText = "SELECT TOP 3 Id, Title, TaskId, IsCompleted FROM Subtasks ORDER BY Id ASC";
                var subtasks = new List<object>();
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        subtasks.Add(new { 
                            Id = reader.GetValue(0), 
                            Title = reader.GetValue(1),
                            TaskId = reader.GetValue(2),
                            IsCompleted = reader.GetValue(3)
                        });
                    }
                }
                result["Subtasks_First3"] = subtasks;

                // 2. Get Last 3 TaskAssignees
                command.CommandText = "SELECT TOP 3 Id, UserId, TaskId, SubtaskId FROM TaskAssignees ORDER BY Id DESC";
                var assignees = new List<object>();
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        assignees.Add(new { 
                            Id = reader.GetValue(0), 
                            UserId = reader.GetValue(1),
                            TaskId = reader.IsDBNull(2) ? null : reader.GetValue(2),
                            SubtaskId = reader.IsDBNull(3) ? null : reader.GetValue(3)
                        });
                    }
                }
                result["TaskAssignees_Last3"] = assignees;

                return Ok(result);
            }
            finally
            {
                await connection.CloseAsync();
            }
        }
    }
}
