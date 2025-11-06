#!/usr/bin/env pwsh
# WageWatchers Quick Setup Script for Windows (PowerShell)
# Run with: .\setup.ps1

Write-Host "🚀 WageWatchers Setup Script" -ForegroundColor Cyan
Write-Host "============================`n" -ForegroundColor Cyan

# Check if Docker is installed
Write-Host "✓ Checking Docker installation..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "  Docker found!" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Docker not found. Please install Docker Desktop:" -ForegroundColor Red
    Write-Host "  https://www.docker.com/products/docker-desktop/`n" -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is available
Write-Host "✓ Checking Docker Compose..." -ForegroundColor Yellow
try {
    docker-compose --version | Out-Null
    Write-Host "  Docker Compose found!" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Docker Compose not found. Please update Docker Desktop.`n" -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
Write-Host "✓ Checking Node.js installation..." -ForegroundColor Yellow
try {
    node --version | Out-Null
    Write-Host "  Node.js found!" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Node.js not found. Please install Node.js 18+:" -ForegroundColor Red
    Write-Host "  https://nodejs.org/`n" -ForegroundColor Red
    exit 1
}

# Create .env file if it doesn't exist
Write-Host "`n✓ Setting up environment variables..." -ForegroundColor Yellow
if (!(Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "  Created .env file from .env.example" -ForegroundColor Green
    Write-Host "  ⚠️  Remember to update .env with your API keys!" -ForegroundColor Yellow
} else {
    Write-Host "  .env file already exists" -ForegroundColor Green
}

# Start Docker containers
Write-Host "`n✓ Starting Docker containers..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Containers started successfully!" -ForegroundColor Green
} else {
    Write-Host "  ❌ Failed to start containers. Check Docker Desktop.`n" -ForegroundColor Red
    exit 1
}

# Wait for database to be ready
Write-Host "`n✓ Waiting for database to be ready..." -ForegroundColor Yellow
$timeout = 30
$elapsed = 0
while ($elapsed -lt $timeout) {
    $health = docker inspect --format='{{.State.Health.Status}}' wagewatchers-postgres 2>$null
    if ($health -eq "healthy") {
        Write-Host "  Database is ready!" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 2
    $elapsed += 2
    Write-Host "  Waiting... ($elapsed/$timeout seconds)" -ForegroundColor Gray
}

if ($elapsed -ge $timeout) {
    Write-Host "  ⚠️  Database took longer than expected to start" -ForegroundColor Yellow
    Write-Host "  Check status with: docker-compose ps`n" -ForegroundColor Yellow
}

# Install dependencies
Write-Host "`n✓ Installing dependencies..." -ForegroundColor Yellow
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    pnpm install
} elseif (Get-Command npm -ErrorAction SilentlyContinue) {
    npm install
} else {
    Write-Host "  ❌ No package manager found (npm/pnpm)`n" -ForegroundColor Red
    exit 1
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Dependencies installed!" -ForegroundColor Green
}

# Push database schema
Write-Host "`n✓ Initializing database..." -ForegroundColor Yellow
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    pnpm run db:push
} else {
    npm run db:push
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Database schema created!" -ForegroundColor Green
}

# Setup complete
Write-Host "`n✅ Setup Complete!" -ForegroundColor Green
Write-Host "============================`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Create admin user:  npm run create-admin" -ForegroundColor White
Write-Host "2. Start dev server:   npm run dev" -ForegroundColor White
Write-Host "3. Visit:              http://localhost:3000`n" -ForegroundColor White

Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  npm run docker:logs    - View container logs" -ForegroundColor White
Write-Host "  npm run docker:down    - Stop containers" -ForegroundColor White
Write-Host "  npm run studio         - Open database GUI`n" -ForegroundColor White

Write-Host "📚 Documentation: docs/DOCKER_SETUP.md`n" -ForegroundColor Cyan
