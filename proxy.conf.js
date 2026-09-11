/**
 * Dev-server proxy only (never shipped to the browser). The app calls same-origin paths
 * like `/api/sync-taxi-account/...` and `/taxi-direct-auth/...`; Chrome shows them as
 * `http://<how-you-opened-the-app>:5000/...` — that host is your dashboard URL, not an API IP.
 *
 * Override targets without editing this file, e.g.:
 *   NG_PROXY_8777=http://internal-host:8777 npm start
 */
const gateway =
  process.env.NG_PROXY_GATEWAY || "http://41.225.11.231:8444";
const svc8666 = process.env.NG_PROXY_8666 || "http://192.168.2.2:8666";
const svc8443 = process.env.NG_PROXY_8443 || "http://192.168.2.2:8443";
const fleet8981 = process.env.NG_PROXY_8981 || "http://192.168.2.2:8981";
const public8777 = process.env.NG_PROXY_8777 || "http://192.168.2.2:8777";
const wschat8085 = process.env.NG_PROXY_8085 || "http://192.168.2.7:8085";

const wsplanif8577 = process.env.NG_PROXY_8577 || "http://192.168.2.7:8577";
const notification8443 =
  process.env.NG_PROXY_NOTIFICATION || "http://192.168.2.2:8443";
const common = { secure: false, changeOrigin: true, logLevel: "debug" };

module.exports = {
  "/public-8777": {
    ...common,
    target: public8777,
    pathRewrite: { "^/public-8777": "" },
  },
"/wsplanif8577": {
  ...common,
  target: wsplanif8577,
  ws: true,
  pathRewrite: { "^/wsplanif8577": "/ws" },
},

"/planif-api": {
  ...common,
  target: wsplanif8577,
  pathRewrite: { "^/planif-api": "" },
},

  "/fleet-api": {
    ...common,
    target: gateway,
  },
  "/fleet-api-base-url": {
    ...common,
    target: fleet8981,
    ws: true,
    pathRewrite: { "^/fleet-api-base-url": "/ws" },
  },
  "/fleet-admin-ws-base-url": {
    ...common,
    target: fleet8981,
    ws: true,
    pathRewrite: { "^/fleet-admin-ws-base-url": "/admin-ws" },
  },
  "/taxi-client/api": {
    ...common,
    target: gateway,
  },
  "/jwt-authentication/api": {
    ...common,
    target: gateway,
  },
  "/api/sync-taxi-account": {
    ...common,
    target: svc8666,
  },
  "/taxi-direct-auth": {
    ...common,
    target: svc8666,
    pathRewrite: { "^/taxi-direct-auth": "" },
  },
  "/taxi-direct-taxi": {
    ...common,
    target: svc8443,
    pathRewrite: { "^/taxi-direct-taxi": "" },
  },
  "/api/chat": {
  ...common,
  target: wschat8085,
},
"/api": {
  ...common,
  target: wschat8085,
},
"/ws-chat": {
  ...common,
  target: wschat8085,
  ws: true,
},

};
