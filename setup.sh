#!/bin/bash

# 4Flow Kurulum Script'i - Sunucu IP'sini Otomatik Alır

echo "🚀 4Flow Kurulumu Başlatılıyor..."

# Sunucu IP'sini al
SERVER_IP=$(hostname -I | awk '{print $1}')

if [ -z "$SERVER_IP" ]; then
    echo "⚠️  IP adresi bulunamadı. Manuel olarak girin:"
    read -p "Sunucu IP Adresi: " SERVER_IP
fi

echo "📍 Tespit edilen IP: $SERVER_IP"

# .env dosyası oluştur
echo "SERVER_IP=$SERVER_IP" > .env

# Docker build ve start
echo "🔨 Docker imajları oluşturuluyor..."
docker-compose down
docker-compose up --build -d

echo "✅ Kurulum Tamamlandı!"
echo "👉 Tarayıcıda şu adresi açın: http://$SERVER_IP"
echo "👉 MongoDB'ye bağlanmak için: mongodb://$SERVER_IP:27017"
