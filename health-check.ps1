#!/usr/bin/env pwsh
# Docker Health Check Script
# Verifies all containers are running properly

Write-Host "`n🔍 WageWatchers Docker Health Check" -ForegroundColor Cyan
Write-Host "==================================`n" -ForegroundColor Cyan

$allHealthy = $true

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✓ Docker is running`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop.`n" -ForegroundColor Red
    exit 1
}

# Check PostgreSQL container
Write-Host "Checking PostgreSQL..." -ForegroundColor Yellow
$pgStatus = docker inspect --format='{{.State.Status}}' wagewatchers-postgres 2>$null
$pgHealth = docker inspect --format='{{.State.Health.Status}}' wagewatchers-postgres 2>$null

if ($pgStatus -eq "running") {
    if ($pgHealth -eq "healthy") {
        Write-Host "✓ PostgreSQL is running and healthy" -ForegroundColor Green

        # Test database connection
        $dbTest = docker exec wagewatchers-postgres pg_isready -U postgres 2>&1
        if ($dbTest -match "accepting connections") {
            Write-Host "✓ Database is accepting connections" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Database is not accepting connections" -ForegroundColor Yellow
            $allHealthy = $false
        }
    } else {
        Write-Host "⚠️  PostgreSQL is running but not healthy (status: $pgHealth)" -ForegroundColor Yellow
        $allHealthy = $false
    }
} else {
    Write-Host "❌ PostgreSQL is not running (status: $pgStatus)" -ForegroundColor Red
    $allHealthy = $false
}

# Check network connectivity
Write-Host "`nChecking network connectivity..." -ForegroundColor Yellow
$network = docker network inspect wagewatchers_default 2>$null
if ($network) {
    Write-Host "✓ Docker network is configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  Docker network not found" -ForegroundColor Yellow
    $allHealthy = $false
}

# Check volumes
Write-Host "`nChecking data volumes..." -ForegroundColor Yellow
$pgVolume = docker volume inspect wagewatchers_postgres_data 2>$null

if ($pgVolume) {
    Write-Host "✓ PostgreSQL data volume exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  PostgreSQL data volume not found" -ForegroundColor Yellow
}

# Summary
Write-Host "`n==================================`n" -ForegroundColor Cyan
if ($allHealthy) {
    Write-Host "✅ All systems operational!`n" -ForegroundColor Green
    Write-Host "You can start development with:" -ForegroundColor White
    Write-Host "  npm run dev`n" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Some issues detected.`n" -ForegroundColor Yellow
    Write-Host "Try these commands:" -ForegroundColor White
    Write-Host "  npm run docker:restart  - Restart containers" -ForegroundColor Cyan
    Write-Host "  npm run docker:logs     - View logs" -ForegroundColor Cyan
    Write-Host "  npm run docker:clean    - Reset everything (deletes data!)`n" -ForegroundColor Cyan
}

Write-Host "Container status:" -ForegroundColor White
docker-compose ps
