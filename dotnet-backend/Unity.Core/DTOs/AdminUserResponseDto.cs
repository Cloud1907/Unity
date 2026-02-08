using System.Collections.Generic;

namespace Unity.Core.DTOs
{
    public class AdminUserResponseDto
    {
        public List<AdminUserDto> Users { get; set; } = new List<AdminUserDto>();
        public int TotalUsers { get; set; }
        public int AdminCount { get; set; }
        public int MemberCount { get; set; }
    }
}
