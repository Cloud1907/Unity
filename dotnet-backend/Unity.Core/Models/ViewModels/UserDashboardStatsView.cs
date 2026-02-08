namespace Unity.Core.Models.ViewModels
{
    public class UserDashboardStatsView
    {
        public int UserId { get; set; }
        public int TotalTasks { get; set; }
        public int TodoTasks { get; set; }
        public int InProgressTasks { get; set; }
        public int StuckTasks { get; set; }
        public int ReviewTasks { get; set; }
        public int DoneTasks { get; set; }
        public int OverdueTasks { get; set; }
        public double AverageProgress { get; set; }
    }
}
