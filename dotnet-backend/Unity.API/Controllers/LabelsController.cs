using Microsoft.AspNetCore.Mvc;
using Unity.Core.Helpers;
using Microsoft.EntityFrameworkCore;
using Unity.Infrastructure.Data;
using Unity.Core.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Unity.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public class LabelsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LabelsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Label>>> GetAllLabels([FromQuery] bool global_only = false)
        {
            // For now return all or implement global logic if we had 'system labels'
            var labels = await _context.Labels.ToListAsync();
            return Ok(labels);
        }

        [HttpGet("project/{projectId}")]
        public async Task<ActionResult<IEnumerable<Label>>> GetLabelsByProject(int projectId)
        {
            var labels = await _context.Labels
                                       .Where(l => l.ProjectId == projectId)
                                       .OrderBy(l => l.Name)
                                       .ToListAsync();
            return Ok(labels);
        }

        [HttpPost]
        public async Task<ActionResult<Label>> CreateLabel([FromBody] Label label)
        {
            if (label.ProjectId <= 0)
                return BadRequest("ProjectId is required");
            
            if (string.IsNullOrEmpty(label.Name))
                return BadRequest("Name is required");

            // Check duplicate name in project
            var exists = await _context.Labels
                .AnyAsync(l => l.ProjectId == label.ProjectId && l.Name == label.Name);
            
            if (exists)
            {
                return Conflict(new { 
                    detail = "Bu isimde bir etiket bu projede zaten mevcut.", 
                    message = "Bu isimde bir etiket bu projede zaten mevcut.",
                    title = "Tekrarlayan Kayıt"
                });
            }

            // Guid.NewGuid() removed for Int Identity
            label.Id = 0;
            
            if (string.IsNullOrEmpty(label.Color))
                label.Color = "#cccccc";

            label.CreatedAt = TimeHelper.Now;

            _context.Labels.Add(label);
            await _context.SaveChangesAsync();

            return Ok(label);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLabel(int id)
        {
            var label = await _context.Labels.FindAsync(id);
            if (label == null)
                return NotFound();

            _context.Labels.Remove(label);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
