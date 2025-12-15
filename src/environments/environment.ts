export const environment = {
  production: false,
  apiUrls: {
    // Using relative paths to go through Nginx reverse proxy
    smsTaxi: '/taxi-client/api',
    smsOut: '/sms-api',
    fleet: '/fleet-api/api',
    discovery: '/discovery',
    apiGateway: '/api-gateway'
  },
  // WebSocket endpoints through Nginx reverse proxy
  wsBaseUrl: '/fleet-ws',
  adminWsBaseUrl: '/fleet-admin-ws',
  appName: 'SMS Taxi Admin Dashboard',
  version: '1.0.0',
  googleMaps: {
    apiKey: 'AIzaSyDvdCzTY3fYbpV7mln70XSyOFTkVMk44Mo' // Replace with actual API key
  }
};
