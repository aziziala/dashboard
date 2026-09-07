#!/usr/bin/env bash
# Smoke-test gateway at 41.225.11.231:8444 (no Angular; curl ignores CORS).
set -euo pipefail
G="${GATEWAY:-http://41.225.11.231:8444}"

echo "=== GET list (expect 200) ==="
curl -sS -o /dev/null -w "%{http_code}\n" "${G}/taxi-client/api/get-all-taxis?page=0&size=5"

echo "=== OPTIONS preflight direct to gateway (403 = Spring blocks; browser CORS if app calls :8444 cross-origin) ==="
curl -sS -o /dev/null -w "%{http_code}\n" -X OPTIONS "${G}/taxi-client/api/update-taxi/1" \
  -H "Origin: http://localhost:5000" \
  -H "Access-Control-Request-Method: PATCH" \
  -H "Access-Control-Request-Headers: authorization,content-type"

echo "=== PATCH users-update sample body (may be 400 validation; check JSON) ==="
curl -sS -w "\nHTTP %{http_code}\n" -X PATCH "${G}/jwt-authentication/api/auth/users-update/27392437" \
  -H "Content-Type: application/json" \
  -d '{"username":"x","email":"x@x.tn","phone":"12345678"}' | tail -3
