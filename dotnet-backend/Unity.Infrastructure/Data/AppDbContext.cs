using Microsoft.EntityFrameworkCore;
using Unity.Core.Models;

namespace Unity.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<TaskItem> Tasks { get; set; }
        public DbSet<Subtask> Subtasks { get; set; } // Restore Subtasks
        public DbSet<Label> Labels { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<ActivityLog> ActivityLogs { get; set; } // New Strict Logging Table

        public DbSet<Comment> Comments { get; set; }
        public DbSet<Attachment> Attachments { get; set; }
        public DbSet<MagicLink> MagicLinks { get; set; }
        
        // Join Tables
        public DbSet<TaskAssignee> TaskAssignees { get; set; }
        public DbSet<TaskLabel> TaskLabels { get; set; }
        public DbSet<ProjectMember> ProjectMembers { get; set; }
        public DbSet<UserDepartment> UserDepartments { get; set; }
        public DbSet<UserColumnPreference> UserColumnPreferences { get; set; }
        public DbSet<UserProjectPreference> UserProjectPreferences { get; set; }
        public DbSet<UserWorkspacePreference> UserWorkspacePreferences { get; set; }
        
        // SQL Views (Read-only)
        public DbSet<Unity.Core.Models.ViewModels.DashboardTaskView> DashboardTasksView { get; set; }
        public DbSet<Unity.Core.Models.ViewModels.ProjectViewItem> ProjectListViews { get; set; }
        public DbSet<Unity.Core.Models.ViewModels.UserDashboardStatsView> DashboardStatsView { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {

            base.OnModelCreating(modelBuilder);

            // Configure SQL View as keyless entity (read-only)
            modelBuilder.Entity<Unity.Core.Models.ViewModels.DashboardTaskView>()
                .HasNoKey()
                .ToView("vw_DashboardTasks");

            modelBuilder.Entity<Unity.Core.Models.ViewModels.ProjectViewItem>()
                .HasNoKey()
                .ToView("vw_ProjectList");

            modelBuilder.Entity<Unity.Core.Models.ViewModels.UserDashboardStatsView>()
                .HasNoKey()
                .ToView("vw_UserDashboardStats");

            // Global Query Filters for Soft Delete
            modelBuilder.Entity<Project>().HasQueryFilter(p => !p.IsDeleted);
            modelBuilder.Entity<Department>().HasQueryFilter(d => !d.IsDeleted);
            modelBuilder.Entity<TaskItem>().HasQueryFilter(t => !t.IsDeleted);


            // Enforce logic: TaskAssignee must have either TaskId OR SubtaskId (but not neither)
            // Note: EF Core Check Constraints
            modelBuilder.Entity<TaskAssignee>()
                .ToTable(t => t.HasCheckConstraint("CK_TaskAssignee_Target", "(\"TaskId\" IS NOT NULL OR \"SubtaskId\" IS NOT NULL)"));

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            /* 
             * REFACTORED: Removing Database Triggers for Audit Logging.
             * The application layer (AuditService) now handles detailed logging with user context.
             * This prevents duplicate "System/User" logs and database bloat.
             */
            // modelBuilder.Entity<User>().ToTable(tb => tb.HasTrigger("trg_Users_Audit"));
            // modelBuilder.Entity<Project>().ToTable(tb => tb.HasTrigger("trg_Projects_Audit"));
            // modelBuilder.Entity<TaskItem>().ToTable(tb => tb.HasTrigger("trg_Tasks_Audit"));
            // modelBuilder.Entity<Department>().ToTable(tb => tb.HasTrigger("trg_Departments_Audit"));
            // modelBuilder.Entity<Label>().ToTable(tb => tb.HasTrigger("trg_Labels_Audit"));

            // --- Configure Many-to-Many Relationships ---

            // TaskAssignee - Modified for "Polymorphic" usage
            modelBuilder.Entity<TaskAssignee>().HasKey(ta => ta.Id); // Switch to Surrogate Key
            
            modelBuilder.Entity<TaskAssignee>()
                .HasOne(ta => ta.User)
                .WithMany()
                .HasForeignKey(ta => ta.UserId);

            // Link to Tasks
            modelBuilder.Entity<TaskAssignee>()
                .HasOne(ta => ta.Task)
                .WithMany(t => t.Assignees)
                .HasForeignKey(ta => ta.TaskId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired(false);

            // Link to Subtasks
            modelBuilder.Entity<TaskAssignee>()
                .HasOne(ta => ta.Subtask)
                .WithMany(s => s.Assignees)
                .HasForeignKey(ta => ta.SubtaskId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired(false);

            // Task <-> Label
            modelBuilder.Entity<TaskLabel>()
                .HasKey(tl => new { tl.TaskId, tl.LabelId });
            modelBuilder.Entity<TaskLabel>()
                .HasOne(tl => tl.Task)
                .WithMany(t => t.Labels)
                .HasForeignKey(tl => tl.TaskId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<TaskLabel>()
                .HasOne(tl => tl.Label)
                .WithMany()
                .HasForeignKey(tl => tl.LabelId);

            // Project <-> User (Members)
            modelBuilder.Entity<ProjectMember>()
                .HasKey(pm => new { pm.ProjectId, pm.UserId });
            modelBuilder.Entity<ProjectMember>()
                .HasOne(pm => pm.Project)
                .WithMany(p => p.Members)
                .OnDelete(DeleteBehavior.Cascade)
                .HasForeignKey(pm => pm.ProjectId);
            modelBuilder.Entity<ProjectMember>()
                .HasOne(pm => pm.User)
                .WithMany()
                .HasForeignKey(pm => pm.UserId);


            // User <-> Department
            modelBuilder.Entity<UserDepartment>()
                .HasKey(ud => new { ud.UserId, ud.DepartmentId });
            modelBuilder.Entity<UserDepartment>()
                .HasOne(ud => ud.User)
                .WithMany(u => u.Departments)
                .HasForeignKey(ud => ud.UserId);
            modelBuilder.Entity<UserDepartment>()
                .HasOne(ud => ud.Department)
                .WithMany()
                .HasForeignKey(ud => ud.DepartmentId);

             // User <-> Project Preferences
            modelBuilder.Entity<UserProjectPreference>()
                .HasKey(upp => new { upp.UserId, upp.ProjectId });
            modelBuilder.Entity<UserProjectPreference>()
                .HasOne(upp => upp.User)
                .WithMany()
                .HasForeignKey(upp => upp.UserId);
             modelBuilder.Entity<UserProjectPreference>()
                .HasOne(upp => upp.Project)
                .WithMany()
                .HasForeignKey(upp => upp.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

             // User <-> Workspace Preferences (new structured table)
             modelBuilder.Entity<UserWorkspacePreference>()
                .HasKey(uwp => uwp.Id);
             
             modelBuilder.Entity<UserWorkspacePreference>()
                .HasIndex(uwp => uwp.UserId);
             
             modelBuilder.Entity<UserWorkspacePreference>()
                .HasIndex(uwp => new { uwp.UserId, uwp.DepartmentId })
                .IsUnique();
             
             modelBuilder.Entity<UserWorkspacePreference>()
                .HasOne(uwp => uwp.User)
                .WithMany()
                .HasForeignKey(uwp => uwp.UserId)
                .OnDelete(DeleteBehavior.Cascade);
             
             modelBuilder.Entity<UserWorkspacePreference>()
                .HasOne(uwp => uwp.Department)
                .WithMany()
                .HasForeignKey(uwp => uwp.DepartmentId)
                .OnDelete(DeleteBehavior.Cascade);

            // --- Performance Indexes ---
            modelBuilder.Entity<TaskItem>()
                .HasIndex(t => new { t.ProjectId, t.IsDeleted });

            modelBuilder.Entity<TaskItem>()
                .HasIndex(t => t.Status);

            modelBuilder.Entity<TaskAssignee>()
                .HasIndex(a => new { a.UserId, a.TaskId });

            // Magic Link Token Index for fast lookups
            modelBuilder.Entity<MagicLink>()
                .HasIndex(m => m.Token)
                .IsUnique();
        }
    }
}
