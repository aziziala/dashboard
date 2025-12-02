#!/bin/bash

# SMS Taxi Application Setup Script
# This script helps set up the development environment

echo "🚀 Setting up SMS Taxi Application..."

# Check if Flutter is installed
if ! command -v flutter &> /dev/null; then
    echo "❌ Flutter is not installed. Please install Flutter first."
    echo "Visit: https://flutter.dev/docs/get-started/install"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Setup Client App
echo "📱 Setting up Client App..."
cd client_app
flutter pub get
cd ..

# Setup Taxi App
echo "🚕 Setting up Taxi App..."
cd taxi_app
flutter pub get
cd ..

# Setup Backend Services
echo "🔧 Setting up Backend Services..."
cd backend_services

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found in backend_services directory"
    exit 1
fi

echo "🐳 Starting backend services with Docker Compose..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
echo "📊 Checking service status..."
docker-compose ps

cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📱 To run the Client App:"
echo "   cd client_app && flutter run"
echo ""
echo "🚕 To run the Taxi App:"
echo "   cd taxi_app && flutter run"
echo ""
echo "🔧 Backend services are running with Docker Compose"
echo "📊 Admin Dashboard: http://localhost:8080"
echo ""
echo "📚 For more information, check the docs/ directory" 