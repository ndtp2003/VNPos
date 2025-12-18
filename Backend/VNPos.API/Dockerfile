FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

# Copy entire repository (build context must be project root)
COPY . .

# Restore dependencies and publish API
RUN dotnet restore ./Backend/VNPos.sln
RUN dotnet publish ./Backend/VNPos.API/VNPos.API.csproj -c Release -o /app/publish

# Use SDK image (not aspnet) for runtime to have dotnet-ef tool available
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS final

WORKDIR /app

# Copy published files
COPY --from=build /app/publish .

# Copy source code for EF migrations (needed by dotnet ef database update)
COPY --from=build /src /src

# Install EF Core tools globally
RUN dotnet tool install --global dotnet-ef --version 8.0.0

# Add dotnet tools to PATH
ENV PATH="$PATH:/root/.dotnet/tools"

# Copy entrypoint script
COPY Backend/VNPos.API/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Configure ASP.NET Core to listen on port 8080
ENV ASPNETCORE_URLS=http://+:8080

EXPOSE 8080

ENTRYPOINT ["/app/entrypoint.sh"]


