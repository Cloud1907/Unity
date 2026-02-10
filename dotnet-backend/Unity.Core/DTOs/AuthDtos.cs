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
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public string? Color { get; set; }
        public int? Department { get; set; }
        public List<int>? Departments { get; set; }
        public string? JobTitle { get; set; }
        public string? Gender { get; set; }
        public string? ColumnPreferences { get; set; }
        public string? SidebarPreferences { get; set; }
        public List<WorkspacePreferenceDto>? WorkspacePreferences { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class WorkspacePreferenceDto
    {
        public int DepartmentId { get; set; }
        public int SortOrder { get; set; }
        public bool IsVisible { get; set; }
        public bool IsCollapsed { get; set; }
    }

    public class UpdateProfileRequest
    {
        public string? FullName { get; set; }
        public string? Avatar { get; set; }
        public string? Color { get; set; }
        public string? Gender { get; set; }
    }

    public class CreateUserRequest
    {
        public string? Username { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = "member";
        public List<int> Departments { get; set; } = new List<int>();
        public string? JobTitle { get; set; }
    }

    public class UpdatePreferencesRequest
    {
        /// <summary>
        /// JSON string with column visibility settings.
        /// Example: {"status":true,"priority":true,"tShirtSize":false}
        /// </summary>
        public string? ColumnPreferences { get; set; }

        /// <summary>
        /// JSON string with workspace order and visibility.
        /// Example: {"order":[1,16,58], "visibility":{"1":true, "16":false}}
        /// </summary>
        public string? SidebarPreferences { get; set; }

        /// <summary>
        /// Structured workspace preferences (replaces SidebarPreferences JSON).
        /// </summary>
        public List<WorkspacePreferenceDto>? WorkspacePreferences { get; set; }
    }

    public class MagicLoginRequest
    {
        public string Token { get; set; } = string.Empty;
    }

    public class MagicLoginResponse
    {
        public string AccessToken { get; set; } = string.Empty;
        public string TargetUrl { get; set; } = string.Empty;
        public UserDto User { get; set; } = new UserDto();
    }
}
