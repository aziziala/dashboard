#!/bin/bash

# Virtual Counter System Setup Script
# This script helps set up and test the virtual counter system

echo "🚗 Setting up Virtual Counter System for SMS Taxi App"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_header() {
    echo -e "${BLUE}[SETUP]${NC} $1"
}

# Check if running from the correct directory
if [ ! -f "setup_virtual_counter.sh" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_header "Checking Prerequisites..."

# Check if Java is installed
if ! command -v java &> /dev/null; then
    print_error "Java is not installed. Please install Java 11 or higher."
    exit 1
else
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
    print_status "Java version: $JAVA_VERSION"
fi

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    print_error "Maven is not installed. Please install Maven."
    exit 1
else
    MAVEN_VERSION=$(mvn -version | head -n 1 | cut -d' ' -f3)
    print_status "Maven version: $MAVEN_VERSION"
fi

# Check if Flutter is installed
if ! command -v flutter &> /dev/null; then
    print_error "Flutter is not installed. Please install Flutter."
    exit 1
else
    FLUTTER_VERSION=$(flutter --version | head -n 1 | cut -d' ' -f2)
    print_status "Flutter version: $FLUTTER_VERSION"
fi

print_header "Building Backend Services..."

# Build FleetService
cd backend_services/FleetService
print_status "Building FleetService..."

if mvn clean package -DskipTests; then
    print_status "FleetService built successfully"
else
    print_error "Failed to build FleetService"
    exit 1
fi

cd ../..

print_header "Building Flutter Apps..."

# Build Taxi App
print_status "Building Taxi App..."
cd taxi_app
if flutter pub get; then
    print_status "Taxi app dependencies installed"
else
    print_error "Failed to install taxi app dependencies"
    exit 1
fi

# Generate JSON serialization code
if flutter packages pub run build_runner build; then
    print_status "Taxi app JSON code generated"
else
    print_warning "Failed to generate JSON code (this is normal for first run)"
fi

cd ..

# Build Client App
print_status "Building Client App..."
cd client_app
if flutter pub get; then
    print_status "Client app dependencies installed"
else
    print_error "Failed to install client app dependencies"
    exit 1
fi

# Generate JSON serialization code
if flutter packages pub run build_runner build; then
    print_status "Client app JSON code generated"
else
    print_warning "Failed to generate JSON code (this is normal for first run)"
fi

cd ..

print_header "Database Setup..."

# Create database migration script
cat > backend_services/FleetService/src/main/resources/db/migration/V1__Create_Price_Counter_Table.sql << 'EOF'
-- Create price_counters table
CREATE TABLE IF NOT EXISTS price_counters (
    id BIGSERIAL PRIMARY KEY,
    offre_id BIGINT NOT NULL,
    taxi_id BIGINT NOT NULL,
    client_id BIGINT NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    distance_price DECIMAL(10,2) NOT NULL,
    time_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    distance_km DECIMAL(8,3) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    start_time TIMESTAMP NOT NULL,
    last_update TIMESTAMP NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    counter_status VARCHAR(50) NOT NULL DEFAULT 'STARTED',
    
    -- Indexes for better performance
    INDEX idx_offre_id (offre_id),
    INDEX idx_taxi_id (taxi_id),
    INDEX idx_client_id (client_id),
    INDEX idx_is_active (is_active),
    INDEX idx_counter_status (counter_status)
);

-- Add comments
COMMENT ON TABLE price_counters IS 'Stores real-time price counter information for taxi rides';
COMMENT ON COLUMN price_counters.offre_id IS 'Reference to the offer/ride';
COMMENT ON COLUMN price_counters.taxi_id IS 'Reference to the taxi driver';
COMMENT ON COLUMN price_counters.client_id IS 'Reference to the client';
COMMENT ON COLUMN price_counters.base_price IS 'Base fare amount';
COMMENT ON COLUMN price_counters.distance_price IS 'Price calculated from distance';
COMMENT ON COLUMN price_counters.time_price IS 'Price calculated from time';
COMMENT ON COLUMN price_counters.total_price IS 'Total calculated price';
COMMENT ON COLUMN price_counters.distance_km IS 'Current distance in kilometers';
COMMENT ON COLUMN price_counters.duration_minutes IS 'Current duration in minutes';
COMMENT ON COLUMN price_counters.start_time IS 'When the counter started';
COMMENT ON COLUMN price_counters.last_update IS 'Last update timestamp';
COMMENT ON COLUMN price_counters.is_active IS 'Whether the counter is currently active';
COMMENT ON COLUMN price_counters.counter_status IS 'Current status: STARTED, PAUSED, COMPLETED, CANCELLED';
EOF

print_status "Database migration script created"

print_header "Configuration Files..."

# Create application properties for FleetService
cat > backend_services/FleetService/src/main/resources/application-virtual-counter.yml << 'EOF'
# Virtual Counter Configuration
spring:
  application:
    name: fleet-service-virtual-counter
  
  # WebSocket Configuration
  websocket:
    allowed-origins: "*"
    max-text-message-size: 8192
    max-binary-message-size: 8192
  
  # Database Configuration
  datasource:
    url: jdbc:postgresql://localhost:5432/sms_taxi_db
    username: postgres
    password: password
    driver-class-name: org.postgresql.Driver
  
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
  
  # Logging Configuration
logging:
  level:
    com.youma.fleet.fleetservice: DEBUG
    org.springframework.web.socket: DEBUG
    org.springframework.messaging: DEBUG
  
# Virtual Counter Settings
virtual-counter:
  pricing:
    base-fare: 2.50
    per-km-rate: 0.80
    per-minute-rate: 0.15
  
  update-interval: 5000  # 5 seconds
  max-distance: 100.0    # Maximum distance in km
  max-duration: 180      # Maximum duration in minutes
EOF

print_status "Configuration files created"

print_header "Testing Setup..."

# Test WebSocket endpoint
print_status "Testing WebSocket connectivity..."
if command -v curl &> /dev/null; then
    # Start the service first
    print_warning "Please start the FleetService manually to test WebSocket connectivity"
    print_status "Use: cd backend_services/FleetService && mvn spring-boot:run"
else
    print_warning "curl not available - cannot test WebSocket connectivity"
fi

print_header "Demo Instructions..."

cat > VIRTUAL_COUNTER_DEMO_INSTRUCTIONS.md << 'EOF'
# Virtual Counter Demo Instructions

## Quick Start

### 1. Start Backend Service
```bash
cd backend_services/FleetService
mvn spring-boot:run
```

### 2. Test Taxi App
```bash
cd taxi_app
flutter run
```
The virtual counter will automatically appear when a driver finds a client.

### 3. Test Client App
```bash
cd client_app
flutter run
```
The virtual counter will automatically appear when a client finds a driver.

## Features

### Taxi App
- Automatic counter start when match found
- Pause/Resume functionality
- Complete/Cancel operations
- Real-time price updates
- Full counter controls

### Client App
- Automatic counter display when driver found
- View real-time price updates
- Track ride progress
- Status information display
- Read-only counter view

## WebSocket Testing

### Test Connection
```bash
# Test WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" http://localhost:8080/ws
```

### Test REST Endpoints
```bash
# Start counter
curl -X POST "http://localhost:8080/api/price-counter/start?offreId=123&taxiId=456&clientId=789&distanceKm=5.2&durationMinutes=15"

# Get counter status
curl "http://localhost:8080/api/price-counter/123"

# Update counter
curl -X POST "http://localhost:8080/api/price-counter/update?offreId=123&currentDistance=6.1&currentDuration=18"
```

## Troubleshooting

### Common Issues
1. **WebSocket Connection Failed**: Check if FleetService is running
2. **Price Not Updating**: Verify WebSocket subscription in browser dev tools
3. **Build Errors**: Run `flutter clean` and `flutter pub get`

### Logs
- Backend logs: Check FleetService console output
- Frontend logs: Check Flutter debug console
- WebSocket logs: Check browser Network tab

## Next Steps
1. Integrate with real GPS data
2. Add authentication and authorization
3. Implement error handling and retry logic
4. Add monitoring and analytics
EOF

print_status "Demo instructions created"

print_header "Setup Complete! 🎉"

echo ""
echo "Virtual Counter System has been set up successfully!"
echo ""
echo "Next steps:"
echo "1. Start the FleetService backend"
echo "2. Test the demo screens in both apps"
echo "3. Review the documentation in docs/VIRTUAL_COUNTER_IMPLEMENTATION.md"
echo "4. Check demo instructions in VIRTUAL_COUNTER_DEMO_INSTRUCTIONS.md"
echo ""
echo "Happy coding! 🚗💨"

# Make the script executable
chmod +x setup_virtual_counter.sh
