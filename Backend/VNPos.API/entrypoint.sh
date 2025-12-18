#!/bin/bash
set -e

echo "========================================"
echo "Waiting for SQL Server to be ready..."
echo "========================================"
sleep 15

echo "========================================"
echo "Running database migrations..."
echo "========================================"
cd /src/Backend/VNPos.API
dotnet ef database update --project ../VNPos.Infrastructure/VNPos.Infrastructure.csproj --startup-project ./VNPos.API.csproj --verbose || echo "Migration failed or already applied"

echo "========================================"
echo "Starting application..."
echo "========================================"
cd /app
exec dotnet VNPos.API.dll

