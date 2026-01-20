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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<User>()
                .Property(u => u.DepartmentsJson);
            modelBuilder.Entity<User>()
                .ToTable(tb => tb.HasTrigger("trg_Users_Audit"));

            modelBuilder.Entity<Project>()
                .Property(u => u.MembersJson);
            modelBuilder.Entity<Project>()
                .ToTable(tb => tb.HasTrigger("trg_Projects_Audit"));

            modelBuilder.Entity<TaskItem>()
                .Property(u => u.AssigneesJson);
            modelBuilder.Entity<TaskItem>()
                .ToTable(tb => tb.HasTrigger("trg_Tasks_Audit"));

            modelBuilder.Entity<TaskItem>()
                .Property(u => u.LabelsJson);
            
            modelBuilder.Entity<TaskItem>()
                .Property(u => u.SubtasksJson);

            modelBuilder.Entity<TaskItem>()
                .Property(u => u.CommentsJson);

            modelBuilder.Entity<TaskItem>()
                .Property(u => u.AttachmentsJson);

            modelBuilder.Entity<Department>()
                .ToTable(tb => tb.HasTrigger("trg_Departments_Audit"));

            modelBuilder.Entity<Label>()
                .ToTable(tb => tb.HasTrigger("trg_Labels_Audit"));
        }
    }
}
