using System.Text.Json;
using System.Text.Json.Serialization;

namespace SecurityEventApi.Models;

/// <summary>
/// Defines standard security event types.
/// </summary>
public static class EventTypes
{
    public const string Authentication = "Authentication";
    public const string Firewall = "Firewall";
    public const string Api = "Api";
}

/// <summary>
/// Defines severity levels for security events.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EventSeverity
{
    Low,
    Medium,
    High,
    Critical
}

/// <summary>
/// Represents a security event ingested into the system.
/// </summary>
public record SecurityEvent
{
    /// <summary>
    /// Unique identifier for the event. Auto-generated if not provided.
    /// </summary>
    public string? EventId { get; set; }

    /// <summary>
    /// The type of the security event (e.g., "Authentication", "Firewall").
    /// </summary>
    public required string EventType { get; set; }

    /// <summary>
    /// The severity level of the event.
    /// </summary>
    public required EventSeverity Severity { get; set; }

    /// <summary>
    /// The source system or service originating the event.
    /// </summary>
    public required string Source { get; set; }

    /// <summary>
    /// The UTC timestamp of the event. Auto-populated upon ingestion if null.
    /// </summary>
    public DateTime? Timestamp { get; set; }

    /// <summary>
    /// Arbitrary JSON payload containing event-specific data.
    /// </summary>
    public required JsonElement Payload { get; set; }
}
