using Unity.Core.DTOs;
using Unity.Core.Models;

namespace Unity.Core.Interfaces
{
    public interface IAuthService
    {
        Task<(UserDto? User, string? Token, string? Error)> LoginAsync(LoginRequest request);
        Task<(UserDto? User, string? Token, string? Error)> MagicLoginAsync(string token);
        Task<(UserDto? User, string? Error)> UpdateProfileAsync(int userId, UpdateProfileRequest request);
        Task<(string? Message, string? Error)> UpdatePreferencesAsync(int userId, UpdatePreferencesRequest request);
        Task<(string? Message, string? Error)> ChangePasswordAsync(int userId, ChangePasswordRequest request);
        Task<(string? Message, string? Error)> ForgotPasswordAsync(string identifier);
        Task<UserDto?> GetMeAsync(int userId);
    }
}
