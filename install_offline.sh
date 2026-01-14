#!/bin/bash

# 4Flow Offline Yükleyici
# Sunucuda (internet yokken) çalıştırın.

echo "🚀 4Flow Kurulumu Başlıyor..."

# 1. İmajları Yükle
echo "📦 İmajlar Docker'a yükleniyor..."
docker load < images/mongo.tar.gz
docker load < images/backend.tar.gz
docker load < images/frontend.tar.gz

# 2. Başlat
echo "🔥 Sistem başlatılıyor..."
docker-compose up -d

echo "✅ Kurulum Tamamlandı!"
echo "👉 Tarayıcıda: http://localhost adresine gidin."
