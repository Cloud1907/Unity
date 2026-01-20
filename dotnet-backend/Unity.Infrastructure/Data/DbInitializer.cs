using Unity.Core.Models;
using Microsoft.EntityFrameworkCore;
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

            // Schema Migration Patch: Ensure IsMaster column exists
            try {
                // Check if column exists, if not add it (SQL Server syntax)
                var command = "IF COL_LENGTH('Departments', 'IsMaster') IS NULL BEGIN ALTER TABLE Departments ADD IsMaster BIT NOT NULL DEFAULT 0 END";
                context.Database.ExecuteSqlRaw(command);
            } catch (Exception ex) {
                Console.WriteLine($"Migration Warning: {ex.Message}");
            }

            // Check if DB is already seeded
            if (context.Users.Any())
            {
                // FORCE PASSWORD UPDATE FOR MELIH (Fix for SQL Script Hash issue)
                var melih = context.Users.FirstOrDefault(u => u.Username == "melih");
                if (melih != null)
                {
                    melih.PasswordHash = BCrypt.Net.BCrypt.HashPassword("test123");
                    context.SaveChanges();
                    Console.WriteLine("✅ PASSWORD FOR MELIH RESET TO 'test123'");
                }
                return; // DB has been seeded
            }

            // Maps to track legacy String IDs to new Int IDs
            var deptMap = new Dictionary<string, int>(); // "Stokbar" -> 1
            var userMap = new Dictionary<string, int>(); // "user-melih" -> 1
            var projectMap = new Dictionary<string, int>(); // "proj-stokbar-main" -> 1
            var labelMap = new Dictionary<string, int>(); // "lbl-acileyet" -> 1

            // Password Hash
            var passwordHash = BCrypt.Net.BCrypt.HashPassword("test123");

            // --- 0. Departments ---
            var depts = new List<Department>
            {
                new Department { Name = "Stokbar", HeadOfDepartment = "Melih", Description = "Stok Yönetimi", Color = "#4F46E5" },
                new Department { Name = "Enroute", HeadOfDepartment = "Ahmet", Description = "Lojistik", Color = "#10B981" },
                new Department { Name = "Quest", HeadOfDepartment = "Ayşe", Description = "Kalite", Color = "#F59E0B" },
                new Department { Name = "Yönetim", HeadOfDepartment = "Fatma", Description = "Üst Yönetim", Color = "#EC4899" },
                new Department { Name = "Satış", HeadOfDepartment = "Elif", Description = "Satış Departmanı", Color = "#8B5CF6" },
                new Department { Name = "İK", HeadOfDepartment = "Can", Description = "İnsan Kaynakları", Color = "#14B8A6" },
                new Department { Name = "Pazarlama", HeadOfDepartment = "Selin", Description = "Pazarlama Departmanı", Color = "#EC4899" },
                new Department { Name = "ArGe", HeadOfDepartment = "Burak", Description = "Ar-Ge Departmanı", Color = "#6366F1" },
                new Department { Name = "Finans", HeadOfDepartment = "Zeynep", Description = "Finans Departmanı", Color = "#10B981" },
                new Department { Name = "Yazılım", HeadOfDepartment = "Melih", Description = "Yazılım Geliştirme", Color = "#3B82F6" }
            };

            context.Departments.AddRange(depts);
            context.SaveChanges();

            // Build Dept Map
            foreach (var d in depts) deptMap[d.Name] = d.Id;

            // --- 1. Users ---
            // Helper to get Dept IDs
            List<int> GetDeptIds(params string[] names) => names.Select(n => deptMap.ContainsKey(n) ? deptMap[n] : 0).Where(id => id > 0).ToList();

            var usersData = new List<(string OldId, User User)>
            {
                ("user-melih", new User { FullName = "Melih Bulut", Email = "melih.bulut@unity.com", Username = "melih", Role = "admin", JobTitle = "Project Manager", Color = "#4F46E5", Departments = GetDeptIds("Stokbar", "Yönetim", "Satış", "İK", "Pazarlama", "ArGe", "Finans") }),
                ("user-ahmet", new User { FullName = "Ahmet Yılmaz", Email = "ahmet@unity.com", Username = "ahmet", Role = "member", JobTitle = "Logistics Specialist", Color = "#10B981", Departments = GetDeptIds("Enroute") }),
                ("user-ayse", new User { FullName = "Ayşe Demir", Email = "ayse@unity.com", Username = "ayse", Role = "member", JobTitle = "Quality Analyst", Color = "#F59E0B", Departments = GetDeptIds("Quest") }),
                ("user-fatma", new User { FullName = "Fatma Kaya", Email = "fatma@unity.com", Username = "fatma", Role = "manager", JobTitle = "Director", Color = "#EC4899", Departments = GetDeptIds("Yönetim") }),
                ("user-mehmet", new User { FullName = "Mehmet Çelik", Email = "mehmet@unity.com", Username = "mehmet", Role = "member", JobTitle = "Warehouse Op.", Color = "#6366F1", Departments = GetDeptIds("Stokbar") }),
                ("user-cem", new User { FullName = "Cem Tekin", Email = "cem@unity.com", Username = "cem", Role = "admin", JobTitle = "System Admin", Color = "#3B82F6", Departments = GetDeptIds() }), // IT not in dept list for simplicity or add
                ("user-selin", new User { FullName = "Selin Yurt", Email = "selin@unity.com", Username = "selin", Role = "member", JobTitle = "Marketing Lead", Color = "#EC4899", Departments = GetDeptIds("Pazarlama") }),
                ("user-burak", new User { FullName = "Burak Deniz", Email = "burak@unity.com", Username = "burak", Role = "member", JobTitle = "Senior Dev", Color = "#6366F1", Departments = GetDeptIds("ArGe") }),
                ("user-zeynep", new User { FullName = "Zeynep Akar", Email = "zeynep@unity.com", Username = "zeynep", Role = "manager", JobTitle = "Finance Manager", Color = "#10B981", Departments = GetDeptIds("Finans") }),
                // Extras needed for projects below
                ("user-elif", new User { FullName = "Elif", Email = "elif@unity.com", Username = "elif", Role = "member", JobTitle="Sales", Color="#8B5CF6", Departments = GetDeptIds("Satış") }),
                ("user-can", new User { FullName = "Can", Email = "can@unity.com", Username = "can", Role = "member", JobTitle="HR", Color="#14B8A6", Departments = GetDeptIds("İK") })
            };

            foreach (var set in usersData)
            {
                set.User.PasswordHash = passwordHash;
                context.Users.Add(set.User);
            }
            context.SaveChanges();

            // Build User Map
            for (int i = 0; i < usersData.Count; i++) userMap[usersData[i].OldId] = usersData[i].User.Id;

            int GetUid(string old) => userMap.ContainsKey(old) ? userMap[old] : (userMap.ContainsKey("user-melih") ? userMap["user-melih"] : 0);
            List<int> GetUids(params string[] olds) => olds.Select(o => GetUid(o)).ToList();

            // --- 2. Projects ---
            int GetDid(string name) => deptMap.ContainsKey(name) ? deptMap[name] : 0;

            var projectsData = new List<(string OldId, Project Proj)>
            {
                ("proj-stokbar-main", new Project { Name = "Stokbar Ana Depo", Description = "Merkez depo stok yönetim ve sayım projesi.", DepartmentId = GetDid("Stokbar"), Owner = GetUid("user-melih"), Members = GetUids("user-melih", "user-mehmet"), CreatedBy = GetUid("user-melih"), Status = "in_progress", Priority = "high", Color = "#4F46E5" }),
                ("proj-enroute-logs", new Project { Name = "Enroute Lojistik", Description = "Sevkiyat takip ve rota optimizasyonu.", DepartmentId = GetDid("Enroute"), Owner = GetUid("user-ahmet"), Members = GetUids("user-ahmet", "user-melih"), CreatedBy = GetUid("user-ahmet"), Status = "planning", Priority = "medium", Color = "#10B981" }),
                ("proj-quest-qa", new Project { Name = "Quest Kalite", Description = "Kalite kontrol süreçleri.", DepartmentId = GetDid("Quest"), Owner = GetUid("user-ayse"), Members = GetUids("user-ayse", "user-melih"), CreatedBy = GetUid("user-ayse"), Status = "working", Priority = "medium", Color = "#F59E0B" }),
                ("proj-yonetim-board", new Project { Name = "Yönetim Kurulu", Description = "Şirket içi stratejik kararlar ve raporlar.", DepartmentId = GetDid("Yönetim"), Owner = GetUid("user-fatma"), Members = GetUids("user-fatma", "user-melih"), CreatedBy = GetUid("user-fatma"), Status = "in_progress", Priority = "urgent", Color = "#EC4899" }),
                ("proj-satis-raporlari", new Project { Name = "Satış Raporları", Description = "Aylık ve yıllık satış hedefleri.", DepartmentId = GetDid("Satış"), Owner = GetUid("user-elif"), Members = GetUids("user-elif", "user-melih"), CreatedBy = GetUid("user-elif"), Status = "done", Priority = "high", Color = "#8B5CF6" }),
                ("proj-ik-surecleri", new Project { Name = "İK Süreçleri", Description = "İşe alım ve personel yönetimi.", DepartmentId = GetDid("İK"), Owner = GetUid("user-can"), Members = GetUids("user-can", "user-melih"), CreatedBy = GetUid("user-can"), Status = "todo", Priority = "low", Color = "#14B8A6" }),
                ("proj-pazarlama-kampanya", new Project { Name = "Yaz Kampanyası", Description = "2026 Yaz sezonu reklam çalışmaları.", DepartmentId = GetDid("Pazarlama"), Owner = GetUid("user-selin"), Members = GetUids("user-selin", "user-melih"), CreatedBy = GetUid("user-selin"), Status = "working", Priority = "high", Color = "#EC4899" }),
                ("proj-arge-v2", new Project { Name = "Mobile App v2", Description = "Yeni nesil mobil uygulama geliştirme.", DepartmentId = GetDid("ArGe"), Owner = GetUid("user-burak"), Members = GetUids("user-burak", "user-melih"), CreatedBy = GetUid("user-burak"), Status = "in_progress", Priority = "urgent", Color = "#6366F1" }),
                ("proj-finans-butce", new Project { Name = "2026 Bütçe Planı", Description = "Yıllık bütçe dağılımı ve kontrolü.", DepartmentId = GetDid("Finans"), Owner = GetUid("user-zeynep"), Members = GetUids("user-zeynep", "user-melih"), CreatedBy = GetUid("user-zeynep"), Status = "review", Priority = "high", Color = "#10B981" })
            };

            foreach (var set in projectsData) context.Projects.Add(set.Proj);
            context.SaveChanges();

            for (int i = 0; i < projectsData.Count; i++) projectMap[projectsData[i].OldId] = projectsData[i].Proj.Id;
            int GetPid(string old) => projectMap.ContainsKey(old) ? projectMap[old] : 0;

            // --- 3. Labels ---
            var labelsData = new List<(string OldId, Label Lbl)>
            {
                ("lbl-acileyet", new Label { Name = "Acileyet", Color = "#EF4444", ProjectId = GetPid("proj-stokbar-main") }),
                ("lbl-backend", new Label { Name = "Backend", Color = "#3B82F6", ProjectId = GetPid("proj-stokbar-main") }),
                ("lbl-review", new Label { Name = "Review", Color = "#F59E0B", ProjectId = GetPid("proj-yonetim-board") }),
                ("lbl-bug", new Label { Name = "Bug", Color = "#DC2626", ProjectId = GetPid("proj-quest-qa") }),
                ("lbl-feature", new Label { Name = "Feature", Color = "#10B981", ProjectId = GetPid("proj-enroute-logs") }),
                ("lbl-design", new Label { Name = "Design", Color = "#EC4899", ProjectId = GetPid("proj-pazarlama-kampanya") }),
                ("lbl-mobile", new Label { Name = "Mobile", Color = "#8B5CF6", ProjectId = GetPid("proj-arge-v2") }),
                ("lbl-finance", new Label { Name = "Finance", Color = "#10B981", ProjectId = GetPid("proj-finans-butce") })
            };

            foreach (var set in labelsData) context.Labels.Add(set.Lbl);
            context.SaveChanges();

            for (int i = 0; i < labelsData.Count; i++) labelMap[labelsData[i].OldId] = labelsData[i].Lbl.Id;
            List<int> GetLids(params string[] olds) => olds.Select(o => labelMap.ContainsKey(o) ? labelMap[o] : 0).Where(id => id > 0).ToList();

            // --- 4. Tasks ---
            var tasks = new List<TaskItem>
            {
                // Stokbar
                new TaskItem { ProjectId=GetPid("proj-stokbar-main"), Title="Yıllık Stok Sayımı", Status="todo", Priority="urgent", AssignedBy=GetUid("user-melih"), Assignees=GetUids("user-mehmet"), Labels=GetLids("lbl-acileyet"), StartDate=DateTime.UtcNow.AddDays(-2), DueDate=DateTime.UtcNow.AddDays(5), Description="Tüm deponun sayılması gerekiyor.", SubtasksJson="[{\"id\":\"1\",\"title\":\"A Blok Sayımı\",\"completed\":false}]" },
                new TaskItem { ProjectId=GetPid("proj-stokbar-main"), Title="Raf Düzenlemesi", Status="in_progress", Priority="medium", AssignedBy=GetUid("user-melih"), Assignees=GetUids("user-mehmet","user-melih"), StartDate=DateTime.UtcNow.AddDays(-5), DueDate=DateTime.UtcNow.AddDays(2), Progress=50 },
                
                // Enroute
                new TaskItem { ProjectId=GetPid("proj-enroute-logs"), Title="Araç Bakımları", Status="todo", Priority="high", AssignedBy=GetUid("user-ahmet"), Assignees=GetUids("user-ahmet"), StartDate=DateTime.UtcNow.AddDays(2), DueDate=DateTime.UtcNow.AddDays(10), Labels=GetLids("lbl-feature") },

                // Quest
                new TaskItem { ProjectId=GetPid("proj-quest-qa"), Title="Bug Raporlama", Status="review", Priority="high", AssignedBy=GetUid("user-ayse"), Assignees=GetUids("user-ayse"), Labels=GetLids("lbl-bug"), StartDate=DateTime.UtcNow.AddDays(-1), DueDate=DateTime.UtcNow.AddDays(1) },

                // Management
                new TaskItem { ProjectId=GetPid("proj-yonetim-board"), Title="Bütçe Raporu", Status="review", Priority="high", AssignedBy=GetUid("user-fatma"), Assignees=GetUids("user-melih"), Labels=GetLids("lbl-review"), StartDate=DateTime.UtcNow.AddDays(-4) },

                // Marketing
                new TaskItem { ProjectId=GetPid("proj-pazarlama-kampanya"), Title="Sosyal Medya Planı", Status="in_progress", Priority="medium", AssignedBy=GetUid("user-selin"), Assignees=GetUids("user-selin"), Labels=GetLids("lbl-design") },

                // Arge
                new TaskItem { ProjectId=GetPid("proj-arge-v2"), Title="API Dokümantasyonu", Status="todo", Priority="medium", AssignedBy=GetUid("user-burak"), Assignees=GetUids("user-burak"), Labels=GetLids("lbl-mobile") },

                // Finance
                new TaskItem { ProjectId=GetPid("proj-finans-butce"), Title="Gider Analizi", Status="in_progress", Priority="high", AssignedBy=GetUid("user-zeynep"), Assignees=GetUids("user-zeynep"), Labels=GetLids("lbl-finance") }
            };

            context.Tasks.AddRange(tasks);
            context.SaveChanges();
        }
    }
}
