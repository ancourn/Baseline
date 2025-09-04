#!/bin/bash

# Agentic AI System Deployment Script
# This script helps deploy the application using Docker Compose

set -e

echo "🚀 Starting Agentic AI System deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p data ssl

# Build and start the application
print_status "Building Docker image..."
docker-compose build --no-cache

print_status "Starting containers..."
docker-compose up -d

# Wait for the application to be healthy
print_status "Waiting for application to be healthy..."
timeout=60
while [ $timeout -gt 0 ]; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_status "Application is healthy!"
        break
    fi
    sleep 2
    timeout=$((timeout-2))
done

if [ $timeout -le 0 ]; then
    print_error "Application failed to become healthy within timeout period."
    docker-compose logs app
    exit 1
fi

# Run database setup if needed
print_status "Running database setup..."
docker-compose exec -T app npm run db:setup

# Display deployment information
print_status "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Information:"
echo "  🌐 Application URL: http://localhost:3000"
echo "  🔐 Health Check: http://localhost:3000/api/health"
echo "  📊 Logs: docker-compose logs -f"
echo ""
echo "👤 Demo Credentials:"
echo "  Email: admin@demo.com"
echo "  Password: demo123"
echo ""
echo "🛑 To stop the application: docker-compose down"
echo "🔄 To restart: docker-compose restart"
echo "📝 To view logs: docker-compose logs -f"
echo ""
print_status "Deployment finished successfully!"