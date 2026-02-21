using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Mail;
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

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(username, "UniTask Bilgilendirme"),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true,
                    SubjectEncoding = System.Text.Encoding.UTF8,
                    BodyEncoding = System.Text.Encoding.UTF8
                };
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
    }
}
