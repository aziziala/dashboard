#!/bin/bash

# SMS Taxi Application Structure Verification Script

echo "🔍 Verifying SMS Taxi Application Structure..."
echo ""

# Check main directories
echo "📁 Checking main directories:"
if [ -d "client_app" ]; then
    echo "✅ client_app/ - Found"
else
    echo "❌ client_app/ - Missing"
fi

if [ -d "taxi_app" ]; then
    echo "✅ taxi_app/ - Found"
else
    echo "❌ taxi_app/ - Missing"
fi

if [ -d "backend_services" ]; then
    echo "✅ backend_services/ - Found"
else
    echo "❌ backend_services/ - Missing"
fi

if [ -d "docs" ]; then
    echo "✅ docs/ - Found"
else
    echo "❌ docs/ - Missing"
fi

echo ""

# Check Flutter apps
echo "📱 Checking Flutter applications:"

# Client App
if [ -f "client_app/pubspec.yaml" ]; then
    echo "✅ client_app/pubspec.yaml - Found"
    if [ -d "client_app/lib" ]; then
        echo "✅ client_app/lib/ - Found"
    else
        echo "❌ client_app/lib/ - Missing"
    fi
else
    echo "❌ client_app/pubspec.yaml - Missing"
fi

# Taxi App
if [ -f "taxi_app/pubspec.yaml" ]; then
    echo "✅ taxi_app/pubspec.yaml - Found"
    if [ -d "taxi_app/lib" ]; then
        echo "✅ taxi_app/lib/ - Found"
    else
        echo "❌ taxi_app/lib/ - Missing"
    fi
else
    echo "❌ taxi_app/pubspec.yaml - Missing"
fi

echo ""

# Check Backend Services
echo "🔧 Checking Essential Backend Services:"

if [ -f "backend_services/docker-compose.yml" ]; then
    echo "✅ backend_services/docker-compose.yml - Found"
else
    echo "❌ backend_services/docker-compose.yml - Missing"
fi

# Check essential backend services
essential_services=("ConfigServiceApplication" "discovery-server" "gateways" "jwt" "ride-price-estimator-main" "sms-taxi" "SMSout" "spring-boot-upload-excel-files-master")
for service in "${essential_services[@]}"; do
    if [ -d "backend_services/$service" ]; then
        echo "✅ backend_services/$service/ - Found"
    else
        echo "❌ backend_services/$service/ - Missing"
    fi
done

echo ""

# Check documentation
echo "📚 Checking Documentation:"
if [ -f "docs/PROJECT_STRUCTURE.md" ]; then
    echo "✅ docs/PROJECT_STRUCTURE.md - Found"
else
    echo "❌ docs/PROJECT_STRUCTURE.md - Missing"
fi

if [ -f "README.md" ]; then
    echo "✅ README.md - Found"
else
    echo "❌ README.md - Missing"
fi

echo ""

# Check setup scripts
echo "🛠️ Checking Setup Scripts:"
if [ -f "setup.sh" ]; then
    echo "✅ setup.sh - Found"
else
    echo "❌ setup.sh - Missing"
fi

if [ -f "verify_structure.sh" ]; then
    echo "✅ verify_structure.sh - Found"
else
    echo "❌ verify_structure.sh - Missing"
fi

echo ""
echo "🎯 Structure verification completed!"
echo ""
echo "📋 Summary:"
echo "- Client App: Flutter application for passengers"
echo "- Taxi App: Flutter application for drivers"
echo "- Backend Services: Essential Spring Boot microservices"
echo "- Documentation: Project structure and guides"
echo ""
echo "🔧 Essential Backend Services:"
echo "- Config Service: Centralized configuration"
echo "- Discovery Service: Service registration"
echo "- API Gateway: Request routing"
echo "- JWT Service: Authentication"
echo "- SMS Taxi Service: Core business logic"
echo "- SMS Out Service: SMS functionality"
echo "- Price Estimator: Pricing calculations"
echo "- File Upload Service: File processing"
echo ""
echo "🚀 To get started, run: ./setup.sh" 