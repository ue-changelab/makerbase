#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="$(dirname "$0")/../backend/.env"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Error: DATABASE_URL is not set."
  exit 1
fi

TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
BACKUPS_DIR="$(dirname "$0")/../backups"
OUTFILE="${BACKUPS_DIR}/makerbase-local-${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUPS_DIR"

echo "Starting backup..."
pg_dump "$DATABASE_URL" \
  --format=plain \
  --no-owner \
  --no-acl \
  | gzip > "$OUTFILE"

SIZE=$(ls -lh "$OUTFILE" | awk '{print $5}')
echo "Done. Saved: $OUTFILE ($SIZE)"