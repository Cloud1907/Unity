using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Unity.Core.Helpers;

namespace Unity.Core.Models
{
    public class Label
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        public string Color { get; set; }
        

        public int? ProjectId { get; set; } 

        public DateTime CreatedAt { get; set; } = TimeHelper.Now;
    }
}
