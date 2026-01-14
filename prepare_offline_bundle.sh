#!/bin/bash

# Unity Offline Kurulum Paketi Hazırlayıcı
# Interneti olan bir bilgisayarda çalıştırın.

echo "📦 Unity Offline Paket Hazırlanıyor..."

# 1. Klasör oluştur
mkdir -p offline-bundle/images
mkdir -p offline-bundle/config
mkdir -p offline-bundle/uploads

# 2. Gerekli Dosyalari Indir (WSL Update vb.)
echo "⬇️  WSL Guncellemesi indiriliyor..."
curl -L -o offline-bundle/wsl_update_x64.msi https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi

# 3. İmajları Çek/Derle
echo "⬇️  İmajlar hazırlanıyor (Docker)..."
docker-compose build
docker pull mongo:latest

# 3. İmajları Kaydet (.tar)
echo "💾 İmajlar diske kaydediliyor..."
docker save unity-frontend:latest | gzip > offline-bundle/images/frontend.tar.gz
docker save unity-backend:latest | gzip > offline-bundle/images/backend.tar.gz
docker save mongo:latest | gzip > offline-bundle/images/mongo.tar.gz

# 4. Yapılandırma Dosyalarını Kopyala
cp docker-compose.offline.yml offline-bundle/docker-compose.yml
cp on_premise_guide.md offline-bundle/README.md
cp install_offline.sh offline-bundle/install.sh
chmod +x offline-bundle/install.sh
cp install_offline.bat offline-bundle/install.bat

echo "✅ Paket Hazır!"
echo "👉 'offline-bundle' klasörünü USB belleğe atıp sunucuya kopyalayın."
