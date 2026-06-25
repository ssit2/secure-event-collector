# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["SecurityEventApi.csproj", "./"]
RUN dotnet restore "SecurityEventApi.csproj"
COPY . .
WORKDIR "/src/"
RUN dotnet build "SecurityEventApi.csproj" -c Release -o /app/build
RUN dotnet publish "SecurityEventApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS final
WORKDIR /app

# Run as non-root user for security
USER app

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "SecurityEventApi.dll"]
