using Microsoft.AspNetCore.Mvc;
using Unity.Core.DTOs;
using Unity.Core.Interfaces;
using Unity.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using Unity.API.Hubs;
using Unity.Core.Models;
using Unity.Core.Helpers;

namespace Unity.API.Controllers
{
    /// <summary>
    /// Gmail Add-on entegrasyonu için public endpoint'ler.
    /// JWT yerine X-Gmail-Api-Key header ile kimlik doğrulama yapılır.
    /// </summary>
    [Route("api/gmail")]
    [ApiController]
    public class GmailController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITaskService _taskService;
        private readonly IHubContext<AppHub> _hubContext;
        private readonly IConfiguration _configuration;
        private readonly IServiceScopeFactory _scopeFactory;

        public GmailController(
            AppDbContext context,
            ITaskService taskService,
            IHubContext<AppHub> hubContext,
            IConfiguration configuration,
            IServiceScopeFactory scopeFactory)
        {
            _context = context;
            _taskService = taskService;
            _hubContext = hubContext;
            _configuration = configuration;
            _scopeFactory = scopeFactory;
        }

        // -------------------------------------------------------
        // AUTH MIDDLEWARE (inline — basit API Key kontrolü)
        // -------------------------------------------------------
        private bool IsAuthorized()
        {
            var expectedKey = _configuration["GmailIntegration:ApiKey"];
            var providedKey = Request.Headers["X-Gmail-Api-Key"].FirstOrDefault();
            return !string.IsNullOrEmpty(expectedKey) && expectedKey == providedKey;
        }

        // -------------------------------------------------------
        // GET /api/gmail/projects?email=user@company.com
        // Gmail Add-on'un proje listesi için çağırdığı endpoint
        // Çalışma grupları kişinin sidebar sıralamasına göre gelir
        // -------------------------------------------------------
        [HttpGet("projects")]
        public async Task<IActionResult> GetProjectsForGmail([FromQuery] string email)
        {
            if (!IsAuthorized()) return Unauthorized(new { message = "Geçersiz API Key." });

            var user = await _context.Users
                .Include(u => u.Departments)
                .FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return NotFound(new { message = "Kullanıcı bulunamadı." });

            var userDeptIds = user.Departments.Select(d => d.DepartmentId).ToList();

            // Kullanıcının üye olduğu projelerin ID'leri
            var memberProjectIds = await _context.ProjectMembers
                .AsNoTracking()
                .Where(pm => pm.UserId == user.Id)
                .Select(pm => pm.ProjectId)
                .ToListAsync();

            // Tüm projeler (Sidebar mantığı: Owner OR Member OR Public+Department)
            var allProjects = await _context.Projects
                .AsNoTracking()
                .Where(p => !p.IsDeleted)
                .Select(p => new { p.Id, p.Name, p.DepartmentId, p.Owner, p.IsPrivate })
                .ToListAsync();

            var visibleProjects = allProjects.Where(p =>
                p.Owner == user.Id ||
                memberProjectIds.Contains(p.Id) ||
                (!p.IsPrivate && userDeptIds.Contains(p.DepartmentId))
            ).ToList();

            // Kullanıcının workspace sıralama tercihleri
            var prefs = await _context.UserWorkspacePreferences
                .AsNoTracking()
                .Where(wp => wp.UserId == user.Id)
                .ToListAsync();

            // Departman bilgileri
            var departments = await _context.Departments
                .AsNoTracking()
                .Where(d => !d.IsDeleted && userDeptIds.Contains(d.Id))
                .ToListAsync();

            // Departmanları kullanıcının sortOrder'ına göre sırala
            var sortedDepts = departments
                .Select(d => {
                    var pref = prefs.FirstOrDefault(p => p.DepartmentId == d.Id);
                    return new {
                        d.Id,
                        d.Name,
                        SortOrder = pref?.SortOrder ?? 999,
                        IsVisible = pref?.IsVisible ?? true
                    };
                })
                .Where(d => d.IsVisible)
                .OrderBy(d => d.SortOrder)
                .ThenBy(d => d.Name)
                .ToList();

            // Gruplu response
            var result = sortedDepts.Select(dept => new {
                departmentId = dept.Id,
                departmentName = dept.Name,
                sortOrder = dept.SortOrder,
                projects = visibleProjects
                    .Where(p => p.DepartmentId == dept.Id)
                    .OrderBy(p => p.Name)
                    .Select(p => new { p.Id, p.Name })
                    .ToList()
            }).ToList();

            return Ok(result);
        }

