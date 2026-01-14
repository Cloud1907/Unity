#!/bin/bash
# 4Flow - Update Paketi Hazırlayıcı
# Geliştirme ortamında çalıştırın

VERSION=$(date +"%Y%m%d_%H%M")
PACKAGE_NAME="4flow_update_${VERSION}"

echo "📦 Update paketi hazırlanıyor: ${PACKAGE_NAME}"

# 1. Update klasörü oluştur
mkdir -p updates/${PACKAGE_NAME}
cd updates/${PACKAGE_NAME}

# 2. Değişen dosyaları topla
echo "📋 Dosyalar kopyalanıyor..."
rsync -av --exclude='node_modules' \
          --exclude='venv' \
          --exclude='.git' \
          --exclude='mongo_data' \
          --exclude='uploads' \
          --exclude='__pycache__' \
          ../../ ./4Flow/

# 3. Update scripti ekle
cat > INSTALL.sh << 'EOF'
#!/bin/bash
echo "🚀 4Flow Update Yükleniyor..."

# Yedek al
echo "💾 Mevcut sistem yedekleniyor..."
docker-compose down
cp -r ../4Flow ../4Flow_backup_$(date +%Y%m%d)

# Güncellemeleri kopyala
echo "📂 Dosyalar güncelleniyor..."
rsync -av ./4Flow/ ../4Flow/

# Docker'ı yeniden başlat
echo "🔄 Sistem yeniden başlatılıyor..."
cd ../4Flow
docker-compose up --build -d

echo "✅ Update tamamlandı!"
docker-compose ps
EOF

chmod +x INSTALL.sh

# 4. Değişiklik notları oluştur
cat > CHANGELOG.txt << EOF
4Flow Update - ${VERSION}
================================

Değişiklikler:
- Docker-compose IP yapılandırması düzeltildi
- Frontend backend bağlantısı otomatikleştirildi
- Setup.sh scripti eklendi

Kurulum:
1. Bu klasörü USB ile sunucuya kopyalayın
2. ./INSTALL.sh çalıştırın
3. http://SERVER_IP adresinden kontrol edin

EOF

# 5. Zip'le
cd ..
zip -r ${PACKAGE_NAME}.zip ${PACKAGE_NAME}/
rm -rf ${PACKAGE_NAME}

echo "✅ Paket hazır: updates/${PACKAGE_NAME}.zip"
echo "👉 Bu dosyayı USB ile sunucuya götürün"
