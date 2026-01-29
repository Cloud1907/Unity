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
        public DbSet<Label> Labels { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        public DbSet<Subtask> Subtasks { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<Attachment> Attachments { get; set; }
        
        // Join Tables
        public DbSet<TaskAssignee> TaskAssignees { get; set; }
        public DbSet<TaskLabel> TaskLabels { get; set; }
        public DbSet<ProjectMember> ProjectMembers { get; set; }
        public DbSet<UserDepartment> UserDepartments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<User>()
                .ToTable(tb => tb.HasTrigger("trg_Users_Audit"));

            modelBuilder.Entity<Project>()
                .ToTable(tb => tb.HasTrigger("trg_Projects_Audit"));

            modelBuilder.Entity<TaskItem>()
                .ToTable(tb => tb.HasTrigger("trg_Tasks_Audit"));


            






            modelBuilder.Entity<Department>()
                .ToTable(tb => tb.HasTrigger("trg_Departments_Audit"));

            modelBuilder.Entity<Label>()
                .ToTable(tb => tb.HasTrigger("trg_Labels_Audit"));

            // --- Configure Many-to-Many Relationships ---

            // Task <-> User (Assignees)
            modelBuilder.Entity<TaskAssignee>()
                .HasKey(ta => new { ta.TaskId, ta.UserId });
            modelBuilder.Entity<TaskAssignee>()
                .HasOne(ta => ta.Task)
                .WithMany(t => t.Assignees)
                .HasForeignKey(ta => ta.TaskId);
            modelBuilder.Entity<TaskAssignee>()
                .HasOne(ta => ta.User)
                .WithMany()
                .HasForeignKey(ta => ta.UserId);

            // Task <-> Label
            modelBuilder.Entity<TaskLabel>()
                .HasKey(tl => new { tl.TaskId, tl.LabelId });
            modelBuilder.Entity<TaskLabel>()
                .HasOne(tl => tl.Task)
                .WithMany(t => t.Labels)
                .HasForeignKey(tl => tl.TaskId);
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
        }
    }
}
