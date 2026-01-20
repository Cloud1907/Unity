using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unity.Core.Models;
using Unity.Infrastructure.Data;
using Unity.Infrastructure.Services;
using System.Security.Claims;

namespace Unity.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public class DepartmentsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IAuditService _auditService;

        public DepartmentsController(AppDbContext context, IAuditService auditService)
        {
            _context = context;
            _auditService = auditService;
        }

        // Helper: Get Current User ID
        private int GetCurrentUserId()
        {
             // 1. Try JWT Claim
            var claimId = User.FindFirst("id")?.Value 
                          ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (int.TryParse(claimId, out int uid)) return uid;

            // 2. Try Header (Dev/Test)
            if (Request.Headers.TryGetValue("X-Test-User-Id", out var headerId) && int.TryParse(headerId, out int hid))
                return hid;

            return 0;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Department>>> GetDepartments()
        {
            return await _context.Departments.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Department>> CreateDepartment(Department department)
        {
            if (string.IsNullOrEmpty(department.Name))
                return BadRequest("Workspace Name is required");
            
            department.Id = 0;
            
            // Set HeadOfDepartment as the creator if not specified
            int userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(department.HeadOfDepartment) && userId > 0)
            {
                 var user = await _context.Users.FindAsync(userId);
                 if (user != null) department.HeadOfDepartment = user.FullName;
            }

            _context.Departments.Add(department);
            await _context.SaveChangesAsync();

            // Auto-add creator to this department if we can verify them
            if (userId > 0)
            {
                 var user = await _context.Users.FindAsync(userId);
                 if (user != null && !user.Departments.Contains(department.Id))
                 {
                     var list = user.Departments;
                     list.Add(department.Id);
                     user.Departments = list;
                     await _context.SaveChangesAsync();
                 }
                 
                 await _auditService.LogAsync(userId.ToString(), "CREATE", "Department", department.Id.ToString(), null, department, $"Created workspace '{department.Name}'");
            }

            return CreatedAtAction(nameof(GetDepartments), new { id = department.Id }, department);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDepartment(int id, Department department)
        {
            if (id != department.Id) return BadRequest();

            var oldDept = await _context.Departments.AsNoTracking().FirstOrDefaultAsync(d => d.Id == id);
            
            _context.Entry(department).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
                int userId = GetCurrentUserId();
                await _auditService.LogAsync(userId.ToString(), "UPDATE", "Department", id.ToString(), oldDept, department, $"Updated workspace '{department.Name}'");
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!DepartmentExists(id)) return NotFound();
                else throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDepartment(int id)
        {
            var department = await _context.Departments.FindAsync(id);
            if (department == null) return NotFound();

            _context.Departments.Remove(department);
            await _context.SaveChangesAsync();

            int userId = GetCurrentUserId();
            await _auditService.LogAsync(userId.ToString(), "DELETE", "Department", id.ToString(), department, null, $"Deleted workspace '{department.Name}'");

            return NoContent();
        }

        // POST: api/Departments/5/members
        [HttpPost("{id}/members")]
        public async Task<IActionResult> AddMember(int id, [FromBody] int targetUserId)
        {
            var department = await _context.Departments.FindAsync(id);
            if (department == null) return NotFound("Workspace not found");

            var targetUser = await _context.Users.FindAsync(targetUserId);
            if (targetUser == null) return NotFound("User not found");

            // Check Permission: Current user must be a member of this department or Admin
            // For simplicity, we assume if you can see it, you can invite (Open Workspace model)
            // Or strictly: GetCurrentUserId() must be in department.
            
            if (targetUser.Departments.Contains(id))
                return BadRequest("User is already a member");

            var depts = targetUser.Departments;
            depts.Add(id);
            targetUser.Departments = depts;
            
            await _context.SaveChangesAsync();

            int actorId = GetCurrentUserId();
            await _auditService.LogAsync(actorId.ToString(), "ADD_MEMBER", "Department", id.ToString(), null, targetUserId, $"Added {targetUser.FullName} to workspace '{department.Name}'");

            return Ok(new { message = "Member added successfully" });
        }

        // DELETE: api/Departments/5/members/123
        [HttpDelete("{id}/members/{targetUserId}")]
        public async Task<IActionResult> RemoveMember(int id, int targetUserId)
        {
            var department = await _context.Departments.FindAsync(id);
            if (department == null) return NotFound("Workspace not found");

            var targetUser = await _context.Users.FindAsync(targetUserId);
            if (targetUser == null) return NotFound("User not found");

            if (!targetUser.Departments.Contains(id))
                return BadRequest("User is not a member of this workspace");

            var depts = targetUser.Departments;
            depts.Remove(id);
            targetUser.Departments = depts;

            await _context.SaveChangesAsync();

            int actorId = GetCurrentUserId();
            await _auditService.LogAsync(actorId.ToString(), "REMOVE_MEMBER", "Department", id.ToString(), targetUserId, null, $"Removed {targetUser.FullName} from workspace '{department.Name}'");

            return Ok(new { message = "Member removed successfully" });
        }

        private bool DepartmentExists(int id)
        {
            return _context.Departments.Any(e => e.Id == id);
        }
    }
}
