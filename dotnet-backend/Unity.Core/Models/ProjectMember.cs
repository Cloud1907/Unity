namespace Unity.Core.Models
{
    public class ProjectMember
    {
        public int ProjectId { get; set; }
        
        [System.Text.Json.Serialization.JsonIgnore]
        public Project Project { get; set; }

        public int UserId { get; set; }
        public User User { get; set; }
    }
}
