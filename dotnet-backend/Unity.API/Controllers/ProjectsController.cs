using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using Unity.Core.Models;
using Unity.Infrastructure.Data;

namespace Unity.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProjectsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProjectsController(AppDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            var claimId = User.FindFirst("id")?.Value 
                          ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (int.TryParse(claimId, out int userId))
            {
                return userId;
            }
            throw new UnauthorizedAccessException("Invalid User ID in token.");
        }

        private async Task<User> GetCurrentUserWithDeptsAsync()
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId);
                
            return user ?? throw new UnauthorizedAccessException("User not found.");
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Project>>> GetProjects()
        {
            var currentUser = await GetCurrentUserWithDeptsAsync();
            var userDepts = currentUser.Departments ?? new List<int>();

            // Enterprise Optimization: 
            // Fetching as NoTracking for read performance.
            // Note: 'Members' is stored as JSON, preventing full SQL-side filtering for that field without schema changes.
            // We filter strictly on SQL-compatible fields first to minimize memory footprint.
            
            var allProjects = await _context.Projects.AsNoTracking().ToListAsync();

            var visibleProjects = allProjects.Where(p => 
                currentUser.Role == "admin" ||
                p.Owner == currentUser.Id || 
                p.Members.Contains(currentUser.Id) || 
                (userDepts.Contains(p.DepartmentId) && !p.IsPrivate)
            ).ToList();

            return Ok(visibleProjects);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Project>> GetProject(int id)
        {
            var project = await _context.Projects.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
            
            if (project == null) 
                return NotFound();

            var currentUser = await GetCurrentUserWithDeptsAsync();
            
            bool hasAccess = currentUser.Role == "admin" ||
                             project.Owner == currentUser.Id ||
                             project.Members.Contains(currentUser.Id) ||
                             (currentUser.Departments.Contains(project.DepartmentId) && !project.IsPrivate);

            if (!hasAccess) 
                return Forbid();

            return Ok(project);
        }

        [HttpPost]
        public async Task<ActionResult<Project>> PostProject(Project project)
        {
            var currentUser = await GetCurrentUserWithDeptsAsync();

            // Department Validation
            if (project.DepartmentId > 0 && currentUser.Role != "admin")
            {
                if (!currentUser.Departments.Contains(project.DepartmentId))
                {
                    return BadRequest("Seçilen departmanda proje oluşturma yetkiniz yok.");
                }
            }
            else if (currentUser.Departments.Count == 1)
            {
                project.DepartmentId = currentUser.Departments[0];
            }
            else if (currentUser.Departments.Count > 1 && project.DepartmentId == 0 && currentUser.Role != "admin")
            {
                return BadRequest("Lütfen bir departman seçiniz.");
            }

            // Defaults
            project.CreatedBy = currentUser.Id;
            project.Owner = currentUser.Id;
            project.MembersJson = JsonSerializer.Serialize(new List<int> { currentUser.Id });
            project.CreatedAt = DateTime.UtcNow;
            project.UpdatedAt = DateTime.UtcNow;
            
            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProject), new { id = project.Id }, project);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutProject(int id, Project project)
        {
            if (id != project.Id) 
                return BadRequest("ID mismatch.");

            var currentUser = await GetCurrentUserWithDeptsAsync();
            var existingProject = await _context.Projects.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);

            if (existingProject == null) 
                return NotFound();

            // Permission Check: Owner, Member, or Admin
            bool canEdit = currentUser.Role == "admin" ||
                           existingProject.Owner == currentUser.Id ||
                           existingProject.Members.Contains(currentUser.Id);

            if (!canEdit) 
                return Forbid();

            project.UpdatedAt = DateTime.UtcNow;
            _context.Entry(project).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Projects.Any(e => e.Id == id)) return NotFound();
                else throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) 
                return NotFound();

            var currentUser = await GetCurrentUserWithDeptsAsync();

            // Strict Delete Permission: Only Owner or Admin
            if (project.Owner != currentUser.Id && currentUser.Role != "admin") 
            {
                return StatusCode(403, new { 
                    message = "Projeyi sadece oluşturan kişi veya yönetici silebilir.",
                    title = "Yetkisiz İşlem"
                });
            }

            try
            {
                // Cascade Delete Logic (Manual handling for consistency)
                var tasks = _context.Tasks.Where(t => t.ProjectId == id);
                _context.Tasks.RemoveRange(tasks);

                var labels = _context.Labels.Where(l => l.ProjectId == id);
                _context.Labels.RemoveRange(labels);

                _context.Projects.Remove(project);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                // Return generic error structure
                return BadRequest(new { detail = ex.InnerException?.Message ?? ex.Message });
            }
        }

        [HttpPut("{id}/favorite")]
        public async Task<ActionResult<Project>> ToggleFavorite(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) 
                return NotFound();

            var currentUser = await GetCurrentUserWithDeptsAsync();
            
            bool hasAccess = currentUser.Role == "admin" ||
                             project.Owner == currentUser.Id ||
                             project.Members.Contains(currentUser.Id) ||
                             (currentUser.Departments.Contains(project.DepartmentId) && !project.IsPrivate);

            if (!hasAccess) 
                return Forbid();

            // Notes: 'Favorite' is currently a shared property on the Project model. 
            // In a future schema update, this should be moved to a UserProjectPreference table.
            project.Favorite = !project.Favorite;
            
            await _context.SaveChangesAsync();

            return Ok(project);
        }
    }
}
