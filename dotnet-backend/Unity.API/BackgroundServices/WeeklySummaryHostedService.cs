using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Unity.Core.Helpers;

namespace Unity.API.BackgroundServices
{
    public class WeeklySummaryHostedService : BackgroundService
    {
        private readonly ILogger<WeeklySummaryHostedService> _logger;
        private readonly IServiceProvider _serviceProvider;
        
        // TEST MODE TOGGLE
        private readonly bool _isTestMode = false; 
        private readonly string[] _testTargetEmails = { "melih.bulut@univera.com.tr", "tunc.sahin@univera.com.tr" };

        public WeeklySummaryHostedService(ILogger<WeeklySummaryHostedService> logger, IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("WeeklySummaryHostedService is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                TimeSpan delay;

                if (_isTestMode)
                {
                    // For testing: Wait 1 minute
                    delay = TimeSpan.FromMinutes(1);
                    _logger.LogInformation($"[TEST MODE ACTIVE] Scheduled to run weekly summary in 1 minute at {TimeHelper.Now.Add(delay)} TRT.");
                }
                else
                {
                    // Production: Calculate time until next Friday 17:00 TRT
                    delay = CalculateDelayUntilNextFriday1700();
                    _logger.LogInformation($"Scheduled to run weekly summary at next Friday 17:00 TRT. Delay: {delay.TotalHours:F2} hours.");
                }

                // Wait until the scheduled time or until cancellation is requested
                try
                {
                    await Task.Delay(delay, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    // Expected when application shuts down
                    return;
                }

                if (stoppingToken.IsCancellationRequested) break;

                // Execute the job
                _logger.LogInformation("Time reached! Triggering Weekly Summary Job...");
                await TriggerJobAsync(stoppingToken);

                // If in test mode, we might only want to run it once to prevent spamming every minute.
                // However, BackgroundService 'while' loop continues. 
                // Let's break out of the loop in test mode so we don't spam emails every 1 minute infinitely.
                if (_isTestMode)
                {
                    _logger.LogInformation("[TEST MODE] Job executed once. Shutting down the scheduling loop to prevent spam.");
                    break; 
                }
            }
        }

        private async Task TriggerJobAsync(CancellationToken stoppingToken)
        {
            try
            {
                // We must create a scope because WeeklySummaryJob might be registered as Transient/Scoped 
                // and it depends on Scoped services like AppDbContext
                using var scope = _serviceProvider.CreateScope();
                var job = scope.ServiceProvider.GetRequiredService<WeeklySummaryJob>();
                
                if (_isTestMode)
                {
                    foreach (var email in _testTargetEmails)
                    {
                        if (stoppingToken.IsCancellationRequested) break;
                        _logger.LogInformation($"[TEST MODE] Triggering explicitly for: {email}");
                        await job.ProcessWeeklySummariesAsync(email, stoppingToken);
                    }
                }
                else
                {
                    // Production: Run for all active users
                    _logger.LogInformation("Triggering for all active users...");
                    await job.ProcessWeeklySummariesAsync(null, stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while executing Weekly Summary Job.");
            }
        }

        private TimeSpan CalculateDelayUntilNextFriday1700()
        {
            var now = TimeHelper.Now; // Returns TRT (UTC+3)
            
            // Start at today 17:00:00
            DateTime nextRun = new DateTime(now.Year, now.Month, now.Day, 17, 0, 0, DateTimeKind.Unspecified);
            
            // Calculate days to add to get to Friday
            int daysToAdd = ((int)DayOfWeek.Friday - (int)now.DayOfWeek + 7) % 7;
            
            // If it is Friday today, but past 17:00, move to next Friday
            if (daysToAdd == 0 && now.TimeOfDay >= new TimeSpan(17, 0, 0))
            {
                daysToAdd = 7;
            }
            
            nextRun = nextRun.AddDays(daysToAdd);
            
            return nextRun - now;
        }
    }
}
