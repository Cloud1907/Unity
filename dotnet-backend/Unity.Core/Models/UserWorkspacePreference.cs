using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Unity.Core.Models
{
    /// <summary>
    /// Stores user-specific workspace (department) preferences including order, visibility, and collapse state.
    /// Each user can customize how workspaces appear in their sidebar.
    /// </summary>
    public class UserWorkspacePreference
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public int DepartmentId { get; set; }

        /// <summary>
        /// Sort order for this workspace in the user's sidebar (0-based index).
        /// Lower numbers appear first.
        /// </summary>
        [Required]
        public int SortOrder { get; set; } = 0;

        /// <summary>
        /// Whether this workspace is visible in the user's sidebar.
        /// Hidden workspaces don't appear at all.
        /// </summary>
        [Required]
        public bool IsVisible { get; set; } = true;

        /// <summary>
        /// Whether the workspace's projects are collapsed (hidden) in the sidebar.
        /// If true, only the workspace name is shown, not its projects.
        /// </summary>
        [Required]
        public bool IsCollapsed { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        [ForeignKey("UserId")]
        public virtual User User { get; set; }

        [ForeignKey("DepartmentId")]
        public virtual Department Department { get; set; }
    }
}
