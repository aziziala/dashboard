# Virtual Counter & Real-Time Price Estimation System

## Overview

This document describes the implementation of a virtual counter system that provides real-time ride price estimation for both the taxi app and client app. The system uses WebSocket communication to ensure synchronized updates between applications.

## Architecture

### Backend Components (FleetService)

#### 1. Data Models

**PriceCounter Entity**
- `id`: Unique identifier
- `offreId`: Associated offer ID
- `taxiId`: Taxi driver ID
- `clientId`: Client ID
- `basePrice`: Base fare (2.50 TND)
- `distancePrice`: Price based on distance
- `timePrice`: Price based on time
- `totalPrice`: Total calculated price
- `distanceKm`: Current distance in kilometers
- `durationMinutes`: Current duration in minutes
- `startTime`: Counter start timestamp
- `lastUpdate`: Last update timestamp
- `isActive`: Whether counter is active
- `counterStatus`: Current status (STARTED, PAUSED, COMPLETED, CANCELLED)

**PriceCounterDto**
- Transfer object for API communication
- Includes real-time fields: `currentPrice`, `elapsedSeconds`, `currentDistance`

#### 2. Repository Layer

**PriceCounterRepository**
- `findActiveByOffreId()`: Find active counter by offer ID
- `findStartedByTaxiId()`: Find started counters by taxi ID
- `findActiveByClientId()`: Find active counters by client ID

#### 3. Service Layer

**PriceCounterService**
- **Pricing Logic**: Base fare + (distance × 0.80 TND/km) + (time × 0.15 TND/min)
- **Core Operations**:
  - `startCounter()`: Initialize new counter
  - `updateCounter()`: Update with current distance/time
  - `pauseCounter()`: Pause active counter
  - `resumeCounter()`: Resume paused counter
  - `completeCounter()`: Mark as completed
  - `cancelCounter()`: Mark as cancelled

#### 4. Controller Layer

**PriceCounterController**
- REST endpoints for counter management
- WebSocket message handlers for real-time communication
- CORS enabled for cross-origin requests

#### 5. WebSocket Configuration

**WebSocket Topics**
- `/topic/taxi/{taxiId}/price-update`: Taxi-specific updates
- `/topic/client/{clientId}/price-update`: Client-specific updates
- `/topic/offre/{offreId}/price-update`: General offer updates

### Frontend Components

#### Taxi App

**VirtualPriceCounter Widget**
- Real-time price display with pulse animation
- Distance, duration, and elapsed time tracking
- Control buttons: Pause, Resume, Complete, Cancel
- Automatic WebSocket connection and subscription
- Periodic price updates (every 5 seconds)

**PriceCounterWebSocketService**
- STOMP client for WebSocket communication
- Automatic reconnection handling
- Bidirectional communication with backend
- Stream-based price update notifications

#### Client App

**VirtualPriceCounter Widget**
- Read-only price display for clients
- Real-time price updates via WebSocket
- Status information and progress indicators
- Client-friendly interface design

**PriceCounterWebSocketService**
- Simplified service for client-side updates
- Automatic connection to price update streams
- Error handling and connection status

## Implementation Details

### Pricing Algorithm

```java
// Base fare
BigDecimal basePrice = new BigDecimal("2.50");

// Distance-based pricing (0.80 TND per km)
BigDecimal distancePrice = distanceKm.multiply(new BigDecimal("0.80"));

// Time-based pricing (0.15 TND per minute)
BigDecimal timePrice = new BigDecimal(durationMinutes).multiply(new BigDecimal("0.15"));

// Total price
BigDecimal totalPrice = basePrice.add(distancePrice).add(timePrice);
```

### WebSocket Communication Flow

1. **Connection**: Apps connect to `/ws` endpoint
2. **Subscription**: Subscribe to relevant topics
3. **Real-time Updates**: Receive price updates via WebSocket
4. **Bidirectional**: Taxi app can send control commands
5. **Automatic**: Connection management and error handling

### UI/UX Features

#### Taxi App
- **Color Scheme**: Blue gradient theme
- **Animations**: Pulse effect on price, slide-in entrance
- **Controls**: Full counter management (pause, resume, complete, cancel)
- **Real-time**: Live price updates and status changes

#### Client App
- **Color Scheme**: Green gradient theme
- **Animations**: Subtle pulse effect, smooth transitions
- **Information**: Clear price display and status updates
- **Progress**: Visual indicators for ride progress

## Integration Points

### Match Notification System

The virtual counter automatically starts when a new match is created:

