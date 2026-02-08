using System.Diagnostics;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Unity.API.Middlewares
{
    public class PerformanceLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<PerformanceLoggingMiddleware> _logger;

        public PerformanceLoggingMiddleware(RequestDelegate next, ILogger<PerformanceLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task Invoke(HttpContext context)
        {
            var stopwatch = Stopwatch.StartNew();
            
            await _next(context);
            
            stopwatch.Stop();
            var elapsedMs = stopwatch.ElapsedMilliseconds;

            if (elapsedMs > 500) // Log only slow requests (>500ms)
            {
                _logger.LogWarning($"[SLOW REQUEST] {context.Request.Method} {context.Request.Path} took {elapsedMs}ms");
            }
            else
            {
                _logger.LogInformation($"[REQUEST] {context.Request.Method} {context.Request.Path} took {elapsedMs}ms");
            }
        }
    }
}
