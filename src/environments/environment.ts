export const environment = {
  production: false,


  whatsappApiUrl: '/api',
  whatsappWsUrl: '/ws-chat',


  

  planificationWsUrl:'http://localhost:8577/ws',   // a modifer apres pour la prod 
  taxiApiUrl: 'http://localhost:8577',  // aussii ca c hard coded 

  

  /**
   * Dev: AuthService.login() can use mock user when true (see auth.service).
   * JWT for API calls: interceptor uses localStorage currentUser token, then
   * `devHardcodedBearerToken`, then localStorage key `DEV_GATEWAY_JWT`.
   */
  devBypassBackendAuth: false,

  devHardcodedBearerToken: '',

  apiUrls: {
    /** Proxied by ng serve / nginx → gateway :8444 (no browser CORS). */
    smsTaxi: '/taxi-client/api',

    smsClient: '/taxi-client/api',

    /** Proxied → :8777 (see `proxy.conf.js` `/public-8777`). */
    smsOut: '/public-8777/api',

    smsTaxidelete: '',

    /** Empty prefix so auth calls are `/jwt-authentication/...` on same origin. */
    smsAuth: '/jwt-authentication/api',

    taxiSelect: '/taxi-client/api',

    fleet: '/fleet-api',

    discovery: '/public-8777/discovery',

    apiGateway: '/public-8777/api-gateway',

    /** Proxied → :8666 `POST /api/sync-taxi-account/{phone}` (see `proxy.conf.js`). */
    jwtBackend: '/api/sync-taxi-account',

    taxiUpdateDirectAuth: '/taxi-direct-auth',

    taxiUpdateDirectTaxi: '/taxi-direct-taxi'
  },

  wsBaseUrl: '/fleet-api-base-url',

  adminWsBaseUrl: '/fleet-admin-ws-base-url',

  kannelEmbedBaseUrl: ''
};
