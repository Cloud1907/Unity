#!/bin/bash

# Unity Application Production Build Script (Flat Layout)
# Targeted for IIS Publication

echo "🚀 Production build süreci başlatılıyor..."

# 1. Klasörleri Tanımla
PROJECT_ROOT=$(pwd)
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/dotnet-backend/Unity.API"
TEMP_BUILD_DIR="$PROJECT_ROOT/temp_setup_build"
OUTPUT_ZIP="$HOME/Desktop/UnityApp_Setup.zip"

# 2. Temizlik
echo "🧹 Eski dosyalar temizleniyor..."
rm -rf "$TEMP_BUILD_DIR"
rm -f "$OUTPUT_ZIP"
mkdir -p "$TEMP_BUILD_DIR"

# 3. Frontend Build
echo "📦 Frontend derleniyor..."
cd "$FRONTEND_DIR"
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build hatası!"
    exit 1
fi

# 4. Backend Publish
echo "⚙️ Backend yayınlanıyor (win-x64)..."
cd "$BACKEND_DIR"
dotnet publish -c Release -r win-x64 --self-contained true -o "$TEMP_BUILD_DIR"
if [ $? -ne 0 ]; then
    echo "❌ Backend publish hatası!"
    exit 1
fi

# 5. Frontend Entegrasyonu (wwwroot)
echo "🔗 Frontend dosyaları backend'e entegre ediliyor..."
mkdir -p "$TEMP_BUILD_DIR/wwwroot"
cp -r "$FRONTEND_DIR/build/"* "$TEMP_BUILD_DIR/wwwroot/"

# 6. Sıkıştırma Öncesi Temizlik (uploads klasörünü hariç tut)
echo "🧹 Gereksiz dosyalar (uploads) temizleniyor..."
rm -rf "$TEMP_BUILD_DIR/wwwroot/uploads"
rm -rf "$TEMP_BUILD_DIR/uploads"

# 7. Sıkıştırma (Flat Structure)
echo "🗜️ Paket oluşturuluyor (ZIP)..."
cd "$TEMP_BUILD_DIR"
zip -r "$OUTPUT_ZIP" ./*

if [ $? -eq 0 ]; then
    echo "✅ Kurulum paketi başarıyla oluşturuldu: $OUTPUT_ZIP"
    echo "ℹ️  Masaüstündeki ZIP dosyasını doğrudan sunucuya kopyalayabilirsiniz."
else
    echo "❌ Paketleme hatası!"
    exit 1
fi

# 7. Geçici dosyaları temizle
cd "$PROJECT_ROOT"
rm -rf "$TEMP_BUILD_DIR"

echo "✨ İşlem tamamlandı!"
