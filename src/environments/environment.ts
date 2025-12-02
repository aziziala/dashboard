export const environment = {
  production: false,
  apiUrls: {
    smsTaxi: 'http://localhost:8084/api',
    smsOut: 'http://localhost:8091/api',
    fleet: 'http://192.168.100.134:8981/api',
    discovery: 'http://localhost:8761',
    apiGateway: 'http://localhost:8444'
  },
  // WebSocket endpoints for fleet-service on 192.168.100.134:8981
  wsBaseUrl: 'http://192.168.100.134:8981/ws',
  adminWsBaseUrl: 'http://192.168.100.134:8981/admin-ws',
  appName: 'SMS Taxi Admin Dashboard',
  version: '1.0.0',
  googleMaps: {
    apiKey: 'AIzaSyDvdCzTY3fYbpV7mln70XSyOFTkVMk44Mo' // Replace with actual API key
  }
};
