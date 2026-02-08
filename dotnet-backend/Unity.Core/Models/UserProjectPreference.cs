using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Unity.Core.Models
{
    public class UserProjectPreference
    {
        public int UserId { get; set; }
        public User User { get; set; }

        public int ProjectId { get; set; }
        public Project Project { get; set; }

        public bool IsFavorite { get; set; } = false;
        
        // Potential for other per-user project settings (notifications, sort order, etc.)
    }
}
