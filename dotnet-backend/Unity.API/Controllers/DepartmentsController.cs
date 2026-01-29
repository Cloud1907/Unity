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
             // 2. Try JWT Claim
            var claimId = User.FindFirst("id")?.Value 
                          ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (int.TryParse(claimId, out int uid)) return uid;

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
                return BadRequest("Çalışma alanı adı zorunludur.");
            
            department.Id = 0;
            
            // Set Creator
            int userId = GetCurrentUserId();
            department.CreatedBy = userId;

            // Set HeadOfDepartment as the creator if not specified
            if (string.IsNullOrEmpty(department.HeadOfDepartment) && userId > 0)
            {
                 var user = await _context.Users.FindAsync(userId);
                 if (user != null) department.HeadOfDepartment = user.FullName;
            }

            _context.Departments.Add(department);
            await _context.SaveChangesAsync();

            // Auto-add creator to this department
            if (userId > 0)
            {
                 var user = await _context.Users.FindAsync(userId);
                 if (user != null && !user.Departments.Any(d => d.DepartmentId == department.Id))
                 {
                     var list = user.Departments;
                     list.Add(new UserDepartment { DepartmentId = department.Id });
                     user.Departments = list;
                     await _context.SaveChangesAsync();
                 }
                 
                 await _auditService.LogAsync(userId.ToString(), "CREATE", "Department", department.Id.ToString(), null, department, $"'{department.Name}' çalışma alanı oluşturuldu.");
            }

            return CreatedAtAction(nameof(GetDepartments), new { id = department.Id }, department);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDepartment(int id, Department department)
        {
            if (id != department.Id) return BadRequest("ID uyuşmazlığı.");

            var oldDept = await _context.Departments.AsNoTracking().FirstOrDefaultAsync(d => d.Id == id);
            if (oldDept == null) return NotFound("Çalışma alanı bulunamadı.");

            int currentUserId = GetCurrentUserId();
            var currentUser = await _context.Users.FindAsync(currentUserId);

            // Permission Check: Admin OR Creator
            // Note: If CreatedBy is 0 (legacy), afford access to HeadOfDepartment name match or Admin? 
            // Ideally strictly CreatedBy or Admin.
            bool isCreator = oldDept.CreatedBy == currentUserId;
            // Legacy fallback: if CreatedBy is 0, allow if HeadOfDepartment matches specific name? No, safer to rely on Admin fix if needed.

            if (currentUser?.Role != "admin" && !isCreator)
            {
                return StatusCode(403, new { message = "Bu çalışma alanını güncelleme yetkiniz yok. Sadece çalışma alanını oluşturan kişi veya yönetici güncelleyebilir." });
            }
            
            _context.Entry(department).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
                await _auditService.LogAsync(currentUserId.ToString(), "UPDATE", "Department", id.ToString(), oldDept, department, $"'{department.Name}' çalışma alanı güncellendi.");
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
            if (department == null) return NotFound("Çalışma alanı bulunamadı.");

            int currentUserId = GetCurrentUserId();
            var currentUser = await _context.Users.FindAsync(currentUserId);

            // Permission Check
            if (currentUser?.Role != "admin" && department.CreatedBy != currentUserId)
            {
                return StatusCode(403, new { message = "Bu çalışma alanını silme yetkiniz yok. Sadece oluşturan kişi veya yönetici silebilir." });
            }

            _context.Departments.Remove(department);
            await _context.SaveChangesAsync();

            await _auditService.LogAsync(currentUserId.ToString(), "DELETE", "Department", id.ToString(), department, null, $"'{department.Name}' çalışma alanı silindi.");

            return NoContent();
        }

        // POST: api/Departments/5/members
        [HttpPost("{id}/members")]
        public async Task<IActionResult> AddMember(int id, [FromBody] int targetUserId)
        {
            var department = await _context.Departments.FindAsync(id);
            if (department == null) return NotFound("Çalışma alanı bulunamadı.");

            var targetUser = await _context.Users.FindAsync(targetUserId);
            if (targetUser == null) return NotFound("Kullanıcı bulunamadı.");

            int currentUserId = GetCurrentUserId();
            var currentUser = await _context.Users.FindAsync(currentUserId);

            // Simplification: Any member can invite others? Or restrict to Admin/Creator?
            // User requested strict removal permissions. Usually invite is more open, but let's restrict to Members of that workspace at least.
            bool isMember = currentUser.Departments.Any(d => d.DepartmentId == id);
            if (currentUser.Role != "admin" && !isMember)
            {
                 return StatusCode(403, new { message = "Bu çalışma alanına üye eklemek için önce bu alanın üyesi olmalısınız." });
            }

            if (targetUser.Departments.Any(d => d.DepartmentId == id))
                return BadRequest("Kullanıcı zaten bu çalışma alanının üyesi.");

            var depts = targetUser.Departments;
            depts.Add(new UserDepartment { DepartmentId = id });
            targetUser.Departments = depts;
            
            await _context.SaveChangesAsync();

            await _auditService.LogAsync(currentUserId.ToString(), "ADD_MEMBER", "Department", id.ToString(), null, targetUserId, $"{targetUser.FullName}, '{department.Name}' çalışma alanına eklendi.");

            return Ok(new { message = "Kullanıcı başarıyla eklendi." });
        }

        // DELETE: api/Departments/5/members/123
        [HttpDelete("{id}/members/{targetUserId}")]
        public async Task<IActionResult> RemoveMember(int id, int targetUserId)
        {
            var department = await _context.Departments.FindAsync(id);
            if (department == null) return NotFound(new { message = "Çalışma alanı bulunamadı." });

            var targetUser = await _context.Users.FindAsync(targetUserId);
            if (targetUser == null) return NotFound(new { message = "Kullanıcı bulunamadı." });

            if (!targetUser.Departments.Any(d => d.DepartmentId == id))
                return BadRequest(new { message = "Kullanıcı bu çalışma alanının üyesi değil." });

            int currentUserId = GetCurrentUserId();
            var currentUser = await _context.Users.FindAsync(currentUserId);

            // Permission Check: Admin OR Creator OR Self-Leave?
            bool isAdmin = currentUser?.Role == "admin";
            bool isCreator = department.CreatedBy == currentUserId;
            // bool isSelf = currentUserId == targetUserId; // Allow user to leave themselves? (Optional, usually yes)

            if (!isAdmin && !isCreator) // && !isSelf
            {
                return StatusCode(403, new { 
                    message = "Bu kullanıcıyı çalışma alanından çıkarma yetkiniz yok. Sadece çalışma alanını oluşturan kişi veya yönetici üye çıkarabilir.",
                    title = "Yetkisiz İşlem"
                });
            }

            // Prevent removing the creator?
            if (targetUserId == department.CreatedBy)
            {
                 // Allow only if Admin is doing it? Or block entirely?
                 // Let's warn effectively
                 if (!isAdmin)
                 {
                     return BadRequest(new { message = "Çalışma alanını oluşturan kişi çıkarılamaz." });
                 }
            }

            var depts = targetUser.Departments;
            var toRemove = depts.FirstOrDefault(d => d.DepartmentId == id);
            if (toRemove != null) depts.Remove(toRemove);
            targetUser.Departments = depts;

            await _context.SaveChangesAsync();

            await _auditService.LogAsync(currentUserId.ToString(), "REMOVE_MEMBER", "Department", id.ToString(), targetUserId, null, $"{targetUser.FullName}, '{department.Name}' çalışma alanından çıkarıldı.");

            return Ok(new { message = "Kullanıcı başarıyla çıkarıldı." });
        }

        private bool DepartmentExists(int id)
        {
            return _context.Departments.Any(e => e.Id == id);
        }
    }
}
