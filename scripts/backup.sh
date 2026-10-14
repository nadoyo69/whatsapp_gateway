#!/usr/bin/env bash
# ==============================================================================
# Script Backup Data WhatsApp Gateway (Postgres, Mongo, WA Sessions)
# ==============================================================================
set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
BACKUP_PATH="${BACKUP_DIR}/${TIMESTAMP}"

mkdir -p "${BACKUP_PATH}"

echo "=================================================="
echo "📦 Memulai Backup Data WhatsApp Gateway..."
echo "📂 Direktori Target: ${BACKUP_PATH}"
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

# 1. Backup PostgreSQL
echo "🐘 Melakukan backup PostgreSQL (${DB_NAME})..."
docker exec wa-postgres pg_dump -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${BACKUP_PATH}/postgres_${DB_NAME}.sql.gz"

# 2. Backup MongoDB
echo "🍃 Melakukan backup MongoDB (${MONGO_DB})..."
docker exec wa-mongo mongodump --username "${MONGO_USER}" --password "${MONGO_PASSWORD}" --authenticationDatabase admin --db "${MONGO_DB}" --archive | gzip > "${BACKUP_PATH}/mongo_${MONGO_DB}.archive.gz"

# 3. Backup WhatsApp Active Sessions (Docker Volume sessions_data)
echo "📱 Mengarsipkan file sesi WhatsApp (Baileys auth keys)..."
docker run --rm -v wa-gateway_sessions_data:/sessions -v "$(pwd)/${BACKUP_PATH}":/backup alpine \
  tar -czf /backup/wa_sessions.tar.gz -C /sessions . || true

# 4. Buat arsip ringkas gabungan (All-in-one bundle)
BUNDLE_FILE="${BACKUP_DIR}/wa_gateway_backup_${TIMESTAMP}.tar.gz"
tar -czf "${BUNDLE_FILE}" -C "${BACKUP_DIR}" "${TIMESTAMP}"
rm -rf "${BACKUP_PATH}"

echo "=================================================="
echo "✅ Backup berhasil diselesaikan!"
echo "📦 File Arsip : ${BUNDLE_FILE}"
echo "📊 Ukuran     : $(du -h "${BUNDLE_FILE}" | cut -f1)"
echo "=================================================="
