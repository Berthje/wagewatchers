#!/usr/bin/env bash
set -euo pipefail

period="${1:-daily}"

if [ -z "${APP_URL:-}" ] || [ -z "${CRON_SECRET:-}" ]; then
  echo "APP_URL and CRON_SECRET must be set" >&2
  exit 2
fi

status=$(curl -sS -X POST "$APP_URL/api/jobs/send-changelog?period=$period" \
  -H "Authorization: Bearer $CRON_SECRET" \
  --retry 3 --retry-delay 5 --max-time 60 -w "%{http_code}" -o /dev/null)

if [ "$status" -ne 200 ]; then
  echo "send-changelog ($period) failed: $status" >&2
  exit 1
fi

exit 0
