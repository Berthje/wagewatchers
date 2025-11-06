#!/bin/bash
# WageWatchers Quick Setup Script for Unix (Mac/Linux)
# Run with: ./setup.sh

echo -e "\033[1;36m🚀 WageWatchers Setup Script\033[0m"
echo -e "\033[1;36m============================\n\033[0m"

# Check if Docker is installed
echo -e "\033[1;33m✓ Checking Docker installation...\033[0m"
if ! command -v docker &> /dev/null; then
    echo -e "\033[1;31m  ❌ Docker not found. Please install Docker Desktop:\033[0m"
    echo -e "\033[1;31m  https://www.docker.com/products/docker-desktop/\n\033[0m"
    exit 1
fi
echo -e "\033[1;32m  Docker found!\033[0m"

# Check if Docker Compose is available
echo -e "\033[1;33m✓ Checking Docker Compose...\033[0m"
if ! command -v docker-compose &> /dev/null; then
    echo -e "\033[1;31m  ❌ Docker Compose not found.\n\033[0m"
    exit 1
fi
echo -e "\033[1;32m  Docker Compose found!\033[0m"

# Check if Node.js is installed
echo -e "\033[1;33m✓ Checking Node.js installation...\033[0m"
if ! command -v node &> /dev/null; then
    echo -e "\033[1;31m  ❌ Node.js not found. Please install Node.js 18+:\033[0m"
    echo -e "\033[1;31m  https://nodejs.org/\n\033[0m"
    exit 1
fi
echo -e "\033[1;32m  Node.js found!\033[0m"

# Create .env file if it doesn't exist
echo -e "\n\033[1;33m✓ Setting up environment variables...\033[0m"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "\033[1;32m  Created .env file from .env.example\033[0m"
    echo -e "\033[1;33m  ⚠️  Remember to update .env with your API keys!\033[0m"
else
    echo -e "\033[1;32m  .env file already exists\033[0m"
fi

# Start Docker containers
echo -e "\n\033[1;33m✓ Starting Docker containers...\033[0m"
docker-compose up -d
if [ $? -eq 0 ]; then
    echo -e "\033[1;32m  Containers started successfully!\033[0m"
else
    echo -e "\033[1;31m  ❌ Failed to start containers.\n\033[0m"
    exit 1
fi

# Wait for database to be ready
echo -e "\n\033[1;33m✓ Waiting for database to be ready...\033[0m"
timeout=30
elapsed=0
while [ $elapsed -lt $timeout ]; do
    health=$(docker inspect --format='{{.State.Health.Status}}' wagewatchers-postgres 2>/dev/null)
    if [ "$health" = "healthy" ]; then
        echo -e "\033[1;32m  Database is ready!\033[0m"
        break
    fi
    sleep 2
    elapsed=$((elapsed + 2))
    echo -e "\033[0;37m  Waiting... ($elapsed/$timeout seconds)\033[0m"
done

if [ $elapsed -ge $timeout ]; then
    echo -e "\033[1;33m  ⚠️  Database took longer than expected to start\033[0m"
    echo -e "\033[1;33m  Check status with: docker-compose ps\n\033[0m"
fi

# Install dependencies
echo -e "\n\033[1;33m✓ Installing dependencies...\033[0m"
if command -v pnpm &> /dev/null; then
    pnpm install
elif command -v npm &> /dev/null; then
    npm install
else
    echo -e "\033[1;31m  ❌ No package manager found (npm/pnpm)\n\033[0m"
    exit 1
fi

if [ $? -eq 0 ]; then
    echo -e "\033[1;32m  Dependencies installed!\033[0m"
fi

# Push database schema
echo -e "\n\033[1;33m✓ Initializing database...\033[0m"
if command -v pnpm &> /dev/null; then
    pnpm run db:push
else
    npm run db:push
fi

if [ $? -eq 0 ]; then
    echo -e "\033[1;32m  Database schema created!\033[0m"
fi

# Setup complete
echo -e "\n\033[1;32m✅ Setup Complete!\033[0m"
echo -e "\033[1;36m============================\n\033[0m"

echo -e "\033[1;33mNext steps:\033[0m"
echo -e "\033[0;37m1. Create admin user:  npm run create-admin\033[0m"
echo -e "\033[0;37m2. Start dev server:   npm run dev\033[0m"
echo -e "\033[0;37m3. Visit:              http://localhost:3000\n\033[0m"

echo -e "\033[1;33mUseful commands:\033[0m"
echo -e "\033[0;37m  npm run docker:logs    - View container logs\033[0m"
echo -e "\033[0;37m  npm run docker:down    - Stop containers\033[0m"
echo -e "\033[0;37m  npm run studio         - Open database GUI\n\033[0m"

echo -e "\033[1;36m📚 Documentation: docs/DOCKER_SETUP.md\n\033[0m"
