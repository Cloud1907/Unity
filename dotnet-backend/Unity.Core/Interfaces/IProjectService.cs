using Unity.Core.Models;

namespace Unity.Core.Interfaces
{
    public interface IProjectService
    {
        Task<IEnumerable<dynamic>> GetProjectsAsync(int userId, string role, List<int> departmentIds);
        Task<Project?> GetProjectByIdAsync(int id, int userId, string role, List<int> departmentIds);
        Task<Project> CreateProjectAsync(Project project, int userId, string role, List<UserDepartment> departments);
        Task<Project?> UpdateProjectAsync(int id, Project project, int userId, string role, List<int> departmentIds);
        Task<bool> DeleteProjectAsync(int id, int userId, string role);
        Task<Project?> ToggleFavoriteAsync(int id, int userId, string role, List<int> departmentIds);
    }
}
