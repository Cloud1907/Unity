namespace Unity.Core.DTOs
{
    public class AdminUserDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Role { get; set; } = "member";
        public List<string> DepartmentNames { get; set; } = new List<string>();
        public string? Avatar { get; set; }
        public string? Color { get; set; }
        public string? JobTitle { get; set; }

        // SaaS & Billing Fields
        public string? CompanyName { get; set; }
        public string? TaxOffice { get; set; }
        public string? TaxNumber { get; set; }
        public string? BillingAddress { get; set; }
        public string? StripeCustomerId { get; set; }
        public string? SubscriptionPlan { get; set; }
        public DateTime? SubscriptionEndDate { get; set; }
    }
}
