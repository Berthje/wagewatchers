#!/usr/bin/env bash
set -euo pipefail

if [ -z "${APP_URL:-}" ] || [ -z "${CRON_SECRET:-}" ]; then
  echo "APP_URL and CRON_SECRET must be set" >&2
  exit 2
fi

status=$(curl -sS -X POST "$APP_URL/api/jobs/fetch-exchange-rates" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"source":"cron"}' \
  --retry 3 --retry-delay 5 --max-time 60 -w "%{http_code}" -o /dev/null)

if [ "$status" -ne 200 ]; then
  echo "fetch-exchange-rates failed: $status" >&2
  exit 1
fi

exit 0
