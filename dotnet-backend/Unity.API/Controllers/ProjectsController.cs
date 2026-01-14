using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unity.Core.Models;
using Unity.Infrastructure.Data;
using System.Text.Json;

namespace Unity.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProjectsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProjectsController(AppDbContext context)
        {
            _context = context;
        }

        // Mock Helper - Enhanced for Testing
        private async Task<User> GetCurrentUserAsync()
        {
            if (Request.Headers.TryGetValue("X-Test-User-Id", out var userId))
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.ToString());
                if (user != null) return user;
            }
            
            // Fallback
            return await _context.Users.FirstOrDefaultAsync() ?? new User { Id = "test-user", Departments = new List<string> { "IT", "Marketing" } };
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Project>>> GetProjects()
        {
            Console.WriteLine("DEBUG: GetProjects Called");
            try {
                var currentUser = await GetCurrentUserAsync();
                Console.WriteLine($"DEBUG: CurrentUser: {currentUser.Id}");
                var userDeptList = currentUser.Departments ?? new List<string>();

                // Optimisation needed...
                var projects = await _context.Projects.ToListAsync();
                Console.WriteLine($"DEBUG: Projects Count: {projects.Count}");
                
                var visibleProjects = projects.Where(p => 
                    currentUser.Role == "admin" || // Admin bypass
                    p.Owner == currentUser.Id || 
                    p.Members.Contains(currentUser.Id) || 
                    (userDeptList.Contains(p.Department) && !p.IsPrivate)
                ).ToList();
                Console.WriteLine($"DEBUG: Visible Count: {visibleProjects.Count}");

                return visibleProjects;
            } catch (Exception ex) {
                Console.WriteLine($"DEBUG: Error: {ex}");
                throw;
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Project>> GetProject(string id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return NotFound();

            var currentUser = await GetCurrentUserAsync();
            
            // Check Access
            bool hasAccess = project.Owner == currentUser.Id ||
                             project.Members.Contains(currentUser.Id) ||
                             (currentUser.Departments.Contains(project.Department) && !project.IsPrivate);

            if (!hasAccess) return Forbid();

            return project;
        }

        [HttpPost]
        public async Task<ActionResult<Project>> PostProject(Project project)
        {
            Console.WriteLine($"DEBUG [ProjectsController.PostProject]: Creating project '{project.Name}' in department '{project.Department}'");
            var currentUser = await GetCurrentUserAsync();
            Console.WriteLine($"DEBUG [ProjectsController.PostProject]: Current User: {currentUser.FullName} ({currentUser.Id}), Depts: {string.Join(", ", currentUser.Departments ?? new List<string>())}");

            // Validate Department
            if (!string.IsNullOrEmpty(project.Department))
            {
                if (!currentUser.Departments.Contains(project.Department) && currentUser.Role != "admin")
                {
                    Console.WriteLine($"DEBUG [ProjectsController.PostProject]: User does not belong to department '{project.Department}'");
                    return BadRequest("You cannot create a project in a department you do not belong to.");
                }
            }
            else if (currentUser.Departments.Count == 1)
            {
                // Auto-assign if only 1 dept
                project.Department = currentUser.Departments[0];
            }
            else if (currentUser.Departments.Count > 1 && currentUser.Role != "admin")
            {
                return BadRequest("Please select a department for this project.");
            }

            project.CreatedBy = currentUser.Id;
            project.Owner = currentUser.Id;
            project.MembersJson = JsonSerializer.Serialize(new List<string> { currentUser.Id });
            
            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetProject", new { id = project.Id }, project);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutProject(string id, Project project)
        {
            if (id != project.Id) return BadRequest();

            var currentUser = await GetCurrentUserAsync();
            var existingProject = await _context.Projects.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);

            if (existingProject == null) return NotFound();

            // Only Owner or Admin (not implemented here) can edit core details?
            // Or anyone with access? Let's assume Owner for critical changes usually.
            // For now, allow if has access (simplified).
            if (existingProject.Owner != currentUser.Id) 
            {
                // Allow update if member? 
                // Using simplified check matching Python:
                if (!existingProject.Members.Contains(currentUser.Id)) return Forbid();
            }

            _context.Entry(project).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProjectExists(id)) return NotFound();
                else throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(string id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return NotFound();

            var currentUser = await GetCurrentUserAsync();
            if (project.Owner != currentUser.Id) return Forbid();

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ProjectExists(string id)
        {
            return _context.Projects.Any(e => e.Id == id);
        }
    }
}
