using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Unity.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ForceAddSaaSFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF COL_LENGTH('Users', 'BillingAddress') IS NULL ALTER TABLE Users ADD BillingAddress nvarchar(max) NULL;
                IF COL_LENGTH('Users', 'CompanyName') IS NULL ALTER TABLE Users ADD CompanyName nvarchar(max) NULL;
                IF COL_LENGTH('Users', 'StripeCustomerId') IS NULL ALTER TABLE Users ADD StripeCustomerId nvarchar(max) NULL;
                IF COL_LENGTH('Users', 'SubscriptionEndDate') IS NULL ALTER TABLE Users ADD SubscriptionEndDate datetime2 NULL;
                IF COL_LENGTH('Users', 'SubscriptionPlan') IS NULL ALTER TABLE Users ADD SubscriptionPlan nvarchar(max) NULL;
                IF COL_LENGTH('Users', 'TaxNumber') IS NULL ALTER TABLE Users ADD TaxNumber nvarchar(max) NULL;
                IF COL_LENGTH('Users', 'TaxOffice') IS NULL ALTER TABLE Users ADD TaxOffice nvarchar(max) NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
