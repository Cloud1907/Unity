using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unity.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeparateSubtasksTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskAssignees_Tasks_TaskId",
                table: "TaskAssignees");

            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_Tasks_ParentTaskId",
                table: "Tasks");

            migrationBuilder.DropIndex(
                name: "IX_Tasks_ParentTaskId",
                table: "Tasks");

            migrationBuilder.DropPrimaryKey(
                name: "PK_TaskAssignees",
                table: "TaskAssignees");

            migrationBuilder.DropColumn(
                name: "ParentTaskId",
                table: "Tasks");

            migrationBuilder.AlterColumn<int>(
                name: "TaskId",
                table: "TaskAssignees",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<int>(
                name: "Id",
                table: "TaskAssignees",
                type: "int",
                nullable: false,
                defaultValue: 0)
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddColumn<int>(
                name: "SubtaskId",
                table: "TaskAssignees",
                type: "int",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_TaskAssignees",
                table: "TaskAssignees",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "Subtasks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DueDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TaskId = table.Column<int>(type: "int", nullable: false),
                    CreatedBy = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Subtasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Subtasks_Tasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "Tasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TaskAssignees_SubtaskId",
                table: "TaskAssignees",
                column: "SubtaskId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskAssignees_TaskId",
                table: "TaskAssignees",
                column: "TaskId");

            migrationBuilder.CreateIndex(
                name: "IX_Subtasks_TaskId",
                table: "Subtasks",
                column: "TaskId");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskAssignees_Subtasks_SubtaskId",
                table: "TaskAssignees",
                column: "SubtaskId",
                principalTable: "Subtasks",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskAssignees_Tasks_TaskId",
                table: "TaskAssignees",
                column: "TaskId",
                principalTable: "Tasks",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskAssignees_Subtasks_SubtaskId",
                table: "TaskAssignees");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskAssignees_Tasks_TaskId",
                table: "TaskAssignees");

            migrationBuilder.DropTable(
                name: "Subtasks");

            migrationBuilder.DropPrimaryKey(
                name: "PK_TaskAssignees",
                table: "TaskAssignees");

            migrationBuilder.DropIndex(
                name: "IX_TaskAssignees_SubtaskId",
                table: "TaskAssignees");

            migrationBuilder.DropIndex(
                name: "IX_TaskAssignees_TaskId",
                table: "TaskAssignees");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "TaskAssignees");

            migrationBuilder.DropColumn(
                name: "SubtaskId",
                table: "TaskAssignees");

            migrationBuilder.AddColumn<int>(
                name: "ParentTaskId",
                table: "Tasks",
                type: "int",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "TaskId",
                table: "TaskAssignees",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_TaskAssignees",
                table: "TaskAssignees",
                columns: new[] { "TaskId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_ParentTaskId",
                table: "Tasks",
                column: "ParentTaskId");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskAssignees_Tasks_TaskId",
                table: "TaskAssignees",
                column: "TaskId",
                principalTable: "Tasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_Tasks_ParentTaskId",
                table: "Tasks",
                column: "ParentTaskId",
                principalTable: "Tasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
