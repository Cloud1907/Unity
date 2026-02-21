using System;
using System.IO;
using System.Collections.Generic;

namespace EmailVerification
{
    class Program
    {
        static void Main(string[] args)
        {
            // Dummy Data for Preview
            string assigneeName = "Ali Veli";
            string assignerName = "Melih Bulut";
            string workGroupName = "Univera AI Team";
            string projectTitle = "Stokbar Projeler";
            string taskTitle = "Unisel Depo Yaygınlaştırma 2026";
            string? subtaskTitle = null; // Main Task View
            string priority = "Medium";
            DateTime? dueDate = new DateTime(2026, 12, 31);
            int taskId = 101;
            
            // Dummy Subtasks List (Simulated)
            var subtasks = new List<(string Title, string Assignee, string Status)>
            {
                ("Lojistik Entegrasyon Analizi", "Mehmet Yılmaz", "completed"),
                ("API Güvenlik Testleri", "Selin Kaya", "pending"),
                ("Kullanıcı Kabul Testi (UAT)", "Berk Demir", "pending")
            };

            string html = GenerateEmailHtml(assigneeName, assignerName, workGroupName, projectTitle, taskTitle, subtaskTitle, priority, dueDate, taskId, subtasks);
            
            string outputPath = Path.Combine(Directory.GetCurrentDirectory(), "email_preview_v3.html");
            File.WriteAllText(outputPath, html);
            
            Console.WriteLine("Email preview generated at: " + outputPath);
        }

        static string GenerateEmailHtml(string assigneeName, string assignerName, string workGroupName, string projectTitle, string taskTitle, string? subtaskTitle, string priority, DateTime? dueDate, int taskId, List<(string Title, string Assignee, string Status)> subtasks)
        {
            var dueDateString = dueDate.HasValue ? dueDate.Value.ToString("dd MMM yyyy") : "Belirtilmedi";
            var subtasksCount = subtasks.Count;
            var progress = 33; // Mock progress

            // Subtask HTML Generator
            string subtasksHtml = "";
            foreach (var task in subtasks)
            {
                var isCompleted = task.Status == "completed";
                var dotColor = isCompleted ? "#cbd5e1" : "#6366f1";
                var titleStyle = isCompleted 
                    ? "font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 13px; color: #94a3b8; text-decoration: line-through;" 
                    : "font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 13px; color: #475569; font-weight: 500;";

                subtasksHtml += $@"
                      <tr>
                        <td width=""24"" valign=""middle"" align=""center"" style=""padding-bottom: 8px;"">
                          <div style=""width: 6px; height: 6px; border: 2px solid {dotColor}; border-radius: 50%;""></div>
                        </td>
                        <td valign=""middle"" style=""padding-left: 10px; padding-bottom: 8px;"">
                          <span style=""{titleStyle}"">{task.Title}</span>
                        </td>
                      </tr>";
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
            <td align=""center"" valign=""top"" bgcolor=""#4f46e5"" style=""background-color: #4f46e5; background-image: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); border-radius: 24px 24px 0 0; padding: 30px 20px 40px 20px;"">
              <!--[if gte mso 9]>
              <v:rect xmlns:v=""urn:schemas-microsoft-com:vml"" fill=""true"" stroke=""false"" style=""width:600px;height:240px;"">
                <v:fill type=""gradient"" color2=""#3730a3"" color1=""#4f46e5"" angle=""135"" />
                <v:textbox style=""mso-fit-shape-to-text:true"" inset=""0,0,0,0"">
              <![endif]-->
              
              <table border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"">
                <tr>
                  <td align=""center"">
                    <table border=""0"" cellpadding=""0"" cellspacing=""0"">
                      <tr>
                        <td width=""56"" height=""56"" bgcolor=""#7c3aed"" align=""center"" valign=""middle"" style=""background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); border-radius: 14px; box-shadow: 0 8px 20px rgba(0,0,0,0.2);"">
                           <img src=""https://img.icons8.com/ios-filled/50/ffffff/hexagon.png"" width=""28"" height=""28"" alt="""" style=""display: block;"" />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align=""center"" style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; padding-top: 15px; padding-bottom: 5px;"">
                    UniTask
                  </td>
                </tr>
                <tr>
                  <td align=""center"" style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 500; color: #e0e7ff; letter-spacing: 0.5px; padding-bottom: 15px;"">
                    Univera Task Management
                  </td>
                </tr>
                <tr>
                  <td align=""center"">
                    <table border=""0"" cellpadding=""0"" cellspacing=""0"">
                      <tr>
                        <td style=""background-color: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 8px 16px;"">
                          <span style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 12px; color: #ffffff; line-height: 1.4;"">
                            <strong>{assignerName}</strong> tarafından <strong>{assigneeName}</strong> kullanıcısına atandı.
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!--[if gte mso 9]>
                </v:textbox>
              </v:rect>
              <![endif]-->
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
                          <a href=""https://unity.univera.com.tr/board/{taskId}"" target=""_blank"" style=""font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 16px 36px; border: 1px solid #6366F1; display: inline-block; border-radius: 12px; background-color: #6366F1;"">
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
</html>";
            return body;
        }
    }
}
