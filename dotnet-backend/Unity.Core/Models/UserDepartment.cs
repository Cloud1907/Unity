namespace Unity.Core.Models
{
    public class UserDepartment
    {
        public int UserId { get; set; }
        
        [System.Text.Json.Serialization.JsonIgnore]
        public User? User { get; set; }

        public int DepartmentId { get; set; }
        
        [System.Text.Json.Serialization.JsonIgnore]
        public Department? Department { get; set; }
    }
}
