using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unity.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCreatedByToLabels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                table: "Labels",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Labels");
        }
    }
}
