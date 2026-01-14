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
                .Property(u => u.DepartmentsJson)
                .HasColumnName("Departments");

            modelBuilder.Entity<Project>()
                .Property(u => u.MembersJson)
                .HasColumnName("Members");

            modelBuilder.Entity<TaskItem>()
                .Property(u => u.AssigneesJson)
                .HasColumnName("Assignees");

            modelBuilder.Entity<TaskItem>()
                .Property(u => u.LabelsJson)
                .HasColumnName("Labels");
            
            modelBuilder.Entity<TaskItem>()
                .Property(u => u.SubtasksJson)
                .HasColumnName("Subtasks");

            modelBuilder.Entity<TaskItem>()
                .Property(u => u.CommentsJson)
                .HasColumnName("Comments");

            modelBuilder.Entity<TaskItem>()
                .Property(u => u.AttachmentsJson)
                .HasColumnName("Attachments");
        }
    }
}
