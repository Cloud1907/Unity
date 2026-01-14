using Unity.Core.Models;
using System.Text.Json;
using System.Data;
using System.Linq;
using System;
using System.Collections.Generic;

namespace Unity.Infrastructure.Data
{
    public static class DbInitializer
    {
        public static void Initialize(AppDbContext context)
        {
            context.Database.EnsureCreated();

            // Password Hash (BCrypt for production compatibility)
            var passwordHash = BCrypt.Net.BCrypt.HashPassword("123456"); 

            // --- 1. Users (Upsert Logic) ---
            var users = new User[]
            {
                // Admin / Main User
                new User 
                { 
                    Id = "user-melih", 
                    FullName = "Melih Bulut", 
                    Email = "melih.bulut@unity.com", 
                    Username = "melih", 
                    Role = "admin", 
                    DepartmentsJson = "[\"Stokbar\", \"Yönetim\", \"Satış\", \"İK\", \"Pazarlama\", \"ArGe\", \"Finans\"]", 
                    JobTitle = "Project Manager",
                    PasswordHash = passwordHash,
                    Color = "#4F46E5"
                },
                new User { Id = "user-ahmet", FullName = "Ahmet Yılmaz", Email = "ahmet@unity.com", Username = "ahmet", Role = "member", DepartmentsJson = "[\"Enroute\"]", JobTitle = "Logistics Specialist", PasswordHash = passwordHash, Color = "#10B981" },
                new User { Id = "user-ayse", FullName = "Ayşe Demir", Email = "ayse@unity.com", Username = "ayse", Role = "member", DepartmentsJson = "[\"Quest\"]", JobTitle = "Quality Analyst", PasswordHash = passwordHash, Color = "#F59E0B" },
                new User { Id = "user-fatma", FullName = "Fatma Kaya", Email = "fatma@unity.com", Username = "fatma", Role = "manager", DepartmentsJson = "[\"Yönetim\"]", JobTitle = "Director", PasswordHash = passwordHash, Color = "#EC4899" },
                new User { Id = "user-mehmet", FullName = "Mehmet Çelik", Email = "mehmet@unity.com", Username = "mehmet", Role = "member", DepartmentsJson = "[\"Stokbar\"]", JobTitle = "Warehouse Op.", PasswordHash = passwordHash, Color = "#6366F1" },
                new User { Id = "user-cem", FullName = "Cem Tekin", Email = "cem@unity.com", Username = "cem", Role = "admin", DepartmentsJson = "[\"IT\"]", JobTitle = "System Admin", PasswordHash = passwordHash, Color = "#3B82F6" },
                // ... (Previous Users) ...
                new User { Id = "user-selin", FullName = "Selin Yurt", Email = "selin@unity.com", Username = "selin", Role = "member", DepartmentsJson = "[\"Pazarlama\"]", JobTitle = "Marketing Lead", PasswordHash = passwordHash, Color = "#EC4899" },
                new User { Id = "user-burak", FullName = "Burak Deniz", Email = "burak@unity.com", Username = "burak", Role = "member", DepartmentsJson = "[\"ArGe\"]", JobTitle = "Senior Dev", PasswordHash = passwordHash, Color = "#6366F1" },
                new User { Id = "user-zeynep", FullName = "Zeynep Akar", Email = "zeynep@unity.com", Username = "zeynep", Role = "manager", DepartmentsJson = "[\"Finans\"]", JobTitle = "Finance Manager", PasswordHash = passwordHash, Color = "#10B981" }
            };

            foreach (var user in users)
            {
                var existing = context.Users.Find(user.Id);
                if (existing == null)
                {
                    context.Users.Add(user);
                }
                else
                {
                    existing.DepartmentsJson = user.DepartmentsJson;
                    existing.Role = user.Role;
                    existing.FullName = user.FullName;
                    existing.JobTitle = user.JobTitle;
                    existing.PasswordHash = user.PasswordHash; 
                    existing.Avatar = user.Avatar; // Force update to clear old bad paths if new is null
                    existing.Color = user.Color;
                }
            }
            context.SaveChanges();

            context.SaveChanges();

            // --- 0. Departments ---
            // Only seed if empty to allow dynamic editing in future restarts without overwrite, 
            // OR use Upsert logic like Users if we want to enforce defaults. 
            // For now, simple check if any exist.
            if (!context.Departments.Any())
            {
                var depts = new Department[]
                {
                    new Department { Id = "dept-stokbar", Name = "Stokbar", HeadOfDepartment = "Melih", Description = "Stok Yönetimi", Color = "#4F46E5" },
                    new Department { Id = "dept-enroute", Name = "Enroute", HeadOfDepartment = "Ahmet", Description = "Lojistik", Color = "#10B981" },
                    new Department { Id = "dept-quest", Name = "Quest", HeadOfDepartment = "Ayşe", Description = "Kalite", Color = "#F59E0B" },
                    new Department { Id = "dept-yonetim", Name = "Yönetim", HeadOfDepartment = "Fatma", Description = "Üst Yönetim", Color = "#EC4899" },
                    new Department { Id = "dept-satis", Name = "Satış", HeadOfDepartment = "Elif", Description = "Satış Departmanı", Color = "#8B5CF6" },
                    new Department { Id = "dept-ik", Name = "İK", HeadOfDepartment = "Can", Description = "İnsan Kaynakları", Color = "#14B8A6" },
                    new Department { Id = "dept-pazarlama", Name = "Pazarlama", HeadOfDepartment = "Selin", Description = "Pazarlama Departmanı", Color = "#EC4899" },
                    new Department { Id = "dept-arge", Name = "ArGe", HeadOfDepartment = "Burak", Description = "Ar-Ge Departmanı", Color = "#6366F1" },
                    new Department { Id = "dept-finans", Name = "Finans", HeadOfDepartment = "Zeynep", Description = "Finans Departmanı", Color = "#10B981" },
                    new Department { Id = "dept-yazilim", Name = "Yazılım", HeadOfDepartment = "Melih", Description = "Yazılım Geliştirme", Color = "#3B82F6" } // Added new requested dept partially if user wants it default
                };
                context.Departments.AddRange(depts);
                context.SaveChanges();
            }

            // --- 2. Projects ---
            context.Projects.RemoveRange(context.Projects);
            var projects = new Project[]
                {
                    // Existing Projects
                    new Project { Id = "proj-stokbar-main", Name = "Stokbar Ana Depo", Description = "Merkez depo stok yönetim ve sayım projesi.", Department = "Stokbar", Owner = "user-melih", MembersJson = "[\"user-melih\", \"user-mehmet\"]", CreatedBy = "user-melih", Status = "in_progress", Priority = "high", Color = "#4F46E5" },
                    new Project { Id = "proj-enroute-logs", Name = "Enroute Lojistik", Description = "Sevkiyat takip ve rota optimizasyonu.", Department = "Enroute", Owner = "user-ahmet", MembersJson = "[\"user-ahmet\", \"user-melih\"]", CreatedBy = "user-ahmet", Status = "planning", Priority = "medium", Color = "#10B981" },
                    new Project { Id = "proj-quest-qa", Name = "Quest Kalite", Description = "Kalite kontrol süreçleri.", Department = "Quest", Owner = "user-ayse", MembersJson = "[\"user-ayse\", \"user-melih\"]", CreatedBy = "user-ayse", Status = "working", Priority = "medium", Color = "#F59E0B" },
                    new Project { Id = "proj-yonetim-board", Name = "Yönetim Kurulu", Description = "Şirket içi stratejik kararlar ve raporlar.", Department = "Yönetim", Owner = "user-fatma", MembersJson = "[\"user-fatma\", \"user-melih\"]", CreatedBy = "user-fatma", Status = "in_progress", Priority = "urgent", Color = "#EC4899" },
                    new Project { Id = "proj-satis-raporlari", Name = "Satış Raporları", Description = "Aylık ve yıllık satış hedefleri.", Department = "Satış", Owner = "user-elif", MembersJson = "[\"user-elif\", \"user-melih\"]", CreatedBy = "user-elif", Status = "done", Priority = "high", Color = "#8B5CF6" },
                    new Project { Id = "proj-ik-surecleri", Name = "İK Süreçleri", Description = "İşe alım ve personel yönetimi.", Department = "İK", Owner = "user-can", MembersJson = "[\"user-can\", \"user-melih\"]", CreatedBy = "user-can", Status = "todo", Priority = "low", Color = "#14B8A6" },
                    
                    // New Projects
                    new Project { Id = "proj-pazarlama-kampanya", Name = "Yaz Kampanyası", Description = "2026 Yaz sezonu reklam çalışmaları.", Department = "Pazarlama", Owner = "user-selin", MembersJson = "[\"user-selin\", \"user-melih\"]", CreatedBy = "user-selin", Status = "working", Priority = "high", Color = "#EC4899" },
                    new Project { Id = "proj-arge-v2", Name = "Mobile App v2", Description = "Yeni nesil mobil uygulama geliştirme.", Department = "ArGe", Owner = "user-burak", MembersJson = "[\"user-burak\", \"user-melih\"]", CreatedBy = "user-burak", Status = "in_progress", Priority = "urgent", Color = "#6366F1" },
                    new Project { Id = "proj-finans-butce", Name = "2026 Bütçe Planı", Description = "Yıllık bütçe dağılımı ve kontrolü.", Department = "Finans", Owner = "user-zeynep", MembersJson = "[\"user-zeynep\", \"user-melih\"]", CreatedBy = "user-zeynep", Status = "review", Priority = "high", Color = "#10B981" }
                };
            context.Projects.AddRange(projects);
            context.SaveChanges();

            // --- 3. Labels (Strictly Project-Specific) ---
            context.Labels.RemoveRange(context.Labels);
            var labels = new Label[]
                {
                    new Label { Id = "lbl-acileyet", Name = "Acileyet", Color = "#EF4444", ProjectId = "proj-stokbar-main" },
                    new Label { Id = "lbl-backend", Name = "Backend", Color = "#3B82F6", ProjectId = "proj-stokbar-main" },
                    new Label { Id = "lbl-review", Name = "Review", Color = "#F59E0B", ProjectId = "proj-yonetim-board" },
                    new Label { Id = "lbl-bug", Name = "Bug", Color = "#DC2626", ProjectId = "proj-quest-qa" },
                    new Label { Id = "lbl-feature", Name = "Feature", Color = "#10B981", ProjectId = "proj-enroute-logs" },
                    new Label { Id = "lbl-design", Name = "Design", Color = "#EC4899", ProjectId = "proj-pazarlama-kampanya" },
                    new Label { Id = "lbl-mobile", Name = "Mobile", Color = "#8B5CF6", ProjectId = "proj-arge-v2" },
                    new Label { Id = "lbl-finance", Name = "Finance", Color = "#10B981", ProjectId = "proj-finans-butce" }
                };
            context.Labels.AddRange(labels);
            context.SaveChanges();

            // --- 4. Tasks ---
            context.Tasks.RemoveRange(context.Tasks);
            var tasks = new List<TaskItem>();

            // --- STOKBAR (PROJ-STOKBAR-MAIN) ---
            tasks.Add(new TaskItem 
            { 
                Id = "task-sb-1", ProjectId = "proj-stokbar-main", Title = "Yıllık Stok Sayımı", Status = "todo", Priority = "urgent", 
                AssignedBy = "user-melih", AssigneesJson = "[\"user-mehmet\"]", LabelsJson = "[\"lbl-acileyet\"]", 
                StartDate = DateTime.UtcNow.AddDays(-2), DueDate = DateTime.UtcNow.AddDays(5), 
                Description="Tüm deponun sayılması gerekiyor.",
                SubtasksJson = "[{\"id\":\"st-1\",\"title\":\"A Blok Sayımı\",\"completed\":false},{\"id\":\"st-2\",\"title\":\"B Blok Sayımı\",\"completed\":false}]",
                CommentsJson = "[{\"id\":\"c-1\",\"author\":\"user-melih\",\"text\":\"Sayım listeleri hazır mı?\",\"createdAt\":\"2026-01-10T10:00:00Z\"}]"
            });
            tasks.Add(new TaskItem { Id = "task-sb-2", ProjectId = "proj-stokbar-main", Title = "Raf Düzenlemesi", Status = "in_progress", Priority = "medium", AssignedBy = "user-melih", AssigneesJson = "[\"user-mehmet\", \"user-melih\"]", StartDate = DateTime.UtcNow.AddDays(-5), DueDate = DateTime.UtcNow.AddDays(2), Progress = 50, Description="A ve B blok rafları düzenlenecek.", SubtasksJson = "[{\"id\":\"st-3\",\"title\":\"Etiketleme\",\"completed\":true},{\"id\":\"st-4\",\"title\":\"Barkod Kontrol\",\"completed\":false}]" });
            tasks.Add(new TaskItem { Id = "task-sb-3", ProjectId = "proj-stokbar-main", Title = "Forklift Bakımı", Status = "done", Priority = "high", AssignedBy = "user-melih", AssigneesJson = "[\"user-mehmet\"]", StartDate = DateTime.UtcNow.AddDays(-10), DueDate = DateTime.UtcNow.AddDays(-2), Progress = 100, Description="Forkliftlerin yıllık bakımı." });
            tasks.Add(new TaskItem { Id = "task-sb-4", ProjectId = "proj-stokbar-main", Title = "Yeni Mal Kabul", Status = "todo", Priority = "medium", AssignedBy = "user-melih", AssigneesJson = "[\"user-mehmet\"]", StartDate = DateTime.UtcNow.AddDays(1), DueDate = DateTime.UtcNow.AddDays(3), Description="Yarın gelecek tırın karşılanması." });
            tasks.Add(new TaskItem { Id = "task-sb-5", ProjectId = "proj-stokbar-main", Title = "Depo Temizliği", Status = "todo", Priority = "low", AssignedBy = "user-melih", AssigneesJson = "[\"user-mehmet\"]", StartDate = DateTime.UtcNow.AddDays(1), DueDate = DateTime.UtcNow.AddDays(2), Description="Genel temizlik." });

            // --- ENROUTE (PROJ-ENROUTE-LOGS) ---
            tasks.Add(new TaskItem { Id = "task-en-1", ProjectId = "proj-enroute-logs", Title = "Araç Bakımları", Status = "todo", Priority = "high", AssignedBy = "user-ahmet", AssigneesJson = "[\"user-ahmet\"]", StartDate = DateTime.UtcNow.AddDays(2), DueDate = DateTime.UtcNow.AddDays(10), Description="Araçların kışlık bakımları." });
            tasks.Add(new TaskItem { Id = "task-en-2", ProjectId = "proj-enroute-logs", Title = "Rota Optimizasyonu", Status = "in_progress", Priority = "medium", AssignedBy = "user-ahmet", AssigneesJson = "[\"user-ahmet\", \"user-melih\"]", StartDate = DateTime.UtcNow.AddDays(-3), DueDate = DateTime.UtcNow.AddDays(4), Progress = 35, Description="İstanbul rotaları için yeni planlama.", SubtasksJson = "[{\"id\":\"st-5\",\"title\":\"Avrupa Yakası\",\"completed\":true},{\"id\":\"st-6\",\"title\":\"Anadolu Yakası\",\"completed\":false}]" });
            tasks.Add(new TaskItem { Id = "task-en-3", ProjectId = "proj-enroute-logs", Title = "Sürücü Eğitimi", Status = "working", Priority = "low", AssignedBy = "user-ahmet", AssigneesJson = "[\"user-ahmet\"]", StartDate = DateTime.UtcNow.AddDays(-1), DueDate = DateTime.UtcNow.AddDays(5), Description="İleri sürüş teknikleri eğitimi." });
            tasks.Add(new TaskItem { Id = "task-en-4", ProjectId = "proj-enroute-logs", Title = "Yeni Rota Denemesi", Status = "todo", Priority = "medium", AssignedBy = "user-ahmet", AssigneesJson = "[\"user-ahmet\"]", StartDate = DateTime.UtcNow.AddDays(5), DueDate = DateTime.UtcNow.AddDays(6), Description="Hızlı teslimat rotası." });

            // --- QUEST (PROJ-QUEST-QA) ---
            tasks.Add(new TaskItem { Id = "task-quest-1", ProjectId = "proj-quest-qa", Title = "Son Kullanıcı Testleri", Status = "working", Priority = "medium", AssignedBy = "user-ayse", AssigneesJson = "[\"user-ayse\"]", StartDate = DateTime.UtcNow.AddDays(-2), DueDate = DateTime.UtcNow.AddDays(3), Progress = 45, Description="Beta sürüm testleri.", SubtasksJson = "[{\"id\":\"st-7\",\"title\":\"Form Testleri\",\"completed\":true},{\"id\":\"st-8\",\"title\":\"Mobil Uyumluluk\",\"completed\":false}]" });
            tasks.Add(new TaskItem { Id = "task-quest-2", ProjectId = "proj-quest-qa", Title = "Bug Raporlama", Status = "review", Priority = "high", AssignedBy = "user-ayse", AssigneesJson = "[\"user-ayse\", \"user-melih\"]", LabelsJson = "[\"lbl-bug\"]", StartDate = DateTime.UtcNow.AddDays(-1), DueDate = DateTime.UtcNow.AddDays(1), Progress = 80, Description="Bulunan hataların raporlanması.", CommentsJson = "[{\"id\":\"c-2\",\"author\":\"user-ayse\",\"text\":\"Kritik buglar fixlendi mi?\",\"createdAt\":\"2026-01-14T09:00:00Z\"}]" });
            tasks.Add(new TaskItem { Id = "task-quest-3", ProjectId = "proj-quest-qa", Title = "Otomasyon Scriptleri", Status = "todo", Priority = "high", AssignedBy = "user-ayse", AssigneesJson = "[\"user-ayse\"]", StartDate = DateTime.UtcNow.AddDays(5), DueDate = DateTime.UtcNow.AddDays(15), Description="Selenium test otomasyonu." });

            // --- YÖNETİM (PROJ-YONETIM-BOARD) ---
            tasks.Add(new TaskItem { Id = "task-yon-1", ProjectId = "proj-yonetim-board", Title = "Bütçe Raporu", Status = "review", Priority = "high", AssignedBy = "user-fatma", AssigneesJson = "[\"user-melih\"]", LabelsJson = "[\"lbl-review\"]", StartDate = DateTime.UtcNow.AddDays(-4), DueDate = DateTime.UtcNow.AddDays(2), Progress = 90, Description="2026 Q1 bütçe raporu hazırlanacak." });
            tasks.Add(new TaskItem { Id = "task-yon-2", ProjectId = "proj-yonetim-board", Title = "Personel Alımı", Status = "todo", Priority = "medium", AssignedBy = "user-fatma", AssigneesJson = "[\"user-fatma\"]", StartDate = DateTime.UtcNow, DueDate = DateTime.UtcNow.AddDays(20), Description="IT departmanı için yeni personel alımı." });
            tasks.Add(new TaskItem { Id = "task-yon-3", ProjectId = "proj-yonetim-board", Title = "Strateji Toplantısı", Status = "done", Priority = "urgent", AssignedBy = "user-fatma", AssigneesJson = "[\"user-fatma\", \"user-melih\"]", StartDate = DateTime.UtcNow.AddDays(-7), DueDate = DateTime.UtcNow.AddDays(-7), Progress = 100, Description="Yıllık strateji toplantısı notları." });
            tasks.Add(new TaskItem { Id = "task-yon-4", ProjectId = "proj-yonetim-board", Title = "Yönetim Sunumu", Status = "todo", Priority = "high", AssignedBy = "user-fatma", AssigneesJson = "[\"user-fatma\"]", StartDate = DateTime.UtcNow.AddDays(10), DueDate = DateTime.UtcNow.AddDays(12), Description="Sunum slaytları hazırlanacak." });

            // --- PAZARLAMA (PROJ-PAZARLAMA-KAMPANYA) ---
            tasks.Add(new TaskItem { Id = "task-paz-1", ProjectId = "proj-pazarlama-kampanya", Title = "Sosyal Medya Planı", Status = "in_progress", Priority = "medium", AssignedBy = "user-selin", AssigneesJson = "[\"user-selin\"]", LabelsJson = "[\"lbl-design\"]", StartDate = DateTime.UtcNow.AddDays(-2), DueDate = DateTime.UtcNow.AddDays(4), Progress = 60, Description="Instagram ve LinkedIn içerik planı.", SubtasksJson = "[{\"id\":\"st-9\",\"title\":\"Görsel Tasarım\",\"completed\":true},{\"id\":\"st-10\",\"title\":\"Copywriting\",\"completed\":false}]" });
            tasks.Add(new TaskItem { Id = "task-paz-2", ProjectId = "proj-pazarlama-kampanya", Title = "Google Ads Reklamları", Status = "working", Priority = "high", AssignedBy = "user-selin", AssigneesJson = "[\"user-selin\"]", StartDate = DateTime.UtcNow.AddDays(-1), DueDate = DateTime.UtcNow.AddDays(2), Progress = 40, Description="Yeni kampanya kurulumu." });
            tasks.Add(new TaskItem { Id = "task-paz-3", ProjectId = "proj-pazarlama-kampanya", Title = "Broşür Tasarımı", Status = "review", Priority = "low", AssignedBy = "user-selin", AssigneesJson = "[\"user-selin\"]", LabelsJson = "[\"lbl-design\"]", StartDate = DateTime.UtcNow.AddDays(-5), DueDate = DateTime.UtcNow.AddDays(-1), Progress = 100, Description="Baskı için broşür tasarımları." });
            tasks.Add(new TaskItem { Id = "task-paz-4", ProjectId = "proj-pazarlama-kampanya", Title = "Email Pazarlama", Status = "todo", Priority = "medium", AssignedBy = "user-selin", AssigneesJson = "[\"user-selin\"]", StartDate = DateTime.UtcNow.AddDays(2), DueDate = DateTime.UtcNow.AddDays(3), Description="Bülten gönderimi." });

            // --- ARGE (PROJ-ARGE-V2) ---
            tasks.Add(new TaskItem { Id = "task-arge-1", ProjectId = "proj-arge-v2", Title = "API Dokümantasyonu", Status = "todo", Priority = "medium", AssignedBy = "user-burak", AssigneesJson = "[\"user-burak\"]", LabelsJson = "[\"lbl-mobile\"]", StartDate = DateTime.UtcNow.AddDays(3), DueDate = DateTime.UtcNow.AddDays(7), Description="Swagger docs güncellenecek." });
            tasks.Add(new TaskItem { Id = "task-arge-2", ProjectId = "proj-arge-v2", Title = "Login Ekranı Tasarımı", Status = "done", Priority = "high", AssignedBy = "user-burak", AssigneesJson = "[\"user-burak\"]", LabelsJson = "[\"lbl-mobile\"]", StartDate = DateTime.UtcNow.AddDays(-8), DueDate = DateTime.UtcNow.AddDays(-3), Progress = 100, Description="Figma tasarımları koda dökülecek." });
            tasks.Add(new TaskItem { Id = "task-arge-3", ProjectId = "proj-arge-v2", Title = "Push Notification", Status = "working", Priority = "urgent", AssignedBy = "user-burak", AssigneesJson = "[\"user-burak\", \"user-melih\"]", LabelsJson = "[\"lbl-mobile\"]", StartDate = DateTime.UtcNow.AddDays(-2), DueDate = DateTime.UtcNow.AddDays(5), Progress = 25, Description="Firebase entegrasyonu.", SubtasksJson = "[{\"id\":\"st-11\",\"title\":\"iOS Kurulumu\",\"completed\":false},{\"id\":\"st-12\",\"title\":\"Android Kurulumu\",\"completed\":false}]" });
            tasks.Add(new TaskItem { Id = "task-arge-4", ProjectId = "proj-arge-v2", Title = "Unit Test Yazımı", Status = "todo", Priority = "high", AssignedBy = "user-burak", AssigneesJson = "[\"user-burak\"]", StartDate = DateTime.UtcNow.AddDays(8), DueDate = DateTime.UtcNow.AddDays(12), Description="Core servislerin testleri." });

            // --- FİNANS (PROJ-FINANS-BUTCE) ---
            tasks.Add(new TaskItem { Id = "task-fin-1", ProjectId = "proj-finans-butce", Title = "Gider Analizi", Status = "in_progress", Priority = "high", AssignedBy = "user-zeynep", AssigneesJson = "[\"user-zeynep\"]", LabelsJson = "[\"lbl-finance\"]", StartDate = DateTime.UtcNow.AddDays(-3), DueDate = DateTime.UtcNow.AddDays(3), Progress = 42, Description="Son çeyrek giderlerinin analizi.", SubtasksJson = "[{\"id\":\"st-13\",\"title\":\"Excel Çıktısı\",\"completed\":true},{\"id\":\"st-14\",\"title\":\"Kategori Eşleme\",\"completed\":false}]" });
            tasks.Add(new TaskItem { Id = "task-fin-2", ProjectId = "proj-finans-butce", Title = "Nakit Akışı Raporu", Status = "done", Priority = "urgent", AssignedBy = "user-zeynep", AssigneesJson = "[\"user-zeynep\"]", LabelsJson = "[\"lbl-finance\"]", StartDate = DateTime.UtcNow.AddDays(-2), DueDate = DateTime.UtcNow.AddDays(-2), Progress = 100, Description="Haftalık nakit akışı." });
            tasks.Add(new TaskItem { Id = "task-fin-3", ProjectId = "proj-finans-butce", Title = "Vergi Planlaması", Status = "todo", Priority = "high", AssignedBy = "user-zeynep", AssigneesJson = "[\"user-zeynep\"]", StartDate = DateTime.UtcNow.AddDays(15), DueDate = DateTime.UtcNow.AddDays(20), Description="Yıllık vergi hazırlığı." });

            context.Tasks.AddRange(tasks);
            context.SaveChanges();
        }
    }
}
