using System.Threading.Tasks;
using Unity.Core.DTOs;

namespace Unity.API.Services
{
    public interface IGenerativeAIService
    {
        Task<string> GenerateWeeklyInsightAsync(UserWeeklyMetricsDto metrics);
    }
}
