using Microsoft.AspNetCore.Mvc;
using Unity.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Unity.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public class InfoController : ControllerBase
    {
        private readonly AppDbContext _context;

        public InfoController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetInfo()
        {
            var userCount = await _context.Users.CountAsync();
            var projectCount = await _context.Projects.CountAsync();
            
            // Check if Melih exists
            var melih = await _context.Users.FirstOrDefaultAsync(u => u.Email == "melih.bulut@unity.com");

            return Ok(new 
            { 
                Version = "v9-SECURE-PATCHED", 
                Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
                Database = "Connected",
                UserCount = userCount,
                ProjectCount = projectCount,
                MelihExists = melih != null,
                MelihHash = melih?.PasswordHash?.Substring(0, 10) + "..." // Partial hash for verification
            });
        }
        
        [HttpGet("test-hash")]
        public IActionResult TestHash([FromQuery] string password)
        {
             return Ok(new { Input = password, Hash = BCrypt.Net.BCrypt.HashPassword(password) });
        }
    }
}
