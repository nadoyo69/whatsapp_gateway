#!/usr/bin/env bash
# ==============================================================================
# Script Restore Data WhatsApp Gateway (Postgres, Mongo, WA Sessions)
# Penggunaan: bash scripts/restore.sh backups/wa_gateway_backup_YYYYMMDD_HHMMSS.tar.gz
# ==============================================================================
set -e

BACKUP_ARCHIVE="$1"

if [ -z "$BACKUP_ARCHIVE" ] || [ ! -f "$BACKUP_ARCHIVE" ]; then
  echo "❌ Error: Harap tentukan file backup arsip yang valid!"
  echo "Contoh: bash scripts/restore.sh backups/wa_gateway_backup_20260904_120000.tar.gz"
  exit 1
fi

echo "=================================================="
echo "⚠️ PERINGATAN: Proses ini akan me-restore database & sesi WhatsApp!"
echo "📦 File Arsip: ${BACKUP_ARCHIVE}"
echo "=================================================="

# Ambil credential dari .env jika ada
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

DB_USER=${DB_USER:-wa_admin}
DB_NAME=${DB_NAME:-wa_gateway_db}
MONGO_USER=${MONGO_USER:-wa_admin}
MONGO_PASSWORD=${MONGO_PASSWORD:?Set MONGO_PASSWORD in .env}
MONGO_DB=${MONGO_DB:-wa_gateway_logs}

TEMP_RESTORE_DIR=$(mktemp -d)

echo "📂 Mengekstrak arsip backup sementara..."
tar -xzf "${BACKUP_ARCHIVE}" -C "${TEMP_RESTORE_DIR}"
EXTRACTED_SUBDIR=$(ls -1 "${TEMP_RESTORE_DIR}" | head -n 1)
SOURCE_DIR="${TEMP_RESTORE_DIR}/${EXTRACTED_SUBDIR}"

# 1. Restore PostgreSQL
PG_FILE="${SOURCE_DIR}/postgres_${DB_NAME}.sql.gz"
if [ -f "$PG_FILE" ]; then
  echo "🐘 Memulihkan PostgreSQL (${DB_NAME})..."
  gunzip -c "$PG_FILE" | docker exec -i wa-postgres psql -U "${DB_USER}" -d "${DB_NAME}"
  echo "✅ PostgreSQL berhasil dipulihkan."
fi

# 2. Restore MongoDB
MONGO_FILE="${SOURCE_DIR}/mongo_${MONGO_DB}.archive.gz"
if [ -f "$MONGO_FILE" ]; then
  echo "🍃 Memulihkan MongoDB (${MONGO_DB})..."
  gunzip -c "$MONGO_FILE" | docker exec -i wa-mongo mongorestore --username "${MONGO_USER}" --password "${MONGO_PASSWORD}" --authenticationDatabase admin --archive --drop
  echo "✅ MongoDB berhasil dipulihkan."
fi

# 3. Restore WhatsApp Sessions
SESSIONS_FILE="${SOURCE_DIR}/wa_sessions.tar.gz"
if [ -f "$SESSIONS_FILE" ]; then
  echo "📱 Memulihkan sesi WhatsApp Baileys..."
  docker run --rm -v wa-gateway_sessions_data:/sessions -v "${SOURCE_DIR}":/backup alpine \
    sh -c "rm -rf /sessions/* && tar -xzf /backup/wa_sessions.tar.gz -C /sessions" || true
  echo "✅ Sesi WhatsApp berhasil dipulihkan."
fi

rm -rf "${TEMP_RESTORE_DIR}"

echo "=================================================="
echo "✅ Pemulihan data selesai!"
echo "🔄 Silakan restart container: docker compose restart wa-backend"
echo "=================================================="
