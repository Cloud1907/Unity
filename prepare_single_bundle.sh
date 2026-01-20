#!/bin/bash

BUNDLE_NAME="Unity_Single_v3"
rm -rf $BUNDLE_NAME
mkdir -p $BUNDLE_NAME

APP_DIR="$BUNDLE_NAME/UnityApp"
mkdir -p $APP_DIR

echo "📦 Unity TEK SİTE Paketi Hazırlanıyor..."

# 1. Backend Publish (.NET - Windows x64)
echo "🚀 Backend publish ediliyor (Windows x64)..."
dotnet publish dotnet-backend/Unity.API/Unity.API.csproj -c Release -r win-x64 --self-contained false -o $APP_DIR

# 2. Veritabanını Kopyala
echo "💾 Mevcut veritabanı yedeği alınıyor..."
cp dotnet-backend/Unity.API/unity.db $APP_DIR/

# 3. Frontend Build (React)
if [ ! -d "frontend/build" ]; then
    echo "⚠️ Frontend build bulunamadı, oluşturuluyor..."
    # Build öncesi .env.production temizlenmeli mi? api.js production modunda env'yi zaten ignore ediyor, sorun yok.
    cd frontend && npm run build && cd ..
else 
    echo "ℹ️ Mevcut frontend build kullanılıyor."
fi

# 4. Frontend'i Backend'in wwwroot klasörüne taşı (Single Site Mantığı)
echo "📂 Frontend dosyaları Backend içine gömülüyor (wwwroot)..."
mkdir -p $APP_DIR/wwwroot
cp -r frontend/build/* $APP_DIR/wwwroot/

# 5. Web.Config (Backend IIS Hosting + Frontend Rewrite)
# Backend, statik dosyaları sunacak. Ancak SPA olduğu için, dosya bulunamazsa (React Route) index.html dönmeli.
# Bu logic Program.cs'de MapFallbackToFile ile var.
# IIS'te ise AspNetCoreModuleV2 tüm istekleri backend'e iletmeli.
echo '<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <location path="." inheritInChildApplications="false">
    <system.webServer>
      <handlers>
        <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
      </handlers>
      <aspNetCore processPath=".\Unity.API.exe" stdoutLogEnabled="true" stdoutLogFile=".\logs\stdout" hostingModel="inprocess" />
    </system.webServer>
  </location>
</configuration>' > $APP_DIR/web.config

# 6. README
echo "TEK TIKLA IIS KURULUMU (SINGLE SITE):

Bu paket, Frontend ve Backend'i TEK BİR SİTE olarak çalıştırır.
Sadece IIS'i başlatmanız yeterlidir. Backend otomatik tetiklenir.

GEREKSİNİM:
- Sunucuda 'ASP.NET Core Hosting Bundle' yüklü olmalıdır.

ADIMLAR:
1. 'UnityApp' klasörünü sunucuda 'C:\inetpub\wwwroot\UnityApp' konumuna kopyalayın.
2. IIS Yöneticisi'ni açın.
3. 'Siteler'e sağ tıklayıp 'Web Sitesi Ekle' deyin.
   - Site Adı: UnityApp
   - Fiziksel Yol: C:\inetpub\wwwroot\UnityApp
   - Port: 80 (veya boşta olan bir port)
4. 'Tamam' deyin.

SONUÇ:
- Tarayıcıdan siteye girdiğinizde (http://localhost) Frontend açılır.
- Backend, IIS tarafından otomatik başlatılır ve arka planda çalışır.
- Ekstra bir şey yapmanıza GEREK YOKTUR." > $BUNDLE_NAME/BENIOKU.txt

# 7. Zip Paketleme
echo "📦 ZIP dosyası oluşturuluyor..."
zip -r ${BUNDLE_NAME}.zip $BUNDLE_NAME

echo "✅ TEK SİTE PAKETİ HAZIR: ${BUNDLE_NAME}.zip"