        // -------------------------------------------------------
        // GET /api/gmail/users?email=user@company.com&departmentId=1
        // Atanacak kişi listesi (departmana göre filtrelenir)
        // -------------------------------------------------------
        [HttpGet("users")]
        public async Task<IActionResult> GetUsersForGmail([FromQuery] string email, [FromQuery] int? departmentId = null)
        {
            if (!IsAuthorized()) return Unauthorized(new { message = "Geçersiz API Key." });

            IQueryable<User> query = _context.Users
                .Where(u => u.IsActive && !u.IsDeleted);

            // Departmana göre filtrele
            if (departmentId.HasValue && departmentId.Value > 0)
            {
                var deptUserIds = await _context.Set<UserDepartment>()
                    .Where(ud => ud.DepartmentId == departmentId.Value)
                    .Select(ud => ud.UserId)
                    .ToListAsync();

                query = query.Where(u => deptUserIds.Contains(u.Id));
            }

            var users = await query
                .OrderBy(u => u.FullName)
                .Select(u => new
                {
                    u.Id,
                    u.Email,
                    fullName = u.FullName ?? "İsimsiz"
                })
                .ToListAsync();

            return Ok(users);
        }

        // -------------------------------------------------------
        // POST /api/gmail/ingest
        // Gmail Add-on'dan gelen görev verisi
        // -------------------------------------------------------
        [HttpPost("ingest")]
        public async Task<IActionResult> IngestGmailTask([FromBody] GmailTaskIngestDto dto)
        {
            if (!IsAuthorized()) return Unauthorized(new { message = "Geçersiz API Key." });

            // Assignee + Creator kullanıcısını maile göre bul
            // Use ToLower() for case-insensitive comparison to avoid misses
            var assignee = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.AssigneeInfo.ToLower());
            if (assignee == null) return BadRequest(new { message = "Atanacak kullanıcı bulunamadı." });

            // Sisteme görev oluşturan kişi (örn: servis hesabı veya sabit bir admin ID)
            int creatorId = assignee.Id; // veya sabit bir sistem kullanıcı ID'si

            var createDto = new TaskCreateDto
            {
                Title       = dto.TaskTitle,
                ProjectId   = dto.ProjectCode,
                AssigneeIds = new List<int> { assignee.Id },
                TaskUrl     = dto.GmailDeepLink,   // ← TaskItem.TaskUrl alanına kaydedilir
                Description = !string.IsNullOrWhiteSpace(dto.Description)
                    ? dto.Description
                    : $"📧 Gmail'den oluşturuldu."
            };

            var taskDto = await _taskService.CreateTaskAsync(createDto, creatorId);

            // SignalR ile Unity'e anlık bildirim
            await _hubContext.Clients.All.SendAsync("TaskCreated", taskDto);

            // Trigger Email Notification (Fire and Forget)
            _ = SendAssignmentEmailAsync(taskDto.Id, assignee.Id, creatorId);

            return Ok(new
            {
                taskId  = taskDto.Id,
                message = "Görev başarıyla oluşturuldu.",
                task    = taskDto
            });
        }

        private async Task SendAssignmentEmailAsync(int taskId, int assigneeId, int currentUserId)
        {
            try
            {
                using (var scope = _scopeFactory.CreateScope())
                {
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var emailSvc = scope.ServiceProvider.GetRequiredService<Unity.Infrastructure.Services.IEmailService>();

                    var task = await db.Tasks
                        .Include(t => t.Project)
                        .Include(t => t.Subtasks).ThenInclude(s => s.Assignees)
                        .FirstOrDefaultAsync(t => t.Id == taskId);

                    if (task == null) return;

                    var assigner = await db.Users.FindAsync(currentUserId);
                    var assignerName = assigner?.FullName ?? "Sistem (Gmail)";

                    var project = task.Project;
                    var department = project != null ? await db.Departments.FindAsync(project.DepartmentId) : null;
                    var workGroup = department?.Name ?? (project?.Name ?? "Genel Çalışma Grubu");

                    var user = await db.Users.FindAsync(assigneeId);

                    if (user != null && !string.IsNullOrEmpty(user.Email))
                    {
                        var emailSubtasks = task.Subtasks.Select(s => new EmailSubtaskDto
                        {
                            Title = s.Title,
                            IsCompleted = s.IsCompleted
                        }).ToList();

                        await emailSvc.SendTaskAssignmentEmailAsync(
                            user.Email,
                            user.FullName,
                            task.Description,
                            assignerName,
                            workGroup,
                            project?.Name ?? "Projesiz",
                            task.Title,
                            null,
                            task.Priority,
                            task.DueDate,
                            task.ProjectId,
                            task.Id,
                            emailSubtasks
                        );
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailError] Failed to send assignment email from Gmail add-on: {ex.Message}");
            }
        }
    }
}
