#!/bin/bash

BUNDLE_NAME="Unity_Setup_v1"
rm -rf $BUNDLE_NAME
mkdir -p $BUNDLE_NAME
mkdir -p $BUNDLE_NAME/backend
mkdir -p $BUNDLE_NAME/frontend-build
mkdir -p $BUNDLE_NAME/installers
mkdir -p $BUNDLE_NAME/scripts

echo "📦 Unity Setup Bundle Hazırlanıyor..."

# 1. URL Rewrite (Manual Download Required due to broken links)
echo "⬇️  URL Rewrite modülü için README oluşturuluyor..."
echo "Lutfen IIS URL Rewrite Module 2.0 (x64) indirip bu klasore 'rewrite_amd64_en-US.msi' adıyla kaydedin." > installers/README.txt
echo "İndirme Linki: https://www.iis.net/downloads/microsoft/url-rewrite" >> installers/README.txt
# Bundle içine kopyala
cp installers/README.txt $BUNDLE_NAME/installers/

# 2. Backend Publish (.NET)
echo "🚀 Backend publish ediliyor..."
dotnet publish dotnet-backend/Unity.API/Unity.API.csproj -c Release -o $BUNDLE_NAME/backend

# 3. Veritabanını Kopyala
echo "💾 Mevcut veritabanı yedeği alınıyor..."
cp dotnet-backend/Unity.API/unity.db $BUNDLE_NAME/backend/

# 4. Frontend Build (React)
# Önceki turda build alındıysa tekrar almıyorum zaman kazanmak için.
if [ ! -d "frontend/build" ]; then
    echo "⚠️ Frontend build bulunamadı, oluşturuluyor..."
    cd frontend && npm run build && cd ..
else 
    echo "ℹ️ Mevcut frontend build kullanılıyor."
    # Opsiyonel: her zaman taze build istenirse burayı aç.
    # cd frontend && npm run build && cd ..
fi

echo "📂 Frontend dosyaları kopyalanıyor..."
cp -r frontend/build/* $BUNDLE_NAME/frontend-build/

# IIS Frontend Web.Config (React Router Rules)
echo '<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="React Routes" stopProcessing="true">
                    <match url=".*" />
                    <conditions logicalGrouping="MatchAll">
                        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
                        <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="/" />
                </rule>
            </rules>
        </rewrite>
        <staticContent>
             <remove fileExtension=".json" />
             <mimeMap fileExtension=".json" mimeType="application/json" />
             <remove fileExtension=".webp" />
             <mimeMap fileExtension=".webp" mimeType="image/webp" />
        </staticContent>
    </system.webServer>
</configuration>' > $BUNDLE_NAME/frontend-build/web.config

# 5. Scriptleri Kopyala
echo "📜 Scriptler kopyalanıyor..."
cp SETUP.bat $BUNDLE_NAME/
cp scripts/configure_iis.ps1 $BUNDLE_NAME/scripts/

# 6. Zip Paketleme
echo "📦 ZIP dosyası oluşturuluyor..."
zip -r ${BUNDLE_NAME}.zip $BUNDLE_NAME

echo "✅ SETUP PAKETİ HAZIR: ${BUNDLE_NAME}.zip"
