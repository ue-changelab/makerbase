#!/usr/bin/env bash
set -euo pipefail

BACKUP_FILE="${1:-}"
TARGET_DB="${2:-}"

if [[ -z "$BACKUP_FILE" || -z "$TARGET_DB" ]]; then
  echo "Usage: restore.sh <backup.sql.gz> <database-url>"
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Error: backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "========================================"
echo "  MakerBase Restore"
echo "========================================"
echo "  Source: $BACKUP_FILE"
echo "  Target: $(echo "$TARGET_DB" | sed 's|//.*@|//<credentials>@|')"
echo "========================================"
echo ""
echo "WARNING: All existing data will be overwritten."
echo ""
read -rp "Type 'restore' to confirm: " confirm

if [[ "$confirm" != "restore" ]]; then
  echo "Aborted."
  exit 1
fi

echo "Restoring..."
gunzip -c "$BACKUP_FILE" | psql "$TARGET_DB" --quiet
echo "Restore complete."