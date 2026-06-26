using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using SecurityEventApi.Models;
using System.Text.Json;
using Microsoft.Extensions.Logging.Console;

var builder = WebApplication.CreateBuilder(args);

// Global JSON Policy (CamelCase)
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});

// Configure structured logging compatible with Google Cloud Logging
builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole(options =>
{
    options.IncludeScopes = true; // IMPORTANT for Advanced Observability scopes
    options.TimestampFormat = "yyyy-MM-ddTHH:mm:ss.fffZ";
    options.JsonWriterOptions = new JsonWriterOptions
    {
        Indented = false
    };
});

// Strict Validation
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// Developer Experience (API Explorer & Swagger)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Advanced Observability (Correlation ID / Request ID Middleware)
app.Use(async (context, next) =>
{
    // Check if headers exist, otherwise generate new ones
    var correlationId = context.Request.Headers["X-Correlation-ID"].FirstOrDefault() ?? Guid.NewGuid().ToString();
    var requestId = context.Request.Headers["X-Request-ID"].FirstOrDefault() ?? Guid.NewGuid().ToString();

    // Add them to the response headers
    context.Response.Headers["X-Correlation-ID"] = correlationId;
    context.Response.Headers["X-Request-ID"] = requestId;

    var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
    
    // Inject both IDs into the ILogger scope
    using (logger.BeginScope(new Dictionary<string, object>
    {
        ["CorrelationId"] = correlationId,
        ["RequestId"] = requestId
    }))
    {
        await next(context);
    }
});

// Exception handling middleware (RFC 7807)
app.UseExceptionHandler(exceptionHandlerApp =>
{
    exceptionHandlerApp.Run(async context =>
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/problem+json";

        var exceptionHandlerPathFeature = context.Features.Get<IExceptionHandlerPathFeature>();
        var exception = exceptionHandlerPathFeature?.Error;

        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogError(exception, "An unhandled exception occurred.");

        var problemDetails = new ProblemDetails
        {
            Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
            Title = "An error occurred while processing your request.",
            Status = StatusCodes.Status500InternalServerError,
            Detail = exception?.Message
        };

        await context.Response.WriteAsJsonAsync(problemDetails);
    });
});

// Serve static files from wwwroot
app.UseDefaultFiles();
app.UseStaticFiles();

// Enable Swagger UI
app.UseSwagger();
app.UseSwaggerUI();

// Cloud-Native Health Probes
app.MapGet("/health/live", () => Results.Ok())
    .WithName("GetHealthLive")
    .WithDescription("Liveness probe.");

app.MapGet("/health/ready", () => Results.Ok(new { Status = "Ready", Timestamp = DateTime.UtcNow }))
    .WithName("GetHealthReady")
    .WithDescription("Readiness probe.");

// Event ingestion endpoint
app.MapPost("/api/events", async (SecurityEvent securityEvent, IValidator<SecurityEvent> validator, ILogger<Program> logger) =>
{
    // Strict Validation via FluentValidation
    var validationResult = await validator.ValidateAsync(securityEvent);
    if (!validationResult.IsValid)
    {
        return Results.ValidationProblem(validationResult.ToDictionary());
    }

    // Enrich event
    securityEvent.EventId ??= Guid.NewGuid().ToString();
    securityEvent.Timestamp ??= DateTime.UtcNow;

    // Log the event ingestion (structured logging with scopes included)
    logger.LogInformation("Security event ingested: {EventId} [{EventType}] with severity {Severity} from {Source}", 
        securityEvent.EventId, securityEvent.EventType, securityEvent.Severity, securityEvent.Source);

    // In a real scenario, publish to Pub/Sub here.
    
    return Results.Created($"/api/events/{securityEvent.EventId}", securityEvent);
})
.WithName("IngestEvent")
.WithDescription("Ingests a new security event.");

// Fallback: serve index.html for unmatched routes
app.MapFallbackToFile("index.html");

app.Run();

// Required for Integration Testing Setup
public partial class Program { }
