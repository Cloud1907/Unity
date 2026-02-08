using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unity.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveAuditTriggersV3 : Migration
    {
        /// <inheritdoc />
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Dropping legacy audit triggers to prevent duplicate logging
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS trg_Users_Audit");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS trg_Projects_Audit");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS trg_Tasks_Audit");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS trg_Departments_Audit");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS trg_Labels_Audit");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Re-creating triggers is not supported/needed in Down as we want to permanently remove them.
            // If rollback is needed, these would need to be restored via SQL script.
        }
    }
}
