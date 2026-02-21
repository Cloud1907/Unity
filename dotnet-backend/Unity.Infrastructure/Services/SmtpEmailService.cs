using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Unity.Core.DTOs;
using Microsoft.Extensions.DependencyInjection;
using Unity.Infrastructure.Data;
using Unity.Core.Models;
using Unity.Core.Helpers;
using Microsoft.EntityFrameworkCore;

namespace Unity.Infrastructure.Services
{
    public class SmtpEmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly string _host;
        private readonly int _port;
        private readonly string _username;
        private readonly string _password;
        private readonly bool _enableSsl;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly string _frontendUrl;

        public SmtpEmailService(IConfiguration configuration, IServiceScopeFactory scopeFactory)
        {
            _configuration = configuration;
            _scopeFactory = scopeFactory;
            var emailSettings = _configuration.GetSection("Email");
            _host = emailSettings["Host"];
            _port = int.Parse(emailSettings["Port"]);
            _username = emailSettings["Username"];
            _password = emailSettings["Password"];
            _enableSsl = bool.Parse(emailSettings["EnableSsl"]);
            
            // Default to localhost if not set
            _frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";
        }

        private void LogDebug(string message)
        {
            try
            {
                var logPath = "/tmp/email_debug.log";
                var logMessage = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {message}{Environment.NewLine}";
                System.IO.File.AppendAllText(logPath, logMessage);
            }
            catch { /* Best effort logging */ }
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            try
            {
                LogDebug($"Attempting to send email to {to} with subject '{subject}'...");
                
                // Write heartbeat to wwwroot for production monitoring
                try {
                    var statusPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "email_status.txt");
                    System.IO.File.WriteAllText(statusPath, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] LAST ATTEMPT TO: {to}");
                } catch { }

                using (var client = new SmtpClient(_host, _port))
                {
                    client.Credentials = new NetworkCredential(_username, _password);
                    client.EnableSsl = _enableSsl;
                    client.Timeout = 15000; // 15 seconds timeout to prevent hanging

                    var mailMessage = new MailMessage
                    {
                        From = new MailAddress(_username, "UniTask Management"),
                        Subject = subject,
                        IsBodyHtml = true,
                    };

                    AlternateView htmlView = AlternateView.CreateAlternateViewFromString(body, null, "text/html");
                    
                    try {
                        var logoPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "logo.png");
                        if (System.IO.File.Exists(logoPath))
                        {
                            LinkedResource logo = new LinkedResource(logoPath, "image/png");
                            logo.ContentId = "unitasklogo";
                            htmlView.LinkedResources.Add(logo);
                        }
                    } catch { }

                    mailMessage.AlternateViews.Add(htmlView);
                    mailMessage.To.Add(to);
                    
                    // Update heartbeat before actual send
                    try {
                        var statusPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "email_status.txt");
                        System.IO.File.WriteAllText(statusPath, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] CONNECTING TO SMTP ({_host}:{_port})...");
                    } catch { }

                    await client.SendMailAsync(mailMessage);
                    LogDebug($"Email sent successfully to {to}.");

