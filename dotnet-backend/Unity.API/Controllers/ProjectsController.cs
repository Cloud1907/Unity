using Microsoft.AspNetCore.Authorization;
using Unity.Core.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Unity.Core.Models;
using Unity.Infrastructure.Data;
using Unity.Core.Interfaces;

namespace Unity.API.Controllers
{
    [Authorize]
    public class ProjectsController : BaseController
    {
        private readonly IProjectService _projectService;

        public ProjectsController(AppDbContext context, IProjectService projectService) : base(context)
        {
            _projectService = projectService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<dynamic>>> GetProjects()
        {
            var currentUser = await GetCurrentUserWithDeptsAsync();
            var userDepts = currentUser.Departments?.Select(d => d.DepartmentId).ToList() ?? new List<int>();

            var projects = await _projectService.GetProjectsAsync(currentUser.Id, currentUser.Role ?? "", userDepts);
            return Ok(projects);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Project>> GetProject(int id)
        {
            var currentUser = await GetCurrentUserWithDeptsAsync();
            var userDepts = currentUser.Departments?.Select(d => d.DepartmentId).ToList() ?? new List<int>();

            var project = await _projectService.GetProjectByIdAsync(id, currentUser.Id, currentUser.Role ?? "", userDepts);

            if (project == null)
                return NotFound(); // Or Forbid based on service return, but null usually means Not Found or No Access in this pattern

            return Ok(project);
        }

        [HttpPost]
        public async Task<ActionResult<Project>> PostProject(Project project)
        {
            var currentUser = await GetCurrentUserWithDeptsAsync();

            // Department Validation (Controller Layer validation)
            if (project.DepartmentId > 0 && currentUser.Role != "admin")
            {
                if (!currentUser.Departments.Any(d => d.DepartmentId == project.DepartmentId))
                {
                    return BadRequest("Seçilen departmanda proje oluşturma yetkiniz yok.");
                }
            }
            else if (currentUser.Departments.Count == 1)
            {
                project.DepartmentId = currentUser.Departments[0].DepartmentId;
            }
            else if (currentUser.Departments.Count > 1 && project.DepartmentId == 0 && currentUser.Role != "admin")
            {
                // return BadRequest("Lütfen bir departman seçiniz."); // Allow global for now if logic permits, or enforce
            }

            var createdProject = await _projectService.CreateProjectAsync(project, currentUser.Id, currentUser.Role ?? "", currentUser.Departments.ToList());
            
            return CreatedAtAction(nameof(GetProject), new { id = createdProject.Id }, createdProject);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutProject(int id, Project project)
        {
            if (id != project.Id) return BadRequest("ID mismatch.");

            var currentUser = await GetCurrentUserWithDeptsAsync();
            var userDepts = currentUser.Departments?.Select(d => d.DepartmentId).ToList() ?? new List<int>();

            var updatedProject = await _projectService.UpdateProjectAsync(id, project, currentUser.Id, currentUser.Role ?? "", userDepts);

            if (updatedProject == null) return NotFound(); // Or Forbid

            return Ok(updatedProject);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var currentUser = await GetCurrentUserWithDeptsAsync();
            
            // Service handles permission check inside logic or returns false
            var result = await _projectService.DeleteProjectAsync(id, currentUser.Id, currentUser.Role ?? "");

            if (!result) return StatusCode(403, new { message = "Silme yetkiniz yok veya proje bulunamadı." });

            return NoContent();
        }

        [HttpPut("{id}/favorite")]
        public async Task<ActionResult<Project>> ToggleFavorite(int id)
        {
            var currentUser = await GetCurrentUserWithDeptsAsync();
            var userDepts = currentUser.Departments?.Select(d => d.DepartmentId).ToList() ?? new List<int>();

            var project = await _projectService.ToggleFavoriteAsync(id, currentUser.Id, currentUser.Role ?? "", userDepts);

            if (project == null) return NotFound();

            return Ok(project);
        }
    }
}
