using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Unity.Core.Models
{
    public class TaskLabel
    {
        public int TaskId { get; set; }
        
        [System.Text.Json.Serialization.JsonIgnore]
        public TaskItem? Task { get; set; }

        public int LabelId { get; set; }
        public Label? Label { get; set; }
    }
}
