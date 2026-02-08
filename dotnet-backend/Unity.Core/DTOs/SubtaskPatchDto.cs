namespace Unity.Core.DTOs
{
    public class SubtaskPatchDto
    {
        public string? Title { get; set; }
        public bool? IsCompleted { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        // For assigning a user to a subtask (Single Assigne per subtask usually, or list?)
        // The frontend sends "assignees" array usually, or "assignee".
        // Let's support both to be safe but cleaner is List<int>.
        // Looking at Subtask model, it doesn't have direct Assignee column, it likely uses TaskAssignee with SubtaskId?
        // Let's check Subtask model or TaskAssignee.
        // Assuming TaskAssignee works for Subtasks too.
        public List<int>? Assignees { get; set; }
    }
}
