namespace Unity.Core.Helpers
{
    /// <summary>
    /// Centralized time helper to ensure consistent timezone handling across the application.
    /// Turkey Standard Time (TRT) = UTC+3
    /// </summary>
    public static class TimeHelper
    {
        // Turkey Standard Time offset
        private static readonly TimeSpan TurkeyOffset = TimeSpan.FromHours(3);
        
        /// <summary>
        /// Gets the current time in Turkey timezone (UTC+3)
        /// Use this instead of DateTime.UtcNow or DateTime.Now
        /// </summary>
        public static DateTime Now => DateTime.UtcNow.Add(TurkeyOffset);

        /// <summary>
        /// Converts a UTC DateTime to Turkey timezone
        /// </summary>
        public static DateTime ToTurkeyTime(DateTime utcTime)
        {
            return utcTime.Add(TurkeyOffset);
        }

        /// <summary>
        /// Converts a Turkey timezone DateTime to UTC
        /// </summary>
        public static DateTime ToUtc(DateTime turkeyTime)
        {
            return turkeyTime.Subtract(TurkeyOffset);
        }

        /// <summary>
        /// Gets today's date in Turkey timezone
        /// </summary>
        public static DateTime Today => Now.Date;
    }
}
