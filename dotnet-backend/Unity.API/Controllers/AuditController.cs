using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unity.Core.Models;
using Unity.Infrastructure.Data;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Unity.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuditController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuditController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Audit/task/{taskId}
        [HttpGet("task/{taskId}")]
        public async Task<ActionResult<IEnumerable<AuditLog>>> GetTaskLogs(string taskId)
        {
            var logs = await _context.AuditLogs
                .Where(l => l.EntityName == "Task" && l.EntityId == taskId)
                .OrderByDescending(l => l.Timestamp)
                .ToListAsync();

            return logs;
        }

        // GET: api/Audit/project/{projectId}
        [HttpGet("project/{projectId}")]
        public async Task<ActionResult<IEnumerable<AuditLog>>> GetProjectLogs(string projectId)
        {
            var logs = await _context.AuditLogs
                .Where(l => l.EntityName == "Project" && l.EntityId == projectId)
                .OrderByDescending(l => l.Timestamp)
                .ToListAsync();

            return logs;
        }
    }
}
