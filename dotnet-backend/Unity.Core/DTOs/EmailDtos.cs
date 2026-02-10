using System;
using System.Collections.Generic;

namespace Unity.Core.DTOs
{
    public class EmailSubtaskDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime? StartDate { get; set; }
        public List<EmailAssigneeDto> Assignees { get; set; } = new List<EmailAssigneeDto>();
    }

    public class EmailAssigneeDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; }
        public string Initials { get; set; }
        public string ColorClass { get; set; } 
    }
}
