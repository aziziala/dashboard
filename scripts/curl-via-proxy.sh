#!/usr/bin/env bash
# Hit the Angular dev proxy (default port 5000) — same paths the browser uses (no CORS from file://).
set -euo pipefail
BASE="${1:-http://127.0.0.1:5000}"
echo "GET taxi list -> $BASE"
curl -sS -o /dev/null -w "HTTP %{http_code}\n" "$BASE/taxi-client/api/get-all-taxis?page=0&size=5"
echo "PATCH users-update (expect 401/403/400 without body — proves route proxied)"
curl -sS -o /dev/null -w "HTTP %{http_code}\n" -X PATCH \
  "$BASE/jwt-authentication/api/auth/users-update/1" \
  -H "Content-Type: application/json" \
  -d '{}'
