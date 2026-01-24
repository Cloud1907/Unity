using Unity.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Windows Service support removed (IIS managed)

Console.WriteLine("🚀 STARTING UNITY API v1.10 (Controller Fixes)...");

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Services
builder.Services.AddScoped<Unity.Infrastructure.Services.IAuditService, Unity.Infrastructure.Services.AuditService>();

// CORS for local development
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
});

// Database Context (SQL Server)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
Console.WriteLine($"\n🔍 [DIAGNOSTIC] ACTIVE CONNECTION STRING: {connectionString}\n");

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

var app = builder.Build();

// ... existing code ...

// Serve Static Files (Frontend) FIRST so login page loads without auth
app.UseDefaultFiles();
app.UseStaticFiles();

// EXPLICIT UPLOADS SERVING (Fix for Avatar Issues)
var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
if (!Directory.Exists(uploadsPath)) 
{
    Directory.CreateDirectory(uploadsPath);
}
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

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
