using Microsoft.AspNetCore.Mvc;
using Unity.Core.Helpers;
using Microsoft.EntityFrameworkCore;
using Unity.Infrastructure.Data;
using Unity.Core.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Unity.API.Hubs;
using Microsoft.AspNetCore.Authorization;

namespace Unity.API.Controllers
{
    [Authorize]
    public class LabelsController : BaseController
    {
        private readonly IHubContext<AppHub> _hubContext;

        public LabelsController(AppDbContext context, IHubContext<AppHub> hubContext) : base(context)
        {
            _hubContext = hubContext;
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
                return Conflict(new
                {
                    detail = "Bu isimde bir etiket bu projede zaten mevcut.",
                    message = "Bu isimde bir etiket bu projede zaten mevcut.",
                    title = "Tekrarlayan Kayıt"
                });
            }

            var userId = GetCurrentUserId();
            label.Id = 0;
            label.CreatedBy = userId;

            if (string.IsNullOrEmpty(label.Color))
                label.Color = "#cccccc";

            label.CreatedAt = TimeHelper.Now;

            _context.Labels.Add(label);
            await _context.SaveChangesAsync();

            await _hubContext.Clients.All.SendAsync("LabelCreated", label);

            return Ok(label);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Label>> UpdateLabel(int id, [FromBody] Label label)
        {
            var existingLabel = await _context.Labels.FindAsync(id);
            if (existingLabel == null)
                return NotFound();

            var userId = GetCurrentUserId();
            var isAdmin = User.IsInRole("admin");

            if (existingLabel.CreatedBy != userId && !isAdmin)
            {
                return StatusCode(403, new { message = "Bu etiketi sadece oluşturan kişi veya yönetici güncelleyebilir." });
            }

            existingLabel.Name = label.Name;
            existingLabel.Color = label.Color;
            // ProjectId and CreatedBy usually shouldn't change

            await _context.SaveChangesAsync();

            await _hubContext.Clients.All.SendAsync("LabelUpdated", existingLabel);

            return Ok(existingLabel);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLabel(int id)
        {
            var label = await _context.Labels.FindAsync(id);
            if (label == null)
                return NotFound();

            var userId = GetCurrentUserId();
            var isAdmin = User.IsInRole("admin");

            if (label.CreatedBy != userId && !isAdmin)
            {
                return StatusCode(403, new { message = "Bu etiketi sadece oluşturan kişi veya yönetici silebilir." });
            }

            // Remove associations from TaskLabels junction table
            var taskLabels = _context.TaskLabels.Where(tl => tl.LabelId == id);
            _context.TaskLabels.RemoveRange(taskLabels);

            _context.Labels.Remove(label);
            await _context.SaveChangesAsync();

            await _hubContext.Clients.All.SendAsync("LabelDeleted", id);

            return NoContent();
        }
    }
}
