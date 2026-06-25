using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using SecurityEventApi.Models;
using Xunit;

namespace SecurityEventApi.Tests;

public class IntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public IntegrationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task HealthEndpoint_Returns200OK()
    {
        // Act
        var response = await _client.GetAsync("/health/live");

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task InvalidPayload_Returns400BadRequest()
    {
        // Arrange
        var invalidEvent = new
        {
            EventType = "", // Invalid: required
            Severity = "InvalidEnum",
            Source = "Test"
            // Payload missing
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/events", invalidEvent);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ValidEvent_Returns201Created()
    {
        // Arrange
        var payloadElement = JsonSerializer.Deserialize<JsonElement>("""{"key":"value"}""");
        
        var validEvent = new SecurityEvent
        {
            EventType = EventTypes.Authentication,
            Severity = EventSeverity.Medium,
            Source = "IntegrationTest",
            Payload = payloadElement
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/events", validEvent);

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        
        var returnedEvent = await response.Content.ReadFromJsonAsync<SecurityEvent>();
        Assert.NotNull(returnedEvent);
        Assert.NotNull(returnedEvent.EventId);
        Assert.NotNull(returnedEvent.Timestamp);
    }
}
