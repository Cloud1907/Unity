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

            // DATA REPAIR: Standardize all users as male with professional silhouette avatars
            try {
                // Professional male silhouette avatar URL
                string maleAvatar = "https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=b6e3f4,c0aede,d1d4f9";

                var allUsers = context.Users.ToList();
                bool changed = false;
                foreach (var u in allUsers) {
                    bool userChanged = false;
                    if (u.Gender != "male") { u.Gender = "male"; userChanged = true; }
                    if (string.IsNullOrEmpty(u.Avatar) || !u.Avatar.Contains("notionists")) { u.Avatar = maleAvatar; userChanged = true; }
                    
                    // Legacy repair for Melih explicitly if still needed
                    if (u.Email == "melih.bulut@univera.com.tr") {
                        if (string.IsNullOrEmpty(u.FullName)) u.FullName = "Melih Bulut";
                        if (string.IsNullOrEmpty(u.Role)) u.Role = "admin";
                        if (string.IsNullOrEmpty(u.PasswordHash)) u.PasswordHash = BCrypt.Net.BCrypt.HashPassword("test123");
                        userChanged = true;
                    }

                    if (userChanged) changed = true;
                }
                
                if (changed) context.SaveChanges();
            } catch (Exception ex) {
                Console.WriteLine($"Bulk User Update Warning: {ex.Message}");
            }

            // Check if DB is already seeded (Initial check)
            if (context.Users.Any())
            {
                return;
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

            var usersData = new List<(string OldId, User User, List<int> DeptIds)>
            {
                ("user-melih", new User { FullName = "Melih Bulut", Email = "melih.bulut@univera.com.tr", Username = "melih", Role = "admin", JobTitle = "Project Manager", Color = "#4F46E5", Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Melih" }, GetDeptIds("Stokbar", "Yönetim", "Satış", "İK", "Pazarlama", "ArGe", "Finans")),
                ("user-ahmet", new User { FullName = "Ahmet Yılmaz", Email = "ahmet@unity.com", Username = "ahmet", Role = "member", JobTitle = "Logistics Specialist", Color = "#10B981", Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmet" }, GetDeptIds("Enroute")),
                ("user-ayse", new User { FullName = "Ayşe Demir", Email = "ayse@unity.com", Username = "ayse", Role = "member", JobTitle = "Quality Analyst", Color = "#F59E0B", Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Ayse" }, GetDeptIds("Quest")),
                ("user-fatma", new User { FullName = "Fatma Kaya", Email = "fatma@unity.com", Username = "fatma", Role = "manager", JobTitle = "Director", Color = "#EC4899", Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Fatma" }, GetDeptIds("Yönetim")),
                ("user-mehmet", new User { FullName = "Mehmet Çelik", Email = "mehmet@unity.com", Username = "mehmet", Role = "member", JobTitle = "Warehouse Op.", Color = "#6366F1", Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Mehmet" }, GetDeptIds("Stokbar")),
                ("user-cem", new User { FullName = "Cem Tekin", Email = "cem@unity.com", Username = "cem", Role = "admin", JobTitle = "System Admin", Color = "#3B82F6", Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Cem" }, GetDeptIds()), 
                ("user-selin", new User { FullName = "Selin Yurt", Email = "selin@unity.com", Username = "selin", Role = "member", JobTitle = "Marketing Lead", Color = "#EC4899", Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Selin" }, GetDeptIds("Pazarlama")),
                ("user-burak", new User { FullName = "Burak Deniz", Email = "burak@unity.com", Username = "burak", Role = "member", JobTitle = "Senior Dev", Color = "#6366F1", Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Burak" }, GetDeptIds("ArGe")),
                ("user-zeynep", new User { FullName = "Zeynep Akar", Email = "zeynep@unity.com", Username = "zeynep", Role = "manager", JobTitle = "Finance Manager", Color = "#10B981", Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Zeynep" }, GetDeptIds("Finans")),
                ("user-elif", new User { FullName = "Elif", Email = "elif@unity.com", Username = "elif", Role = "member", JobTitle="Sales", Color="#8B5CF6", Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Elif" }, GetDeptIds("Satış")),
                ("user-can", new User { FullName = "Can", Email = "can@unity.com", Username = "can", Role = "member", JobTitle="HR", Color="#14B8A6", Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Can" }, GetDeptIds("İK"))
            };

            foreach (var set in usersData)
            {
                set.User.PasswordHash = passwordHash;
                set.User.Departments = set.DeptIds.Select(did => new UserDepartment { DepartmentId = did }).ToList();
                context.Users.Add(set.User);
            }
            context.SaveChanges();

            // Build User Map
            for (int i = 0; i < usersData.Count; i++) userMap[usersData[i].OldId] = usersData[i].User.Id;

            int GetUid(string old) => userMap.ContainsKey(old) ? userMap[old] : (userMap.ContainsKey("user-melih") ? userMap["user-melih"] : 0);
            List<int> GetUids(params string[] olds) => olds.Select(o => GetUid(o)).ToList();

            // --- 2. Projects ---
            int GetDid(string name) => deptMap.ContainsKey(name) ? deptMap[name] : 0;

            var projectsData = new List<(string OldId, Project Proj, List<int> MemberIds)>
            {
                ("proj-stokbar-main", new Project { Name = "Stokbar Ana Depo", Description = "Merkez depo stok yönetim ve sayım projesi.", DepartmentId = GetDid("Stokbar"), Owner = GetUid("user-melih"), CreatedBy = GetUid("user-melih"), Status = "in_progress", Priority = "high", Color = "#4F46E5" }, GetUids("user-melih", "user-mehmet")),
                ("proj-enroute-logs", new Project { Name = "Enroute Lojistik", Description = "Sevkiyat takip ve rota optimizasyonu.", DepartmentId = GetDid("Enroute"), Owner = GetUid("user-ahmet"), CreatedBy = GetUid("user-ahmet"), Status = "planning", Priority = "medium", Color = "#10B981" }, GetUids("user-ahmet", "user-melih")),
                ("proj-quest-qa", new Project { Name = "Quest Kalite", Description = "Kalite kontrol süreçleri.", DepartmentId = GetDid("Quest"), Owner = GetUid("user-ayse"), CreatedBy = GetUid("user-ayse"), Status = "working", Priority = "medium", Color = "#F59E0B" }, GetUids("user-ayse", "user-melih")),
                ("proj-yonetim-board", new Project { Name = "Yönetim Kurulu", Description = "Şirket içi stratejik kararlar ve raporlar.", DepartmentId = GetDid("Yönetim"), Owner = GetUid("user-fatma"), CreatedBy = GetUid("user-fatma"), Status = "in_progress", Priority = "urgent", Color = "#EC4899" }, GetUids("user-fatma", "user-melih")),
                ("proj-satis-raporlari", new Project { Name = "Satış Raporları", Description = "Aylık ve yıllık satış hedefleri.", DepartmentId = GetDid("Satış"), Owner = GetUid("user-elif"), CreatedBy = GetUid("user-elif"), Status = "done", Priority = "high", Color = "#8B5CF6" }, GetUids("user-elif", "user-melih")),
                ("proj-ik-surecleri", new Project { Name = "İK Süreçleri", Description = "İşe alım ve personel yönetimi.", DepartmentId = GetDid("İK"), Owner = GetUid("user-can"), CreatedBy = GetUid("user-can"), Status = "todo", Priority = "low", Color = "#14B8A6" }, GetUids("user-can", "user-melih")),
                ("proj-pazarlama-kampanya", new Project { Name = "Yaz Kampanyası", Description = "2026 Yaz sezonu reklam çalışmaları.", DepartmentId = GetDid("Pazarlama"), Owner = GetUid("user-selin"), CreatedBy = GetUid("user-selin"), Status = "working", Priority = "high", Color = "#EC4899" }, GetUids("user-selin", "user-melih")),
                ("proj-arge-v2", new Project { Name = "Mobile App v2", Description = "Yeni nesil mobil uygulama geliştirme.", DepartmentId = GetDid("ArGe"), Owner = GetUid("user-burak"), CreatedBy = GetUid("user-burak"), Status = "in_progress", Priority = "urgent", Color = "#6366F1" }, GetUids("user-burak", "user-melih")),
                ("proj-finans-butce", new Project { Name = "2026 Bütçe Planı", Description = "Yıllık bütçe dağılımı ve kontrolü.", DepartmentId = GetDid("Finans"), Owner = GetUid("user-zeynep"), CreatedBy = GetUid("user-zeynep"), Status = "review", Priority = "high", Color = "#10B981" }, GetUids("user-zeynep", "user-melih"))
            };

            foreach (var set in projectsData) 
            {
                set.Proj.Members = set.MemberIds.Select(uid => new ProjectMember { UserId = uid }).ToList();
                context.Projects.Add(set.Proj);
            }
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
            var taskList = new List<TaskItem>
            {
                // Stokbar
                new TaskItem { ProjectId=GetPid("proj-stokbar-main"), Title="Yıllık Stok Sayımı", Status="todo", Priority="urgent", AssignedBy=GetUid("user-melih"), Assignees=GetUids("user-mehmet").Select(u => new TaskAssignee { UserId = u }).ToList(), Labels=GetLids("lbl-acileyet").Select(l => new TaskLabel { LabelId = l }).ToList(), StartDate=DateTime.UtcNow.AddDays(-2), DueDate=DateTime.UtcNow.AddDays(5), Description="Tüm deponun sayılması gerekiyor." },
                new TaskItem { ProjectId=GetPid("proj-stokbar-main"), Title="Raf Düzenlemesi", Status="in_progress", Priority="medium", AssignedBy=GetUid("user-melih"), Assignees=GetUids("user-mehmet","user-melih").Select(u => new TaskAssignee { UserId = u }).ToList(), StartDate=DateTime.UtcNow.AddDays(-5), DueDate=DateTime.UtcNow.AddDays(2), Progress=50 },
                
                // Enroute
                new TaskItem { ProjectId=GetPid("proj-enroute-logs"), Title="Araç Bakımları", Status="todo", Priority="high", AssignedBy=GetUid("user-ahmet"), Assignees=GetUids("user-ahmet").Select(u => new TaskAssignee { UserId = u }).ToList(), StartDate=DateTime.UtcNow.AddDays(2), DueDate=DateTime.UtcNow.AddDays(10), Labels=GetLids("lbl-feature").Select(l => new TaskLabel { LabelId = l}).ToList() },

                // Quest
                new TaskItem { ProjectId=GetPid("proj-quest-qa"), Title="Bug Raporlama", Status="review", Priority="high", AssignedBy=GetUid("user-ayse"), Assignees=GetUids("user-ayse").Select(u => new TaskAssignee { UserId = u }).ToList(), Labels=GetLids("lbl-bug").Select(l => new TaskLabel { LabelId = l }).ToList(), StartDate=DateTime.UtcNow.AddDays(-1), DueDate=DateTime.UtcNow.AddDays(1) },

                // Management
                new TaskItem { ProjectId=GetPid("proj-yonetim-board"), Title="Bütçe Raporu", Status="review", Priority="high", AssignedBy=GetUid("user-fatma"), Assignees=GetUids("user-melih").Select(u => new TaskAssignee { UserId = u }).ToList(), Labels=GetLids("lbl-review").Select(l => new TaskLabel { LabelId = l }).ToList(), StartDate=DateTime.UtcNow.AddDays(-4) },

                // Marketing
                new TaskItem { ProjectId=GetPid("proj-pazarlama-kampanya"), Title="Sosyal Medya Planı", Status="in_progress", Priority="medium", AssignedBy=GetUid("user-selin"), Assignees=GetUids("user-selin").Select(u => new TaskAssignee { UserId = u }).ToList(), Labels=GetLids("lbl-design").Select(l => new TaskLabel { LabelId = l }).ToList() },

                // Arge
                new TaskItem { ProjectId=GetPid("proj-arge-v2"), Title="API Dokümantasyonu", Status="todo", Priority="medium", AssignedBy=GetUid("user-burak"), Assignees=GetUids("user-burak").Select(u => new TaskAssignee { UserId = u }).ToList(), Labels=GetLids("lbl-mobile").Select(l => new TaskLabel { LabelId = l }).ToList() },

                // Finance
                new TaskItem { ProjectId=GetPid("proj-finans-butce"), Title="Gider Analizi", Status="in_progress", Priority="high", AssignedBy=GetUid("user-zeynep"), Assignees=GetUids("user-zeynep").Select(u => new TaskAssignee { UserId = u }).ToList(), Labels=GetLids("lbl-finance").Select(l => new TaskLabel { LabelId = l }).ToList() }
            };

            context.Tasks.AddRange(taskList);
            context.SaveChanges();
        }
    }
}
