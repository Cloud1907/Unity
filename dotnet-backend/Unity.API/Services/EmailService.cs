using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Unity.Core.DTOs;

namespace Unity.API.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            var emailSettings = _configuration.GetSection("Email");
            
            var host = emailSettings["Host"];
            var username = emailSettings["Username"];
            var password = emailSettings["Password"];
            var port = int.Parse(emailSettings["Port"] ?? "587");
            var enableSsl = bool.Parse(emailSettings["EnableSsl"] ?? "true");

            using (var client = new SmtpClient(host, port))
            {
                client.Credentials = new NetworkCredential(username, password);
                client.EnableSsl = enableSsl;
                client.Timeout = 15000;

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(username!, "UniTask Bilgilendirme"),
                    Subject = subject,
                    IsBodyHtml = true,
                    SubjectEncoding = Encoding.UTF8,
                    BodyEncoding = Encoding.UTF8
                };

                AlternateView htmlView = AlternateView.CreateAlternateViewFromString(body, null, "text/html");

                // Embed logo as CID attachment (same approach as SmtpEmailService)
                try
                {
                    var logoPath = System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "wwwroot", "logo.png");
                    if (System.IO.File.Exists(logoPath))
                    {
                        LinkedResource logo = new LinkedResource(logoPath, "image/png");
                        logo.ContentId = "unitasklogo";
                        htmlView.LinkedResources.Add(logo);
                    }
                }
                catch { /* Best effort */ }

                mailMessage.AlternateViews.Add(htmlView);
                mailMessage.To.Add(to);

                await client.SendMailAsync(mailMessage);
            }
        }

        public async Task SendTaskAssignmentEmailAsync(string to, string userName, string? description, string assignerName, string workGroupName, string projectName, string taskTitle, string? subtaskTitle, string priority, DateTime? dueDate, int taskId, List<EmailSubtaskDto> subtasks)
        {
            var subject = subtaskTitle != null ? $"Yeni Görev: {taskTitle} / {subtaskTitle}" : $"Yeni Görev: {taskTitle}";
            var body = $"Merhaba {userName}, size {assignerName} tarafından '{taskTitle}' görevi atandı.";
            await SendEmailAsync(to, subject, body);
        }

        public async Task SendWeeklySummaryEmailAsync(string to, UserWeeklyMetricsDto metrics)
        {
            var subject = $"Haftalık Performans Özeti - {metrics.FullName}";
            var today = DateTime.Now;
            var lastWeek = today.AddDays(-7);
            var tr = new CultureInfo("tr-TR");
            var dateRange = $"{lastWeek.ToString("dd MMMM", tr)} – {today.ToString("dd MMMM yyyy", tr)}";
            var firstName = metrics.FullName?.Split(' ')[0] ?? "Kullanıcı";

            // --- Build task rows ---
            var completedRowsHtml = BuildTaskRows(metrics.CompletedTasks, "#10b981", "✅");
            var overdueRowsHtml = BuildTaskRows(metrics.OverdueTasks, "#ef4444", "🚨");
            var upcomingRowsHtml = BuildTaskRows(metrics.UpcomingTasks, "#f59e0b", "🕐");

            // --- Sections ---
            var taskDetailSections = new StringBuilder();

            if (metrics.CompletedTasks.Any())
            {
                taskDetailSections.Append(BuildTaskSection("Bu Hafta Tamamlananlar", completedRowsHtml, "#10b981", "#f0fdf4", "#bbf7d0"));
            }
            if (metrics.OverdueTasks.Any())
            {
                taskDetailSections.Append(BuildTaskSection("Geciken Görevler", overdueRowsHtml, "#ef4444", "#fff1f2", "#fecdd3"));
            }
            if (metrics.UpcomingTasks.Any())
            {
                taskDetailSections.Append(BuildTaskSection("Yaklaşan Görevler (7 Gün)", upcomingRowsHtml, "#f59e0b", "#fffbeb", "#fde68a"));
            }

            var aiSummaryHtml = metrics.AiGeneratedSummaryHtml ?? 
                $"<p>Merhaba <strong>{firstName}</strong>, haftalık performans özetiniz hazırlandı. Panoya giderek görevlerinizi takip edebilirsiniz.</p>";

            var body = $@"<!DOCTYPE html PUBLIC ""-//W3C//DTD XHTML 1.0 Transitional//EN"" ""http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"">
<html xmlns=""http://www.w3.org/1999/xhtml"">
<head>
  <meta http-equiv=""Content-Type"" content=""text/html; charset=UTF-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
  <title>Haftalık Performans Özeti</title>
  <!--[if !mso]><!-->
  <link href=""https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap"" rel=""stylesheet"">
  <!--<![endif]-->
  <style type=""text/css"">
    body, table, td, a {{ -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }}
    table, td {{ mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; }}
    img {{ -ms-interpolation-mode: bicubic; border: 0; height: auto; outline: none; text-decoration: none; }}
    body {{ margin: 0 !important; padding: 0 !important; background-color: #F0F2F5; }}
    @media screen and (max-width: 600px) {{
      .wrapper {{ width: 100% !important; max-width: 100% !important; }}
      .mobile-padding {{ padding: 20px 16px !important; }}
      .stat-td {{ display: block !important; width: 100% !important; padding: 8px 0 !important; }}
    }}
  </style>
</head>
<body style=""margin: 0; padding: 0; background-color: #F0F2F5;"">

  <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""background-color: #F0F2F5;"">
    <tr>
      <td align=""center"" style=""padding: 24px 12px 40px 12px;"">
        <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width: 620px;"" class=""wrapper"">

          <!-- ═══════════════════════════════ HEADER ═══════════════════════════════ -->
          <tr>
            <td align=""left"" bgcolor=""#25224D"" style=""background-color: #25224D; border-radius: 20px 20px 0 0; padding: 32px 40px;"">
              <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"">
                <tr>
                  <!-- LOGO ICON -->
                  <td valign=""middle"" width=""68"" style=""padding-right: 16px;"">
                    <img src=""cid:unitasklogo"" width=""56"" height=""56"" alt=""UniTask"" style=""display: block; width: 56px; height: 56px; border: 0;"" />
                  </td>
                  <!-- LOGO TEXT -->
                  <td valign=""middle"">
                    <p style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 30px; font-weight: 900; color: #ffffff; letter-spacing: -1.5px; line-height: 1; margin: 0;"">Uni<span style=""color: #9B7BFF;"">Task</span></p>
                    <div style=""height: 1px; background-color: rgba(255,255,255,0.15); margin: 8px 0;""></div>
                    <p style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 600; color: #a5b4fc; margin: 0; letter-spacing: 0.3px;"">Univera Task Management</p>
                  </td>
                </tr>
              </table>
              <!-- Hafta aralığı -->
              <p style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 13px; color: #c7d2fe; margin: 20px 0 4px 0; font-weight: 500;"">{dateRange}</p>
              <p style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 700; color: #ffffff; margin: 0; line-height: 1.3;"">Haftalık Performans Özeti</p>
            </td>
          </tr>

          <!-- ═══════════════════════════════ STATS BAR ═══════════════════════════════ -->
          <tr>
            <td bgcolor=""#1e1b44"" style=""background-color: #1e1b44; padding: 20px 40px;"">
              <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"">
                <tr>
                  <td align=""center"" class=""stat-td"" style=""padding: 12px 0;"">
                    <p style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 36px; font-weight: 900; color: #34d399; margin: 0; line-height: 1;"">{metrics.CompletedTasksCount}</p>
                    <p style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 600; color: #6ee7b7; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px;"">Tamamlanan</p>
                  </td>
                  <td width=""1"" style=""background-color: rgba(255,255,255,0.08);""><div style=""width:1px; height: 50px;""></div></td>
                  <td align=""center"" class=""stat-td"" style=""padding: 12px 0;"">
                    <p style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 36px; font-weight: 900; color: #fbbf24; margin: 0; line-height: 1;"">{metrics.UpcomingTasksCount}</p>
                    <p style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 600; color: #fde68a; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px;"">Yaklaşan (7 gün)</p>
                  </td>
                  <td width=""1"" style=""background-color: rgba(255,255,255,0.08);""><div style=""width:1px; height: 50px;""></div></td>
                  <td align=""center"" class=""stat-td"" style=""padding: 12px 0;"">
                    <p style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 36px; font-weight: 900; color: {(metrics.OverdueTasksCount > 0 ? "#f87171" : "#34d399")}; margin: 0; line-height: 1;"">{metrics.OverdueTasksCount}</p>
                    <p style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 600; color: {(metrics.OverdueTasksCount > 0 ? "#fca5a5" : "#6ee7b7")}; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px;"">Geciken</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══════════════════════════════ CONTENT AREA ═══════════════════════════════ -->
          <tr>
            <td bgcolor=""#ffffff"" style=""background-color: #ffffff; padding: 32px 40px;"" class=""mobile-padding"">

              <!-- Greeting -->
              <p style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 17px; font-weight: 600; color: #1e293b; margin: 0 0 24px 0;"">Merhaba {firstName}, 👋</p>

              <!-- AI Insight Block -->
              <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin-bottom: 32px;"">
                <tr>
                  <td style=""border-left: 4px solid #8b5cf6; background-color: #faf5ff; border-radius: 0 12px 12px 0; padding: 20px 24px;"">
                    <p style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 10px 0;"">✨ Yapay Zeka Değerlendirmesi</p>
                    <div style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.7; color: #4c1d95;"">
                      {aiSummaryHtml}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Task Detail Sections -->
              {taskDetailSections}

              <!-- CTA Button -->
              <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin-top: 36px;"">
                <tr>
                  <td align=""center"">
                    <table border=""0"" cellpadding=""0"" cellspacing=""0"">
                      <tr>
                        <td bgcolor=""#6366f1"" style=""border-radius: 12px; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);"">
                          <a href=""https://unity.univera.com.tr/dashboard"" target=""_blank"" style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 16px 40px; display: inline-block; border-radius: 12px;"">Panoya Git ve Görevleri Gör &rarr;</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ═══════════════════════════════ FOOTER ═══════════════════════════════ -->
          <tr>
            <td align=""center"" bgcolor=""#f8fafc"" style=""background-color: #f8fafc; border-radius: 0 0 20px 20px; padding: 24px 40px; border-top: 1px solid #e2e8f0;"">
              <p style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 12px; color: #94a3b8; margin: 0 0 4px 0;"">Bu otomatik bir bilgilendirme mesajıdır. Yanıtlamayınız.</p>
              <p style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 12px; color: #94a3b8; margin: 0;"">© {today.Year} Univera A.Ş. Tüm hakları saklıdır.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>";

            await SendEmailAsync(to, subject, body);
        }

        // ─── helpers ─────────────────────────────────────────────────────────────

        private static string BuildTaskRows(List<TaskSummaryDto> tasks, string accentColor, string icon)
        {
            if (!tasks.Any()) return "";
            var sb = new StringBuilder();
            foreach (var t in tasks)
            {
                var dueDateStr = t.DueDate.HasValue
                    ? t.DueDate.Value.ToString("dd MMM yyyy", new CultureInfo("tr-TR"))
                    : "";
                sb.Append($@"
                  <tr>
                    <td style=""padding: 10px 0; border-bottom: 1px solid #f1f5f9;"">
                      <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"">
                        <tr>
                          <td valign=""top"" width=""20"" style=""padding-right: 10px; padding-top: 2px;"">
                            <div style=""width: 8px; height: 8px; background-color: {accentColor}; border-radius: 50%; margin-top: 5px;""></div>
                          </td>
                          <td valign=""top"">
                            <p style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; color: #1e293b; margin: 0 0 2px 0;"">{System.Net.WebUtility.HtmlEncode(t.Title)}</p>
                            <p style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 12px; color: #64748b; margin: 0;"">
                              📁 <strong>{System.Net.WebUtility.HtmlEncode(t.ProjectName ?? "Genel")}</strong>
                              {(dueDateStr.Length > 0 ? $"&nbsp;&nbsp;📅 {dueDateStr}" : "")}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>");
            }
            return sb.ToString();
        }

        private static string BuildTaskSection(string title, string rowsHtml, string borderColor, string bgColor, string headerBgColor)
        {
            return $@"
              <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin-bottom: 24px; border-radius: 12px; overflow: hidden; border: 1px solid {headerBgColor};"">
                <tr>
                  <td bgcolor=""{headerBgColor}"" style=""background-color: {headerBgColor}; padding: 10px 16px; border-bottom: 1px solid {headerBgColor};"">
                    <p style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 700; color: {borderColor}; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;"">{title}</p>
                  </td>
                </tr>
                <tr>
                  <td bgcolor=""{bgColor}"" style=""background-color: {bgColor}; padding: 4px 16px;"">
                    <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"">
                      {rowsHtml}
                    </table>
                  </td>
                </tr>
              </table>";
        }
    }
}
