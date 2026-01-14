namespace Unity.Core.DTOs
{
    public class LoginRequest
    {
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string Password { get; set; } = string.Empty;
    }

    public class LoginResponse
    {
        public string AccessToken { get; set; } = string.Empty;
        public string TokenType { get; set; } = "bearer";
        public UserDto User { get; set; } = new UserDto();
    }

    public class UserDto
    {
        public string Id { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public string? Color { get; set; }
        public string? Department { get; set; }
        public List<string>? Departments { get; set; }
        public string? JobTitle { get; set; }
    }

    public class UpdateProfileRequest
    {
        public string? FullName { get; set; }
        public string? Avatar { get; set; }
        public string? Color { get; set; }
    }

    public class CreateUserRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = "member";
        public List<string> Departments { get; set; } = new List<string>();
        public string? JobTitle { get; set; }
    }
}
