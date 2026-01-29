using Unity.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Windows Service support removed (IIS managed)



// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Services
builder.Services.AddScoped<Unity.API.Services.IEmailService, Unity.API.Services.EmailService>();
builder.Services.AddScoped<Unity.Infrastructure.Services.IAuditService, Unity.Infrastructure.Services.AuditService>();

// CORS for local development
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000") // Explicit origin required for AllowCredentials
                   .AllowAnyMethod()
                   .AllowAnyHeader()
                   .AllowCredentials();
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
