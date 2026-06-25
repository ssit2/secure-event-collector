# Secure Event Collector API

## Project Overview

The **Secure Event Collector API** is a high-performance, cloud-native event ingestion API built with ASP.NET Core (.NET 8). This project is intended to serve as the entry point for ingesting arbitrary security events and pushing them downstream for analysis and storage. 

It demonstrates clean cloud engineering practices including Minimal APIs, structured logging designed for Google Cloud, robust exception handling, request validation, and strict containerization best practices.

## Architecture Overview

- **Application Layer**: .NET 8 ASP.NET Core Minimal APIs. The API accepts arbitrary JSON payloads along with mandatory metadata, automatically enriches the event with an ID and UTC Timestamp, and returns standard HTTP status codes.
- **Observability**: Logging is configured natively to output JSON format, allowing seamless ingestion into logging backends such as Google Cloud Logging without additional agents.
- **Containerization**: The API is containerized using a multi-stage Docker build, relying on the lightweight `aspnet:8.0-alpine` base image. The container strictly runs as a non-root user for improved security and reduced attack surface.

## Local Development

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)

### Running Locally
To run the project locally using the .NET CLI:
```bash
cd app
dotnet run
```
The API will be available at standard local ports (usually `http://localhost:5000` or `https://localhost:5001`).

### Testing the API

**Health Check**
```bash
curl -X GET http://localhost:5000/health
```

**Ingest Event**
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "EventType": "FailedLogin",
    "Severity": "High",
    "Source": "AuthService",
    "Payload": {
      "username": "admin",
      "ipAddress": "192.168.1.50"
    }
  }'
```

## Docker Build Instructions

To build the Docker container:
```bash
cd app
docker build -t secure-event-collector-api:latest .
```

To run the Docker container:
```bash
docker run -p 8080:8080 secure-event-collector-api:latest
```
The API will be accessible at `http://localhost:8080/`.

## Security Decisions

- **Minimal APIs**: Reduces unnecessary middleware and framework overhead.
- **RFC 7807 Problem Details**: Used for structured error reporting without leaking internal system details via standard exception stack traces.
- **Alpine Linux Base**: Minimal footprint container drastically reduces the number of OS packages, lowering the risk of vulnerabilities.
- **Non-root Execution**: The Docker container specifies `USER app`, preventing the process from running as `root` and restricting privileges in case of container escape.

## Future Roadmap

The following infrastructure components will be implemented to deploy this service to production:

- [ ] **Terraform**: Infrastructure as Code (IaC) to provision cloud resources reliably.
- [ ] **Cloud Run**: Deployment of the container to Google Cloud Run for serverless, autoscaling compute.
- [ ] **Artifact Registry**: Storing the built Docker images securely.
- [ ] **Pub/Sub**: Publishing ingested events asynchronously to a topic for downstream processing.
- [ ] **GitHub Actions**: CI/CD pipeline for building, testing, and deploying the application.
- [ ] **Monitoring**: Custom metrics and dashboards built around API ingestion rates and error responses.
- [ ] **Alerting**: Automated alerts based on specific security event severities or API health checks.
