using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks; 
using Unity.API.Services;
using Unity.Infrastructure.Data;
using Unity.Core.Models;

namespace Unity.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPdfService _pdfService;

        public ReportsController(AppDbContext context, IPdfService pdfService)
        {
            _context = context;
            _pdfService = pdfService;
        }

        [HttpGet("project/{projectId}/pdf")]
        public async System.Threading.Tasks.Task<IActionResult> GetProjectPdf(int projectId)
        {
            // 1. Fetch Project
            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null) return NotFound("Proje bulunamadı.");

            // Performance & Security Fix: Check Access
            var claimId = User.FindFirst("id")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(claimId, out int userId)) return Unauthorized();

            var currentUser = await _context.Users.Include(u => u.Departments).AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            var isMember = await _context.ProjectMembers.AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);

            if (currentUser == null) return Unauthorized();
            
            // Isolation Rule: Must be owner, member or in same department for public projects
            bool hasAccess = project.Owner == userId || isMember || 
                             (!project.IsPrivate && currentUser.Departments.Any(d => d.DepartmentId == project.DepartmentId));

            if (!hasAccess) return Forbid();

            // 2. Fetch Tasks with all relations needed for the Gantt Chart
            var tasks = await _context.Tasks
                .Where(t => t.ProjectId == projectId && !t.IsDeleted)
                .Include(t => t.Assignees)
                .Include(t => t.Subtasks)
                .ToListAsync();

            // 3. Fetch Users (for resolving assignees names)
            var users = await _context.Users.ToListAsync();

            // 4. Generate PDF
            var pdfBytes = _pdfService.GenerateProjectStatusReport(project, tasks, users);

            // 5. Return File
            var filename = $"{project.Name}_Rapor_{DateTime.Now:yyyyMMdd_HHmm}.pdf";
            return File(pdfBytes, "application/pdf", filename);
        }
    }
}
