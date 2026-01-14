using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Unity.Core.Models
{
    [Table("Labels")]
    public class Label
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string Name { get; set; }

        public string Color { get; set; } = "#cccccc";

        public string ProjectId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
