using Unity.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// QuestPDF License Configuration (Community)
QuestPDF.Settings.License = LicenseType.Community;

// Windows Service support removed (IIS managed)



// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// Increase request size limits (for Base64 avatars)
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10485760; // 10MB
});
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 10485760; // 10MB
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Services
builder.Services.AddScoped<Unity.Infrastructure.Services.IEmailService, Unity.Infrastructure.Services.SmtpEmailService>();
builder.Services.AddScoped<Unity.API.Services.IEmailService, Unity.API.Services.EmailService>();
builder.Services.AddScoped<Unity.Infrastructure.Services.IAuditService, Unity.Infrastructure.Services.AuditService>();
builder.Services.AddScoped<Unity.Infrastructure.Services.IActivityLogger, Unity.Infrastructure.Services.ActivityLogger>(); // New Enhanced Logger
builder.Services.AddScoped<Unity.API.Services.IPdfService, Unity.API.Services.PdfService>();

// CORS for local development
builder.Services.AddCors(options =>
{
    var allowedOrigins = Environment.GetEnvironmentVariable("UNITY_ALLOWED_ORIGINS")?.Split(',', StringSplitOptions.RemoveEmptyEntries);

    options.AddPolicy("AllowAll",
        builder =>
        {
            if (allowedOrigins != null && allowedOrigins.Length > 0)
            {
                builder.WithOrigins(allowedOrigins)
                       .AllowAnyMethod()
                       .AllowAnyHeader()
                       .AllowCredentials();
            }
            else
            {
                builder.WithOrigins("http://localhost:3000", "http://localhost:3001", "capacitor://localhost", "http://localhost")
                    .AllowAnyMethod()
                    .AllowAnyHeader()
                    .AllowCredentials();
            }
        });
});

// Database Context (SQL Server)
// Priority: Environment Variable > appsettings.json
var connectionString = Environment.GetEnvironmentVariable("UNITY_CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrEmpty(connectionString))
{
    throw new InvalidOperationException(
        "Connection string not found! Set UNITY_CONNECTION_STRING environment variable or configure DefaultConnection in appsettings.json"
    );
}



builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

/* 
   Dynamic Key for Strict Security.
   This key is generated on startup. Restarting the server invalidates all tokens.
*/
// AppConfig.JwtKey initialized in AppConfig.cs

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(AppConfig.JwtKey),
        ValidateIssuer = false,
        ValidateAudience = false
    };
});

// SignalR
builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.PayloadSerializerOptions.PropertyNameCaseInsensitive = true;
    });

var app = builder.Build();

// ... existing code ...

// Serve Static Files (Frontend) FIRST so login page loads without auth
app.UseDefaultFiles();
app.UseStaticFiles();

// ... (uploads static files) ...

app.UseMiddleware<Unity.API.Middlewares.PerformanceLoggingMiddleware>();
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
// Register Hub
app.MapHub<Unity.API.Hubs.AppHub>("/appHub");

// SPA Fallback: Redirect 404s to index.html so React Router handles them
app.MapFallbackToFile("index.html");

// Auto-migrate on startup
try
{
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        var context = services.GetRequiredService<AppDbContext>();
        DbInitializer.Initialize(context);
    }
}
catch (Exception ex)
{
    Console.WriteLine($"CRITICAL ERROR DURING STARTUP: {ex.Message}");
    // We do not rethrow to allow the server to start and show the error in logs or UI if possible,
    // though for an API this might just result in a running app with no DB.
    // Better to let it fail, but we need to see WHY.
    // For now, suppression allows us to maybe see 200 OK on /api/health if we had one.
}

app.Run();