                    // Update heartbeat on success
                    try {
                        var statusPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "email_status.txt");
                        System.IO.File.WriteAllText(statusPath, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] SUCCESS SENT TO: {to}");
                    } catch { }
                }
            }
            catch (Exception ex)
            {
                LogDebug($"ERROR sending email to {to}: {ex.Message}");
                // Update heartbeat on error
                try {
                    var statusPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "email_status.txt");
                    System.IO.File.WriteAllText(statusPath, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] FAILED TO: {to} | Error: {ex.Message}");
                } catch { }
                throw;
            }
        }

        public async Task SendTaskAssignmentEmailAsync(string to, string assigneeName, string? description, string assignerName, string workGroupName, string projectTitle, string taskTitle, string? subtaskTitle, string priority, DateTime? dueDate, int projectId, int taskId, List<EmailSubtaskDto> subtasks)
        {
            var subject = subtaskTitle != null 
                ? $"Yeni Görev Atandı: {taskTitle} / {subtaskTitle}" 
                : $"Yeni Görev Atandı: {taskTitle}";
 
            // Generate Magic Link
            string magicLinkUrl = $"{_frontendUrl}/board/{projectId}?task={taskId}"; // Correct deep link
            
            try 
            {
                using (var scope = _scopeFactory.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var user = await context.Users.FirstOrDefaultAsync(u => u.Email == to);
 
                    if (user != null)
                    {
                        var token = Guid.NewGuid().ToString("N");
                        var magicLink = new MagicLink
                        {
                            Token = token,
                            UserId = user.Id,
                            TargetUrl = $"/board/{projectId}?task={taskId}",
                            ExpiresAt = TimeHelper.Now.AddDays(7),
                            CreatedAt = TimeHelper.Now,
                            IsUsed = false
                        };
 
                        context.MagicLinks.Add(magicLink);
                        await context.SaveChangesAsync();
 
                        // Use the frontend magic-login route
                        magicLinkUrl = $"{_frontendUrl}/magic-login?token={token}";
                        LogDebug($"Generated Magic Link for {to}: {magicLinkUrl}");
                    }
                }
            }
            catch (Exception ex)
            {
                LogDebug($"Error generating magic link for {to}: {ex.Message}");
            }

            var dueDateString = dueDate.HasValue ? dueDate.Value.ToString("dd MMM yyyy") : "Belirtilmedi";
            var priorityText = priority?.ToUpper() ?? "NORMAL";
            var subtasksCount = subtasks?.Count ?? 0;
            
             // Calculate progress based on subtasks completion
            var progress = 0;
            if (subtasks != null && subtasks.Any())
            {
                var completedCount = subtasks.Count(s => s.IsCompleted);
                progress = (int)((double)completedCount / subtasks.Count * 100);
            }

            // Generate Subtasks HTML
            var subtasksHtml = "";
            if (subtasks != null && subtasks.Any())
            {
                foreach (var sub in subtasks)
                {
                    // Status style mapping
                    var dotColor = sub.IsCompleted ? "#cbd5e1" : "#6366f1";
                    var titleStyle = sub.IsCompleted 
                        ? "font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 13px; color: #94a3b8; text-decoration: line-through;" 
                        : "font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 13px; color: #475569; font-weight: 500;";

                    subtasksHtml += $@"
                      <tr>
                        <td width=""24"" valign=""middle"" align=""center"" style=""padding-bottom: 8px;"">
                          <div style=""width: 6px; height: 6px; border: 2px solid {dotColor}; border-radius: 50%;""></div>
                        </td>
                        <td valign=""middle"" style=""padding-left: 10px; padding-bottom: 8px;"">
                          <span style=""{titleStyle}"">{sub.Title}</span>
                        </td>
                      </tr>";
                }
            }
            else
            {
                 subtasksHtml = @"
                      <tr>
                        <td style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 12px; color: #94a3b8; font-style: italic; padding-bottom: 8px;"">Alt görev bulunmuyor.</td>
                      </tr>";
            }

            // Generate Description HTML
            var descriptionHtml = "";
            if (!string.IsNullOrEmpty(description))
            {
                descriptionHtml = $@"
                  <div style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; border-top: 1px solid #f1f5f9; padding-top: 15px;"">GÖREV AÇIKLAMASI</div>
                  <div style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 13px; color: #475569; line-height: 1.6; margin-bottom: 20px;"">
                    {description.Replace(Environment.NewLine, "<br/>")}
                  </div>";
            }

            var body = $@"<!DOCTYPE html PUBLIC ""-//W3C//DTD XHTML 1.0 Transitional//EN"" ""http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"">
<html xmlns=""http://www.w3.org/1999/xhtml"" xmlns:v=""urn:schemas-microsoft-com:vml"" xmlns:o=""urn:schemas-microsoft-com:office:office"">
<head>
  <meta http-equiv=""Content-Type"" content=""text/html; charset=UTF-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
  <title>Univera UniTask Notification</title>
  
  <!--[if !mso]><!-->
  <link href=""https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"" rel=""stylesheet"">
  <!--<![endif]-->

  <style type=""text/css"">
    body, table, td, a {{ -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }}
    table, td {{ mso-table-lspace: 0pt; mso-table-rspace: 0pt; }}
    img {{ -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }}
    table {{ border-collapse: collapse !important; }}
    body {{ height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #F8FAFC; }}
    
    @media screen and (max-width: 525px) {{
      .wrapper {{ width: 100% !important; max-width: 100% !important; }}
      .mobile-padding {{ padding: 20px 15px !important; }}
    }}
  </style>
</head>
<body style=""margin: 0; padding: 0; background-color: #F8FAFC;"">

  <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"">
    <tr>
      <td bgcolor=""#F8FAFC"" align=""center"" style=""padding: 20px 10px 40px 10px;"">
        
        <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width: 600px;"" class=""wrapper"">
          
          <!-- HEADER -->
          <tr>
            <td align=""left"" valign=""top"" bgcolor=""#25224D"" style=""background-color: #25224D; border-radius: 24px 24px 0 0; padding: 40px 40px 40px 40px;"">
              
              <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"">
                <tr>
                  <td align=""left"">
                    <table border=""0"" cellpadding=""0"" cellspacing=""0"">
                      <tr>
                        <!-- LOGO ICON (CID Embedded – logo.png icon) -->
                        <td valign=""middle"" style=""padding-right: 16px; padding-bottom: 2px;"">
                          <img src=""cid:unitasklogo"" width=""56"" height=""56"" alt=""UniTask"" style=""display: block; border: 0; outline: none; width: 56px; height: 56px;"" />
                        </td>
                        <!-- LOGO TEXT & TAGLINE -->
                        <td valign=""middle"">
                          <table border=""0"" cellpadding=""0"" cellspacing=""0"">
                            <tr>
                              <td align=""left"" style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 900; color: #ffffff; letter-spacing: -1.5px; line-height: 1;"">
                                Uni<span style=""color: #9B7BFF;"">Task</span>
                              </td>
                            </tr>
                            <tr>
                              <td align=""left"" style=""padding: 8px 0;"">
                                <div style=""height: 1px; width: 100%; background-color: rgba(255,255,255,0.15);""></div>
                              </td>
                            </tr>
                            <tr>
                              <td align=""left"" style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; color: #cbd5e1; letter-spacing: 0.2px;"">
                                Univera Task Management
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align=""left"" style=""padding-top: 25px;"">
                    <table border=""0"" cellpadding=""0"" cellspacing=""0"">
                      <tr>
                        <td style=""background-color: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 10px 16px;"">
                          <span style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 12px; color: #cbd5e1; line-height: 1.4;"">
                            <strong>{assignerName}</strong> tarafından <strong>{assigneeName}</strong> kullanıcısına atandı.
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- İÇERİK ALANI -->
          <tr>
            <td bgcolor=""#F1F5F9"" style=""background-color: #F1F5F9; border-radius: 0 0 24px 24px; padding: 40px 30px; border-bottom: 3px solid #e2e8f0; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;"">
              
              <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"">
                
                <!-- 1. SEVİYE: ÇALIŞMA GRUBU -->
                <tr>
                  <td width=""50"" valign=""top"" style=""padding-bottom: 0;"">
                    <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"">
                      <tr>
                        <td align=""center"" valign=""top"">
                          <div style=""width: 10px; height: 10px; background-color: #cbd5e1; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px #cbd5e1;""></div>
                          <div style=""width: 2px; height: 80px; background-color: #e2e8f0; margin-top: -2px; margin-bottom: -2px;""></div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign=""top"" style=""padding-bottom: 25px;"">
                    <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""border: 1px solid #f1f5f9; border-radius: 12px; background-color: #ffffff;"">
                      <tr>
                        <td style=""padding: 15px;"">
                          <div style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;"">Çalışma Grubu</div>
                          <div style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; color: #1e293b;"">{workGroupName}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- 2. SEVİYE: PROJE -->
                <tr>
                  <td width=""50"" valign=""top"" style=""padding-bottom: 0;"">
                    <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"">
                      <tr>
                        <td align=""center"" valign=""top"">
                          <div style=""width: 10px; height: 10px; background-color: #cbd5e1; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px #cbd5e1;""></div>
                          <div style=""width: 2px; height: 80px; background-color: #e2e8f0; margin-top: -2px; margin-bottom: -2px;""></div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign=""top"" style=""padding-bottom: 25px;"">
                    <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""border: 1px solid #f1f5f9; border-radius: 12px; background-color: #ffffff;"">
                      <tr>
                        <td style=""padding: 15px;"">
                          <div style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;"">Proje</div>
                          <div style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; color: #1e293b;"">{projectTitle}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- 3. SEVİYE: ANA GÖREV (HERO) -->
                <tr>
                  <td width=""50"" valign=""top"">
                     <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"">
                      <tr>
                        <td align=""center"" valign=""top"">
                          <div style=""width: 14px; height: 14px; background-color: #6366F1; border: 4px solid #e0e7ff; border-radius: 50%;""></div>
                          <div style=""width: 2px; height: 150px; background-color: #e2e8f0; margin-top: -2px;""></div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign=""top"" style=""padding-bottom: 20px;"">
                    <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""border: 1px solid #e0e7ff; border-radius: 16px; background-color: #ffffff; box-shadow: 0 8px 24px rgba(99, 102, 241, 0.08);"">
                      <tr>
                        <td style=""padding: 24px;"">
                          <div style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 700; color: #6366F1; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;"">Ana Görev</div>
                          <div style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 700; color: #1e293b; line-height: 1.4; margin-bottom: 20px;"">
                            {taskTitle}
                          </div>
                          
                          {descriptionHtml}

                          <!-- İSTATİSTİKLER -->
                          <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""border-top: 1px solid #f1f5f9; padding-top: 15px;"">
                            <tr>
                              <td width=""50%"" valign=""top"">
                                <div style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 700; color: #94a3b8; margin-bottom: 4px;"">BİTİŞ TARİHİ</div>
                                <div style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; color: #334155;"">{dueDateString}</div>
                              </td>
                              <td width=""50%"" valign=""top"">
                                <div style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 700; color: #94a3b8; margin-bottom: 4px;"">İLERLEME</div>
                                <div style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; color: #6366F1;"">{progress}%</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- 4. SEVİYE: ALT GÖREVLER -->
                <tr>
                  <td width=""50"" valign=""top"">
                    <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"">
                      <tr><td align=""center"" valign=""top""></td></tr>
                    </table>
                  </td>
                  <td valign=""top"">
                    <div style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 12px; padding-left: 5px;"">
                      Alt Görevler ({subtasksCount})
                    </div>
                    
                    <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"">
                      {subtasksHtml}
                    </table>
                  </td>
                </tr>
                
                <!-- BUTON -->
                 <tr>
                  <td colspan=""2"" align=""center"" style=""padding-top: 45px;"">
                    <table border=""0"" cellpadding=""0"" cellspacing=""0"">
                      <tr>
                        <td align=""center"" bgcolor=""#6366F1"" style=""border-radius: 12px; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);"">
                          <a href=""{magicLinkUrl}"" target=""_blank"" style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 16px 36px; border: 1px solid #6366F1; display: inline-block; border-radius: 12px; background-color: #6366F1;"">
                            Görevi Görüntüle &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
          
          <!-- FOOTER -->
          <tr>
            <td align=""center"" style=""padding: 25px; font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 12px; color: #94a3b8;"">
              &copy; {DateTime.Now.Year} Univera UniTask Management
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>" ;

            // Send email in background to prevent blocking
            // Send email synchronously (awaited) to ensure delivery before returning
            // This is better for debugging "email not arriving" issues
            var logPath = "/tmp/unity_email.log";
            try 
            {
                await SendEmailAsync(to, subject, body);
                System.IO.File.AppendAllText(logPath, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] SUCCESS: To: {to} | Subject: {subject}\n");
            }
            catch (Exception ex)
            {
                var errorMsg = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] ERROR: To: {to} | Subject: {subject} | Error: {ex.Message}";
                System.IO.File.AppendAllText(logPath, errorMsg + "\n" + ex.StackTrace + "\n");
                LogDebug($"Email send failed: {ex.Message}");
                throw; // Propagate to controller so it returns 500
            }
        }
    }
}
