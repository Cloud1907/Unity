namespace Unity.Core.Models
{
    public class TaskAssignee
    {
        public int TaskId { get; set; }
        
        [System.Text.Json.Serialization.JsonIgnore]
        public TaskItem? Task { get; set; }

        public int UserId { get; set; }
        public User? User { get; set; }
    }
}
