#!/usr/bin/env bash
# ==============================================================================
# Manual Server Deployment Script - WhatsApp Gateway
# Domain: whatsapp.nexforgex.my.id & whatsapp-api.nexforgex.my.id
# ==============================================================================
set -e

echo "=================================================="
echo "🚀 Memulai Manual Deployment WhatsApp Gateway..."
echo "=================================================="

# 1. Deteksi tool docker compose
if docker compose version > /dev/null 2>&1; then
  DOCKER_CMD="docker compose"
else
  DOCKER_CMD="docker-compose"
fi

# 2. Cek file .env
if [ ! -f .env ]; then
  echo "⚠️ File .env tidak ditemukan. Menyalin dari .env.example..."
  cp .env.example .env
  echo "👉 Silakan periksa dan sesuaikan variabel di .env bila perlu."
fi

# 3. Pull kode terbaru jika dalam repositori git
if [ -d ".git" ]; then
  echo "📥 Menarik pembaruan dari git..."
  git pull origin main || true
fi

# 4. Pull base images & Build
echo "🐳 Menarik base images..."
$DOCKER_CMD pull wa-postgres wa-mongo || true

echo "🏗️ Membangun container backend & frontend..."
$DOCKER_CMD build

# 5. Start containers
echo "🔄 Menjalankan container dengan Docker Compose..."
$DOCKER_CMD up -d --remove-orphans

# 6. Pembersihan
echo "🧹 Membersihkan unused Docker images..."
docker image prune -f || true

echo "=================================================="
echo "✅ Deployment selesai! Status container:"
echo "=================================================="
$DOCKER_CMD ps
