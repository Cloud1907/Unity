using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Collections.Generic;
using System.Linq;
using System;
using Unity.Core.Models;

namespace Unity.API.Services
{
    public class PdfService : IPdfService
    {
        public byte[] GenerateProjectStatusReport(Project project, List<TaskItem> tasks, List<User> users)
        {
            var validTasks = tasks.Where(t => t.StartDate.HasValue || t.DueDate.HasValue || t.CreatedAt != default).ToList();
            if (!validTasks.Any())
            {
                return Document.Create(container =>
                {
                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4);
                        page.Content().AlignCenter().Text("Bu projede henüz görev bulunmamaktadır.");
                    });
                }).GeneratePdf();
            }

            var minDate = validTasks.Min(t => t.StartDate ?? t.CreatedAt).Date;
            var maxDate = validTasks.Max(t => t.DueDate ?? t.CreatedAt).Date;
            
            if ((maxDate - minDate).Days < 30)
                maxDate = minDate.AddDays(30);

            minDate = minDate.AddDays(-3);
            maxDate = maxDate.AddDays(7);
            var totalDays = (maxDate - minDate).Days + 1;

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A2.Landscape());
                    page.Margin(1.5f, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Verdana));

                    page.Header().Element(c => ComposeHeader(c, project));
                    page.Content().Element(c => ComposeContent(c, project, tasks, users, minDate, maxDate, totalDays));
                    page.Footer().Element(ComposeFooter);
                });
            });

            return document.GeneratePdf();
        }

        void ComposeHeader(IContainer container, Project project)
        {
            container.Row(row =>
            {
                row.RelativeItem().Column(column =>
                {
                    column.Item().Text($"{project.Name}").FontSize(28).ExtraBold().FontColor(Colors.Indigo.Medium);
                    column.Item().Text("STRATEJİK PROJE PLANI VE ZAMAN ÇİZELGESİ").FontSize(14).SemiBold().FontColor(Colors.Grey.Medium);
                    column.Item().PaddingTop(5).Text(text =>
                    {
                        text.Span("Oluşturulma Tarihi: ").Bold();
                        text.Span($"{DateTime.Now:dd.MM.yyyy HH:mm}");
                    });
                });

                row.ConstantItem(150).Column(c => {
                    c.Item().AlignCenter().Text("UNITY").FontSize(32).Black().FontColor(Colors.Indigo.Lighten4);
                    c.Item().AlignCenter().Text("Professional Project Management").FontSize(8).FontColor(Colors.Grey.Lighten1);
                });
            });
        }

        void ComposeContent(IContainer container, Project project, List<TaskItem> tasks, List<User> users, DateTime minDate, DateTime maxDate, int totalDays)
        {
            container.PaddingVertical(20).Column(column =>
            {
                column.Spacing(20);

                column.Item().Row(row =>
                {
                    var completedCount = tasks.Count(t => t.Status == "done" || t.Status == "completed");
                    var progress = tasks.Count > 0 ? (int)((double)completedCount / tasks.Count * 100) : 0;

                    row.RelativeItem().Component(new StatComponent("TOPLAM GÖREV", tasks.Count.ToString()));
                    row.RelativeItem().Component(new StatComponent("TAMAMLANAN", completedCount.ToString()));
                    row.RelativeItem().Component(new StatComponent("GENEL İLERLEME", $"%{progress}"));
                    row.RelativeItem().Component(new StatComponent("EKİP BÜYÜKLÜĞÜ", users.Count.ToString()));
                });

                column.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(40);  // ID
                        columns.RelativeColumn(4);   // Görev Adı
                        columns.RelativeColumn(1.5f); // Durum
                        columns.RelativeColumn(2);   // Atanan Sorumlular
                        columns.RelativeColumn(12);  // Visual Timeline
                    });

                    table.Header(header =>
                    {
                        header.Cell().Element(HeaderStyle).AlignCenter().Text("#");
                        header.Cell().Element(HeaderStyle).Text("GÖREV DETAYI");
                        header.Cell().Element(HeaderStyle).AlignCenter().Text("DURUM");
                        header.Cell().Element(HeaderStyle).Text("SORUMLU");
                        header.Cell().Element(HeaderStyle).Column(col => {
                            col.Item().AlignCenter().Text("ZAMAN ÇİZELGESİ (STRATEJİK PLAN)").FontSize(9).Bold().FontColor(Colors.Indigo.Medium);
                            col.Item().Row(r => {
                                r.RelativeItem().AlignLeft().Text(minDate.ToString("dd MMM yyyy")).FontSize(8);
                                r.RelativeItem().AlignCenter().Text("ZAMANSAL DAĞILIM").FontSize(8).FontColor(Colors.Grey.Lighten1);
                                r.RelativeItem().AlignRight().Text(maxDate.ToString("dd MMM yyyy")).FontSize(8);
                            });
                        });

                        static IContainer HeaderStyle(IContainer container)
                        {
                            return container.DefaultTextStyle(x => x.SemiBold().FontSize(10)).PaddingVertical(10).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.Grey.Lighten4).PaddingHorizontal(5);
                        }
                    });

                    foreach (var task in tasks.OrderBy(t => t.StartDate ?? t.CreatedAt))
                    {
                        table.Cell().Element(RowStyle).AlignCenter().Text(task.Id.ToString()).FontSize(9);
                        table.Cell().Element(RowStyle).Column(c => {
                            c.Item().Text(task.Title).Bold();
                            if (!string.IsNullOrEmpty(task.Priority) && task.Priority != "medium")
                                c.Item().Text($"Öncelik: {TranslatePriority(task.Priority)}").FontSize(8).FontColor(GetPriorityColor(task.Priority));
                        });
                        
                        table.Cell().Element(RowStyle).AlignCenter().Component(new StatusBadgeComponent(TranslateStatus(task.Status), GetStatusColor(task.Status)));
                        table.Cell().Element(RowStyle).Text(GetAssigneeNames(task, users)).FontSize(8);
                        
                        table.Cell().Element(RowStyle).PaddingVertical(6).Element(c => DrawGanttBar(c, task, minDate, totalDays));

                        if (task.Subtasks != null && task.Subtasks.Any())
                        {
                            foreach (var subtask in task.Subtasks)
                            {
                                table.Cell().Element(SubRowStyle); 
                                table.Cell().Element(SubRowStyle).PaddingLeft(15).Row(r => {
                                    r.ConstantItem(10).PaddingTop(2).Text("└").FontSize(8).FontColor(Colors.Grey.Medium);
                                    r.RelativeItem().Text(subtask.Title).FontSize(9).Italic();
                                });
                                table.Cell().Element(SubRowStyle).AlignCenter().Text(subtask.IsCompleted ? "Tamamlandı" : "Bekliyor").FontSize(8).FontColor(subtask.IsCompleted ? Colors.Green.Medium : Colors.Grey.Medium);
                                table.Cell().Element(SubRowStyle); 
                                table.Cell().Element(SubRowStyle).PaddingVertical(2).Element(c => DrawSubtaskBar(c, subtask, task, minDate, totalDays));
                            }
                        }

                        static IContainer RowStyle(IContainer container)
                        {
                            return container.BorderBottom(1).BorderColor(Colors.Grey.Lighten3).PaddingVertical(6).PaddingHorizontal(5).AlignMiddle();
                        }

                        static IContainer SubRowStyle(IContainer container)
                        {
                            return container.PaddingVertical(2).PaddingHorizontal(5).AlignMiddle();
                        }
                    }
                });
            });
        }

        void DrawGanttBar(IContainer container, TaskItem task, DateTime minDate, int totalDays)
        {
            var start = task.StartDate ?? task.CreatedAt;
            var end = task.DueDate ?? start.AddDays(1);
            if (end < start) end = start.AddDays(1);
            
            var startOffset = (double)(start.Date - minDate.Date).Days;
            var duration = (double)(end.Date - start.Date).Days;
            if (duration < 1) duration = 1;
            
            var endOffset = totalDays - (startOffset + duration);

            container.PaddingVertical(2).Row(row =>
            {
                if (startOffset > 0)
                    row.RelativeItem((float)startOffset);
                
                row.RelativeItem((float)duration).Height(16).Background(GetStatusColor(task.Status)).AlignCenter().AlignMiddle().Text($"{task.Progress}%").FontSize(8).FontColor(Colors.White).Bold();
                
                if (endOffset > 0)
                    row.RelativeItem((float)endOffset);
            });
        }

        void DrawSubtaskBar(IContainer container, Subtask subtask, TaskItem parent, DateTime minDate, int totalDays)
        {
            var start = parent.StartDate ?? parent.CreatedAt;
            var end = parent.DueDate ?? start.AddDays(1);
            if (end < start) end = start.AddDays(1);
            
            var startOffset = (double)(start.Date - minDate.Date).Days;
            var duration = (double)(end.Date - start.Date).Days;
            if (duration < 1) duration = 1;
            
            var endOffset = totalDays - (startOffset + duration);

            container.Row(row =>
            {
                if (startOffset > 0)
                    row.RelativeItem((float)startOffset);
                
                row.RelativeItem((float)duration).Height(4).Background(subtask.IsCompleted ? Colors.Green.Lighten3 : Colors.Grey.Lighten3);
                
                if (endOffset > 0)
                    row.RelativeItem((float)endOffset);
            });
        }

        void ComposeFooter(IContainer container)
        {
            container.Column(column =>
            {
                column.Item().BorderTop(1).BorderColor(Colors.Grey.Lighten2).PaddingTop(10);
                column.Item().Row(row =>
                {
                    row.RelativeItem().Text("Tüm hakları saklıdır. Bu rapor UNITY sistemi üzerinden otomatik olarak üretilmiştir.").FontSize(9).FontColor(Colors.Grey.Medium);
                    row.RelativeItem().AlignRight().Text(x =>
                    {
                        x.Span("Plan Sayfası: ");
                        x.CurrentPageNumber();
                        x.Span(" / ");
                        x.TotalPages();
                    });
                });
            });
        }

        string TranslateStatus(string status)
        {
            if (string.IsNullOrEmpty(status)) return "Bekliyor";
            return status.ToLower() switch
            {
                "todo" => "Yapılacak",
                "working" => "Süreçte",
                "in_progress" => "Süreçte",
                "stuck" => "Takıldı",
                "review" => "İncelemede",
                "done" => "Tamamlandı",
                "completed" => "Tamamlandı",
                _ => status
            };
        }

        string TranslatePriority(string priority)
        {
            return (priority ?? "medium").ToLower() switch
            {
                "low" => "Düşük",
                "medium" => "Orta",
                "high" => "Yüksek",
                "urgent" => "Acil",
                _ => priority
            };
        }

        string GetStatusColor(string status)
        {
            if (string.IsNullOrEmpty(status)) return Colors.Grey.Medium;
            return status.ToLower() switch
            {
                "todo" => Colors.Grey.Lighten1,
                "working" => Colors.Blue.Medium,
                "in_progress" => Colors.Blue.Medium,
                "stuck" => Colors.Red.Medium,
                "review" => Colors.Indigo.Medium,
                "done" => Colors.Green.Medium,
                "completed" => Colors.Green.Medium,
                _ => Colors.Blue.Medium
            };
        }

        string GetPriorityColor(string priority)
        {
            return (priority ?? "medium").ToLower() switch
            {
                "high" => Colors.Orange.Medium,
                "urgent" => Colors.Red.Darken1,
                _ => Colors.Grey.Medium
            };
        }

        string GetAssigneeNames(TaskItem task, List<User> allUsers)
        {
            if (task.Assignees == null || !task.Assignees.Any()) return "-";
            var assigneeIds = task.Assignees.Select(a => a.UserId).ToList();
            var names = allUsers.Where(u => assigneeIds.Contains(u.Id)).Select(u => u.FullName).ToList();
            return names.Any() ? string.Join(", ", names) : "-";
        }
    }

    public class StatComponent : IComponent
    {
        public string Title { get; }
        public string Value { get; }

        public StatComponent(string title, string value)
        {
            Title = title;
            Value = value;
        }

        public void Compose(IContainer container)
        {
            container.Background(Colors.Grey.Lighten5).PaddingHorizontal(15).PaddingVertical(10).Column(column =>
            {
                column.Item().Text(Title).FontSize(9).SemiBold().FontColor(Colors.Grey.Medium);
                column.Item().Text(Value).FontSize(20).ExtraBold().FontColor(Colors.Indigo.Medium);
            });
        }
    }

    public class StatusBadgeComponent : IComponent
    {
        public string Label { get; }
        public string Color { get; }

        public StatusBadgeComponent(string label, string color)
        {
            Label = label;
            Color = color;
        }

        public void Compose(IContainer container)
        {
            container.MinWidth(80).Background(Color).PaddingVertical(3).AlignCenter().Text(Label).FontSize(8).FontColor(Colors.White).Bold();
        }
    }
}
