namespace Unity.Core.DTOs
{
    public class DepartmentCreateDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public List<int>? UserIds { get; set; }
        public InitialProjectDto? InitialProject { get; set; }
    }

    public class InitialProjectDto
    {
        public string Name { get; set; } = string.Empty;
        public string Icon { get; set; } = "Folder";
        public string Color { get; set; } = "#0086c0";
        public bool IsPrivate { get; set; } = false;
        public List<int>? MemberIds { get; set; }
    }
}
