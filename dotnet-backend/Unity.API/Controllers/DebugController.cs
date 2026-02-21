using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unity.Infrastructure.Data;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.Generic;
using System;
using Unity.Infrastructure.Services;

namespace Unity.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DebugController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;

        public DebugController(AppDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
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

        [HttpGet("send-test-email")]
        public async Task<IActionResult> SendTestEmail(string to)
        {
            try 
            {
                await _emailService.SendEmailAsync(to, "UniTask Sistem Testi", "<h1>UniTask Sistem Testi</h1><p>Bu email, sistemdeki son değişiklikleri doğrulamak amacıyla gönderilmiştir.</p><p>Zaman: " + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "</p>");
                return Ok(new { Message = $"Email successfully sent to {to}", Time = DateTime.Now });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message, Type = ex.GetType().Name });
            }
        }

        [HttpGet("trigger-assignment-email")]
        public async Task<IActionResult> TriggerAssignmentEmail(string to)
        {
            try 
            {
                var subtasks = new List<Unity.Core.DTOs.EmailSubtaskDto>
                {
                    new Unity.Core.DTOs.EmailSubtaskDto { Title = "E-posta şablonu oluşturma", IsCompleted = true },
                    new Unity.Core.DTOs.EmailSubtaskDto { Title = "SMTP entegrasyonu", IsCompleted = true },
                    new Unity.Core.DTOs.EmailSubtaskDto { Title = "Canlı testlerin tamamlanması", IsCompleted = false }
                };

                await _emailService.SendTaskAssignmentEmailAsync(
                    to,
                    "Melih Bulut",
                    "Bu e-posta, UniTask bildirim sisteminin tasarımını ve içeriğini doğrulamak amacıyla otomatik olarak oluşturulmuştur. Yeni eklenen premium tasarım öğelerini ve mobil uyumlu yapıyı kontrol edebilirsiniz.",
                    "Antigravity AI",
                    "Yazılım Geliştirme",
                    "UniTask Otomasyon",
                    "E-posta Bildirim Sistemi Testi",
                    null,
                    "High",
                    DateTime.Now.AddDays(5),
                    25, // Dummy ProjectId
                    2723, // Dummy TaskId
                    subtasks
                );

                return Ok(new { Message = $"Rich assignment email triggered for {to}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message, Stack = ex.StackTrace });
            }
        }
    }
}
