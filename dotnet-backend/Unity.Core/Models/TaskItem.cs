using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Unity.Core.Models
{
    [Table("Tasks")]
    public class TaskItem
    {
        [Key]
        public int Id { get; set; }

        public int ProjectId { get; set; }

        [Required]
        public string Title { get; set; }

        public string? Description { get; set; }

        public string AssigneesJson { get; set; } = "[]";
        [NotMapped]
        public List<int> Assignees 
        { 
            get => JsonSerializer.Deserialize<List<int>>(AssigneesJson ?? "[]") ?? new List<int>();
            set => AssigneesJson = JsonSerializer.Serialize(value);
        }

        public int AssignedBy { get; set; }
        public string Status { get; set; } = "todo"; // todo, working, review, done, stuck
        public string Priority { get; set; } = "medium";
        
        public string LabelsJson { get; set; } = "[]";
        [NotMapped]
        public List<int> Labels 
        { 
            get => JsonSerializer.Deserialize<List<int>>(LabelsJson ?? "[]") ?? new List<int>();
            set => LabelsJson = JsonSerializer.Serialize(value);
        }

        public bool IsPrivate { get; set; } = false;

        public string? TShirtSize { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public int Progress { get; set; } = 0;

        // Complex objects stored as JSON for simplicity in this migration
        public string SubtasksJson { get; set; } = "[]"; 
        
        // Helper wrapper could be added but for now simplistic approach
        // public List<Subtask> Subtasks ... 

        public string CommentsJson { get; set; } = "[]";
        public string AttachmentsJson { get; set; } = "[]";

        [NotMapped]
        public List<dynamic> Subtasks 
        { 
            get => JsonSerializer.Deserialize<List<dynamic>>(SubtasksJson ?? "[]") ?? new List<dynamic>();
             // Set not easily typed without concrete class, but needed for reading
        }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