```dart
// In MatchNotificationHandler
Future<void> handleNewMatch(Offre offre) async {
  // Show notification
  await _notificationService.showMatchNotification(...);
  
  // Start price counter
  await _startPriceCounter(offre);
}
```

### Automatic Counter Management

1. **Start**: Automatically starts when match is created
2. **Updates**: Periodic updates based on GPS/location data
3. **Completion**: Automatic completion when ride ends
4. **Cleanup**: Proper disposal of resources

## Configuration

### Backend Configuration

**application.yml**
```yaml
spring:
  websocket:
    allowed-origins: "*"
  jpa:
    hibernate:
      ddl-auto: update
```

**WebSocket Endpoints**
- `/ws`: Main WebSocket endpoint
- `/topic/*`: Message broker topics
- `/app/*`: Application message handlers

### Frontend Configuration

**WebSocket URLs**
- Development: `ws://localhost:8080/ws`
- Production: Update with actual backend URL

**Update Intervals**
- Price updates: Every 5 seconds
- Connection monitoring: Continuous
- UI animations: 2-second pulse cycle

## Error Handling

### Backend Error Handling
- Database transaction rollback on errors
- WebSocket connection error logging
- Graceful degradation for failed operations

### Frontend Error Handling
- WebSocket reconnection logic
- User-friendly error messages
- Fallback to REST API if WebSocket fails

## Integration

### Seamless UI Integration

The virtual counter is now fully integrated into the main app flow:
- **Taxi App**: Counter appears in the `DriverFoundWidget` when a match is found
- **Client App**: Counter appears in the `DriverFoundWidget` when a driver is found

### Automatic Counter Management

1. **Start**: Automatically starts when a driver/client match is found
2. **Updates**: Real-time price updates via WebSocket
3. **Completion**: Automatic completion when ride ends
4. **Cleanup**: Proper disposal of resources

### Test Scenarios
1. **Normal Flow**: Start → Update → Complete
2. **Pause/Resume**: Start → Pause → Resume → Complete
3. **Cancellation**: Start → Cancel
4. **Error Handling**: Network failures, invalid data

## Performance Considerations

### Backend Performance
- Database indexing on frequently queried fields
- WebSocket message batching for multiple updates
- Connection pooling for WebSocket clients

### Frontend Performance
- Efficient state management with minimal rebuilds
- Debounced WebSocket message handling
- Memory-efficient stream management

## Security Considerations

### WebSocket Security
- CORS configuration for cross-origin access
- Input validation for all counter operations
- Rate limiting for API endpoints

### Data Validation
- Price calculation validation
- Distance and time bounds checking
- User authorization for counter operations

## Deployment

### Backend Deployment
1. Build with Maven: `mvn clean package`
2. Deploy JAR file to server
3. Configure database connection
4. Set WebSocket endpoint URLs

### Frontend Deployment
1. Build Flutter apps: `flutter build apk/ios`
2. Update WebSocket URLs for production
3. Deploy to app stores or internal distribution

## Monitoring and Maintenance

### Logging
- WebSocket connection events
- Price calculation operations
- Error conditions and resolutions

### Metrics
- Active counter count
- WebSocket connection count
- Price update frequency
- Error rates

### Health Checks
- WebSocket endpoint availability
- Database connection status
- Service response times

## Future Enhancements

### Planned Features
1. **Dynamic Pricing**: Surge pricing during peak hours
2. **Multiple Currency Support**: Support for different currencies
3. **Advanced Analytics**: Detailed pricing analytics and reports
4. **Offline Support**: Local price calculation when offline

### Scalability Improvements
1. **Load Balancing**: Multiple WebSocket servers
2. **Caching**: Redis-based price caching
3. **Microservices**: Separate pricing service
4. **Event Streaming**: Kafka-based event processing

## Troubleshooting

### Common Issues

**WebSocket Connection Failed**
- Check backend service status
- Verify WebSocket endpoint URL
- Check network connectivity

**Price Not Updating**
- Verify WebSocket subscription
- Check counter status
- Review backend logs

**Counter Not Starting**
- Verify offer data validity
- Check database connection
- Review service logs

### Debug Commands

```bash
# Check WebSocket connections
netstat -an | grep :8080

# Monitor WebSocket traffic
tcpdump -i any port 8080

# Check application logs
tail -f fleet-service.log
```

## Conclusion

The virtual counter system provides a robust, real-time solution for ride price estimation. It ensures transparency for clients while giving taxi drivers full control over the pricing process. The WebSocket-based architecture ensures minimal latency and real-time synchronization between all parties involved in the ride.
