using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Unity.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;

        public UploadController(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        [HttpPost("avatar")]
        [Authorize]
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Lütfen bir dosya seçin." });

            // Validate file type (simple check)
            if (!file.ContentType.StartsWith("image/"))
                return BadRequest(new { message = "Sadece resim dosyaları yüklenebilir." });

            // Validate file size (e.g. 5MB)
            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "Dosya boyutu 5MB'dan büyük olamaz." });

            try
            {
                // Create unique filename
                var extension = Path.GetExtension(file.FileName).ToLower();
                var uniqueFileName = $"{Guid.NewGuid()}{extension}";

                // Define path: wwwroot/uploads/avatars
                var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "avatars");

                // Ensure directory exists
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Return relative URL
                var relativeUrl = $"/uploads/avatars/{uniqueFileName}";
                return Ok(new { url = relativeUrl });
            }
            catch (Exception ex)
            {
                // Log error if needed
                return StatusCode(500, new { message = $"Dosya yüklenirken hata oluştu: {ex.Message}" });
            }
        }
    }
}
