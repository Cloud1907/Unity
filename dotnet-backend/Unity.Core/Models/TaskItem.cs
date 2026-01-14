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
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string? ProjectId { get; set; }

        [Required]
        public string Title { get; set; }

        public string? Description { get; set; }

        public string AssigneesJson { get; set; } = "[]";
        [NotMapped]
        public List<string> Assignees 
        { 
            get => JsonSerializer.Deserialize<List<string>>(AssigneesJson ?? "[]") ?? new List<string>();
            set => AssigneesJson = JsonSerializer.Serialize(value);
        }

        public string? AssignedBy { get; set; }
        public string Status { get; set; } = "todo"; // todo, working, review, done, stuck
        public string Priority { get; set; } = "medium";
        
        public string LabelsJson { get; set; } = "[]";
        [NotMapped]
        public List<string> Labels 
        { 
            get => JsonSerializer.Deserialize<List<string>>(LabelsJson ?? "[]") ?? new List<string>();
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
