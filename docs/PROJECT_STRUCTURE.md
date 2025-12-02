# Project Structure Documentation

## Overview

This document provides a detailed breakdown of the SMS Taxi Application project structure, explaining the purpose and organization of each component.

## Directory Structure

```
combined_sms_app/
├── client_app/                    # Flutter client application (for passengers)
│   ├── lib/                      # Dart source code
│   ├── android/                  # Android-specific configuration
│   ├── ios/                      # iOS-specific configuration
│   ├── assets/                   # Static assets (images, fonts, etc.)
│   ├── test/                     # Unit and widget tests
│   ├── pubspec.yaml             # Flutter dependencies
│   └── README.md                # Client app documentation
│
├── taxi_app/                     # Flutter taxi application (for drivers)
│   ├── lib/                      # Dart source code
│   ├── android/                  # Android-specific configuration
│   ├── ios/                      # iOS-specific configuration
│   ├── assets/                   # Static assets (images, fonts, etc.)
│   ├── test/                     # Unit and widget tests
│   ├── pubspec.yaml             # Flutter dependencies
│   └── README.md                # Taxi app documentation
│
├── backend_services/             # Essential backend microservices
│   ├── ConfigServiceApplication/ # Configuration service
│   ├── discovery-server/        # Service discovery (Eureka)
│   ├── gateways/                # API Gateway service
│   ├── jwt/                     # JWT authentication service
│   ├── ride-price-estimator-main/ # Price calculation service
│   ├── sms-taxi/                # Core SMS taxi service
│   ├── SMSout/                  # SMS output service
│   ├── spring-boot-upload-excel-files-master/ # File upload service
│   └── docker-compose.yml       # Docker orchestration
│
├── docs/                        # Project documentation
│   ├── PROJECT_STRUCTURE.md     # This file
│   ├── API_DOCUMENTATION.md     # API documentation
│   └── DEPLOYMENT_GUIDE.md      # Deployment instructions
│
├── setup.sh                     # Automated setup script
├── verify_structure.sh          # Structure verification script
├── README.md                    # Main project README
└── .gitignore                   # Git ignore rules
```

## Component Details

### Client Application (`client_app/`)

The Flutter client application provides the passenger interface for users to:
- Register and authenticate
- Book taxis via SMS
- Track rides in real-time
- Make payments
- View ride history

**Key Files:**
- `lib/main.dart`: Application entry point
- `lib/screens/`: UI screens
- `lib/services/`: Business logic and API calls
- `lib/models/`: Data models
- `pubspec.yaml`: Dependencies and configuration

### Taxi Application (`taxi_app/`)

The Flutter taxi application provides the driver interface for:
- Driver registration and authentication
- Accept/reject ride requests
- Navigate to pickup and destination
- Track earnings
- Manage availability status

**Key Files:**
- `lib/main.dart`: Application entry point
- `lib/screens/`: UI screens
- `lib/services/`: Business logic and API calls
- `lib/models/`: Data models
- `pubspec.yaml`: Dependencies and configuration

### Backend Services (`backend_services/`)

#### Core Services

1. **ConfigServiceApplication/**
   - Centralized configuration management
   - Environment-specific configurations
   - Service configuration distribution

2. **discovery-server/**
   - Service discovery using Eureka
   - Load balancing
   - Service registration and health monitoring

3. **gateways/**
   - API Gateway for routing requests
   - Authentication and authorization
   - Rate limiting and security

4. **jwt/**
   - JWT token generation and validation
   - User authentication
   - Session management

5. **sms-taxi/**
   - Core SMS taxi business logic
   - Ride management
   - SMS processing and routing

6. **SMSout/**
   - SMS sending functionality
   - Message formatting
   - Delivery tracking

#### Supporting Services

7. **ride-price-estimator-main/**
   - Price calculation algorithms
   - Distance and time calculations
   - Dynamic pricing rules

8. **spring-boot-upload-excel-files-master/**
   - File upload functionality
   - Excel file processing
   - Data import/export capabilities

### Documentation (`docs/`)

- **PROJECT_STRUCTURE.md**: This file - detailed structure explanation
- **API_DOCUMENTATION.md**: API endpoints and usage
- **DEPLOYMENT_GUIDE.md**: Deployment instructions and configuration

## Architecture Overview

The system follows a microservices architecture with:

1. **Frontend Applications**: 
   - Flutter client app (passengers)
   - Flutter taxi app (drivers)
2. **API Gateway**: Central entry point for all requests
3. **Service Discovery**: Eureka for service registration
4. **Configuration Service**: Centralized configuration management
5. **Core Services**: Essential business logic services
6. **Supporting Services**: File upload and price estimation
7. **Message Queue**: RabbitMQ for asynchronous communication

## Technology Stack

- **Mobile Applications**: Flutter/Dart
- **Backend**: Spring Boot (Java)
- **Service Discovery**: Eureka
- **API Gateway**: Spring Cloud Gateway
- **Configuration**: Spring Cloud Config
- **Authentication**: JWT
- **Message Queue**: RabbitMQ
- **Containerization**: Docker
- **Orchestration**: Docker Compose

## Development Workflow

1. **Local Development**: Each service can be developed independently
2. **Testing**: Unit tests for each service
3. **Integration**: Docker Compose for local integration testing
4. **Deployment**: Containerized deployment to production
5. **Configuration**: Centralized configuration management

## Security Considerations

- JWT-based authentication
- API Gateway security
- Service-to-service authentication
- Data encryption
- Input validation
- Rate limiting

## Repository Sources

- **Backend Services**: https://github.com/aziziala/PFE (prod branch)
- **Taxi App**: https://github.com/aziziala/sms_taxi_app (flutter-ios branch)
- **Client App**: https://github.com/aziziala/sms_client_app (Version_1.0 branch)

## Service Ports

- **Discovery Service**: 8761
- **Config Service**: 8888
- **JWT Service**: 8666
- **API Gateway**: 8444
- **SMS Taxi Service**: 8084
- **SMS Out Service**: 8091
- **Price Estimator**: 9090
- **File Upload Service**: 8080
- **RabbitMQ**: 5672 (AMQP), 15672 (Management UI) 