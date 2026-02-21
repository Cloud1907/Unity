using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Unity.Core.Models;
using Unity.Infrastructure.Data;
using Unity.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;

namespace Unity.API.Controllers
{
    [Authorize]
    public class DepartmentsController : BaseController
    {
        private readonly IAuditService _auditService;

        public DepartmentsController(AppDbContext context, IAuditService auditService) : base(context)
        {
            _auditService = auditService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Department>>> GetDepartments()
        {
            var currentUser = await GetCurrentUserWithDeptsAsync();
            if (currentUser == null) return Unauthorized();

            // ADMIN: Return ALL departments for Admin Panel user mapping
            bool isAdmin = string.Equals(currentUser.Role, "admin", StringComparison.OrdinalIgnoreCase);

            if (isAdmin)
            {
                var allDepts = await _context.Departments
                    .AsNoTracking()
                    .Where(d => !d.IsDeleted) // !!!
                    .OrderBy(d => d.Name)
                    .ToListAsync();
                
                return allDepts;
            }

            // MEMBER: Return only workspaces where the user is a member
            return await _context.UserDepartments
                .AsNoTracking() // PERFORMANCE FIX: Read-only
                .Include(ud => ud.Department)
                .Where(ud => ud.UserId == currentUser.Id)
                .Select(ud => ud.Department)
                .Where(d => d != null && !d.IsDeleted)
                .ToListAsync();
        }

        [HttpGet("all")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<IEnumerable<Department>>> GetAllDepartments()
        {
            // Admin-only endpoint: Return ALL departments for Admin Panel user mapping
            return await _context.Departments
                .Where(d => !d.IsDeleted)
                .OrderBy(d => d.Name)
                .ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Department>> CreateDepartment(Unity.Core.DTOs.DepartmentCreateDto dto)
        {
            if (string.IsNullOrEmpty(dto.Name))
                return BadRequest("Çalışma alanı adı zorunludur.");
            
            // Create Department
            var department = new Department
            {
                Id = 0,
                Name = dto.Name,
                Description = dto.Description ?? string.Empty
            };
            
            // Set Creator
            int userId = GetCurrentUserId();
            department.CreatedBy = userId;

            // Set HeadOfDepartment as the creator if not specified
            if (userId > 0)
            {
                 var user = await _context.Users.FindAsync(userId);
                 if (user != null) department.HeadOfDepartment = user.FullName;
            }

            _context.Departments.Add(department);
            await _context.SaveChangesAsync();

            // Add members to the department
            var memberIds = dto.UserIds ?? new List<int>();
            
            // Ensure creator is in the list
            if (userId > 0 && !memberIds.Contains(userId))
            {
                memberIds.Add(userId);
            }

            // Add all members
            foreach (var memberId in memberIds)
            {
                var alreadyMember = await _context.UserDepartments.AnyAsync(ud => ud.UserId == memberId && ud.DepartmentId == department.Id);
                if (!alreadyMember)
                {
                    _context.UserDepartments.Add(new UserDepartment { UserId = memberId, DepartmentId = department.Id });
                }
            }
            await _context.SaveChangesAsync();

            // Create initial project if requested
            if (dto.InitialProject != null && !string.IsNullOrEmpty(dto.InitialProject.Name))
            {
                var project = new Project
                {
                    Name = dto.InitialProject.Name,
                    Icon = dto.InitialProject.Icon,
                    Color = dto.InitialProject.Color,
                    IsPrivate = dto.InitialProject.IsPrivate,
                    DepartmentId = department.Id,
                    Owner = userId,
                    Status = "in_progress"
                };

                _context.Projects.Add(project);
                await _context.SaveChangesAsync();

                // Add project members (same as workspace members by default)
                var projectMemberIds = dto.InitialProject.MemberIds ?? memberIds;
                foreach (var memberId in projectMemberIds)
                {
                    _context.ProjectMembers.Add(new ProjectMember 
                    { 
                        ProjectId = project.Id, 
                        UserId = memberId 
                    });
                }
                await _context.SaveChangesAsync();

                await _auditService.LogAsync(userId.ToString(), "CREATE", "Project", project.Id.ToString(), null, project, $"'{project.Name}' projesi '{department.Name}' çalışma alanında oluşturuldu.");
            }
                 
            await _auditService.LogAsync(userId.ToString(), "CREATE", "Department", department.Id.ToString(), null, department, $"'{department.Name}' çalışma alanı oluşturuldu.");

            return CreatedAtAction(nameof(GetDepartments), new { id = department.Id }, department);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDepartment(int id, Department department)
        {
            if (id != department.Id) return BadRequest("ID uyuşmazlığı.");

            var existingDept = await _context.Departments.FindAsync(id);
            if (existingDept == null) return NotFound("Çalışma alanı bulunamadı.");

            var currentUser = await GetCurrentUserWithDeptsAsync();
            if (currentUser == null) return Unauthorized();

            // Permission Check: Admin OR Creator
            bool isCreator = existingDept.CreatedBy == currentUser.Id;

            if (currentUser.Role != "admin" && !isCreator)
            {
                return StatusCode(403, new { message = "Bu çalışma alanını güncelleme yetkiniz yok. Sadece çalışma alanını oluşturan kişi veya yönetici güncelleyebilir." });
            }
            
            // MANUAL MERGE: Only update user-editable fields to prevent overwriting metadata (CreatedBy, Owner, CreatedAt)
            string oldName = existingDept.Name;
            existingDept.Name = department.Name;
            existingDept.Description = department.Description;
            // Note: CreatedBy, Owner, CreatedAt are intentionally NOT updated

            try
            {
                await _context.SaveChangesAsync();
                await _auditService.LogAsync(
                    currentUser.Id.ToString(), 
                    "UPDATE", 
                    "Department", 
                    id.ToString(), 
                    new { Name = oldName }, 
                    new { Name = existingDept.Name }, 
                    $"'{existingDept.Name}' çalışma alanı güncellendi."
                );
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

            var currentUser = await GetCurrentUserWithDeptsAsync();
            if (currentUser == null) return Unauthorized();

            // Permission Check
            if (currentUser.Role != "admin" && department.CreatedBy != currentUser.Id)
            {
                return StatusCode(403, new { message = "Bu çalışma alanını silme yetkiniz yok. Sadece oluşturan kişi veya yönetici silebilir." });
            }

            _context.Departments.Remove(department);
            await _context.SaveChangesAsync();

            await _auditService.LogAsync(currentUser.Id.ToString(), "DELETE", "Department", id.ToString(), department, null, $"'{department.Name}' çalışma alanı silindi.");

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

            var currentUser = await GetCurrentUserWithDeptsAsync();
            if (currentUser == null) return Unauthorized();

            // ROBUST CHECK: Query join table directly to avoid navigation tracking issues
            bool isMember = await _context.UserDepartments.AnyAsync(ud => ud.UserId == currentUser.Id && ud.DepartmentId == id);
            
            if (currentUser.Role != "admin" && !isMember)
            {
                 return StatusCode(403, new { message = "Bu çalışma alanına üye eklemek için önce bu alanın üyesi olmalısınız." });
            }

            bool targetAlreadyMember = await _context.UserDepartments.AnyAsync(ud => ud.UserId == targetUserId && ud.DepartmentId == id);
            if (targetAlreadyMember)
                return BadRequest("Kullanıcı zaten bu çalışma alanının üyesi.");

            _context.UserDepartments.Add(new UserDepartment { DepartmentId = id, UserId = targetUserId });
            
            await _context.SaveChangesAsync();

            await _auditService.LogAsync(currentUser.Id.ToString(), "ADD_MEMBER", "Department", id.ToString(), null, targetUserId, $"{targetUser.FullName}, '{department.Name}' çalışma alanına eklendi.");

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

            // Robust check: Query join table directly
            var membership = await _context.UserDepartments
                .FirstOrDefaultAsync(ud => ud.DepartmentId == id && ud.UserId == targetUserId);

            if (membership == null)
                return BadRequest(new { message = "Kullanıcı bu çalışma alanının üyesi değil." });

            int currentUserId = GetCurrentUserId();
            var currentUser = await _context.Users.FindAsync(currentUserId);

            // Permission Check: Admin OR Creator
            bool isAdmin = string.Equals(currentUser?.Role, "admin", StringComparison.OrdinalIgnoreCase);
            bool isCreator = department.CreatedBy == currentUserId;

            if (!isAdmin && !isCreator)
            {
                return StatusCode(403, new { 
                    message = "Bu kullanıcıyı çalışma alanından çıkarma yetkiniz yok. Sadece çalışma alanını oluşturan kişi veya yönetici üye çıkarabilir.",
                    title = "Yetkisiz İşlem"
                });
            }

            // Prevent removing the creator
            if (targetUserId == department.CreatedBy)
            {
                 if (!isAdmin)
                 {
                     return BadRequest(new { message = "Çalışma alanını oluşturan kişi çıkarılamaz." });
                 }
            }

            _context.UserDepartments.Remove(membership);
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
