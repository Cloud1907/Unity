using Unity.Core.Models;
using System.Collections.Generic;

namespace Unity.API.Services
{
    public interface IPdfService
    {
        byte[] GenerateProjectStatusReport(Project project, List<TaskItem> tasks, List<User> users);
    }
}
