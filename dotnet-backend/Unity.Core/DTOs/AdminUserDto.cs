namespace Unity.Core.DTOs
{
    public class AdminUserDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Role { get; set; } = "member";
        public List<string> DepartmentNames { get; set; } = new List<string>();
        public string? Avatar { get; set; }
        public string? Color { get; set; }
        public string? JobTitle { get; set; }
    }
}
