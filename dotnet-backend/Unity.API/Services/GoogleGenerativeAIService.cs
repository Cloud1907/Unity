using System;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Mscc.GenerativeAI;
using Unity.Core.DTOs;

namespace Unity.API.Services
{
    public class GoogleGenerativeAIService : IGenerativeAIService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<GoogleGenerativeAIService> _logger;

        public GoogleGenerativeAIService(IConfiguration configuration, ILogger<GoogleGenerativeAIService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<string> GenerateWeeklyInsightAsync(UserWeeklyMetricsDto metrics)
        {
            var apiKey = _configuration["GenerativeAI:ApiKey"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");
            
            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogWarning("Gemini API Key is missing. Returning fallback text.");
                return BuildFallbackText(metrics);
            }

            try
            {
                var prompt = BuildPrompt(metrics);

                // Use direct REST call to v1 endpoint (Mscc library hardcodes v1beta which has exhausted quota)
                using var http = new System.Net.Http.HttpClient();
                var url = $"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={apiKey}";
                
                var requestBody = System.Text.Json.JsonSerializer.Serialize(new
                {
                    contents = new[] { new { parts = new[] { new { text = prompt } } } }
                });

                var httpResponse = await http.PostAsync(url, new System.Net.Http.StringContent(requestBody, System.Text.Encoding.UTF8, "application/json"));
                var responseBody = await httpResponse.Content.ReadAsStringAsync();

                if (!httpResponse.IsSuccessStatusCode)
                {
                    _logger.LogError("Gemini API returned {StatusCode}: {Body}", httpResponse.StatusCode, responseBody);
                    return BuildFallbackText(metrics);
                }

                // Parse the response text
                using var doc = System.Text.Json.JsonDocument.Parse(responseBody);
                var text = doc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString() ?? "";

                return FormatAsHtml(text);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating AI insight with Gemini.");
                return BuildFallbackText(metrics);
            }

        }

        private string BuildPrompt(UserWeeklyMetricsDto metrics)
        {
            var sb = new StringBuilder();
            sb.AppendLine("Sen UniTask platformunun kıdemli proje asistanısın. Aşağıdaki haftalık performans verilerine dayanarak kullanıcıya samimi, kısa ve motive edici bir HTML özet yaz.");
            sb.AppendLine("KURALLARI KESINLIKLE UYGULA:");
            sb.AppendLine("1. Kullanıcıya ISMIYLE hitap et.");
            sb.AppendLine("2. Görevlerden bahsederken durumuna göre PROJE ADINI, kimin oluşturduğunu (olusturan), öncelik durumunu (oncelik) ve diğer çalışanları (diger_calisanlar) kullanarak tavsiyeler ver. Örneğin 'Kritik öncelikli', 'Ahmet ile birlikte yürüttüğünüz', 'Kemal Bey tarafından atanan' gibi.");
            sb.AppendLine("3. Sadece HTML dön. <p>, <ul>, <li>, <strong> kullanabilirsin. Asla ```html blokları yazma.");
            sb.AppendLine("4. Maksimum 180 kelime. Robotik olma. Vizyoner ve profesyonel bir koç/yönetici gibi yorum yap.");
            sb.AppendLine();
            sb.AppendLine("KULLANICI VERİSİ (JSON):");
            
            var dataJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                isim = metrics.FullName,
                tamamlanan_gorev_sayisi = metrics.CompletedTasksCount,
                geciken_gorev_sayisi = metrics.OverdueTasksCount,
                yaklasan_gorev_sayisi = metrics.UpcomingTasksCount,
                tamamlananlar = metrics.CompletedTasks.Select(t => new { gorev = t.Title, proje = t.ProjectName, oncelik = t.Priority, olusturan = t.CreatorName, diger_calisanlar = t.OtherAssigneeNames }).ToList(),
                gecikenler = metrics.OverdueTasks.Select(t => new { gorev = t.Title, proje = t.ProjectName, bitis = t.DueDate?.ToString("dd MMM yyyy"), oncelik = t.Priority, olusturan = t.CreatorName, diger_calisanlar = t.OtherAssigneeNames }).ToList(),
                yaklaşanlar = metrics.UpcomingTasks.Select(t => new { gorev = t.Title, proje = t.ProjectName, bitis = t.DueDate?.ToString("dd MMM yyyy"), oncelik = t.Priority, olusturan = t.CreatorName, diger_calisanlar = t.OtherAssigneeNames }).ToList()
            }, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
            
            sb.AppendLine(dataJson);

            return sb.ToString();
        }

        private string FormatAsHtml(string rawText)
        {
            // Clean up any markdown formatting the AI might have accidentally included
            var text = rawText.Replace("```html", "").Replace("```", "").Trim();
            
            // If the AI didn't use HTML tags, at least convert newlines to <br>
            if (!text.Contains("<p>") && !text.Contains("<br"))
            {
                text = text.Replace("\n", "<br/>");
            }
            
            return text;
        }

        private string BuildFallbackText(UserWeeklyMetricsDto metrics)
        {
            return $"<strong>Merhaba {metrics.FullName.Split(' ')[0]},</strong><br/><br/>" +
                   $"Bu hafta {metrics.CompletedTasksCount} görevi başarıyla tamamladın! " +
                   (metrics.OverdueTasksCount > 0 ? $"Geciken {metrics.OverdueTasksCount} görevine önümüzdeki hafta öncelik vermen iyi olabilir." : "Harika ilerliyorsun, hiç geciken görevin yok.");
        }
    }
}
