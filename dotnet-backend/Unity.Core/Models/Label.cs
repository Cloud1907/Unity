using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Unity.Core.Models
{
    [Table("Labels")]
    public class Label
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        public string Color { get; set; } = "#cccccc";

        public int ProjectId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
