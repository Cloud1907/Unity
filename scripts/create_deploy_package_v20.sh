#!/bin/bash

# ==============================================================================
# UNITY DEPLOYMENT PACKAGE GENERATOR (v20 - Final Structure)
# ==============================================================================
# Bu script, ZIP içeriğini doğrudan "UnityApp" klasörü olarak paketler.
# Kullanıcı bu ZIP'i C:\ gibi bir ana dizine attığında C:\UnityApp oluşur.
# ==============================================================================

VERSION="v20"
PACKAGE_NAME="Unity_Deploy_Package_${VERSION}"
DEPLOY_DIR="UnityApp" # ZIP içindeki ana klasör ismi

# 1. Temizlik
echo "🧹 Temizlik yapılıyor..."
rm -rf pkg_temp
mkdir -p pkg_temp/${DEPLOY_DIR}
mkdir -p silinecekler

# 2. Frontend Derleme (Garanti olması için)
echo "🎨 Frontend derleniyor (Son halini garanti etmek için)..."
rm -rf frontend/build
cd frontend && npm install && npm run build
cd ..

# 3. Backend Publish (Self-Contained)
echo "🚀 Backend (.NET) publish ediliyor..."
dotnet publish dotnet-backend/Unity.API/Unity.API.csproj -c Release -r win-x64 --self-contained true -o pkg_temp/${DEPLOY_DIR}

# 4. Frontend'i Backend içine göm (wwwroot)
echo "📦 Frontend dosyaları Backend'e (wwwroot) taşınıyor..."
mkdir -p pkg_temp/${DEPLOY_DIR}/wwwroot
cp -r frontend/build/* pkg_temp/${DEPLOY_DIR}/wwwroot/

# 5. Yeni Nesil SETUP scriptini ekle
echo "📜 Fast Setup scripti kopyalanıyor..."
cp scripts/FAST_SETUP.bat pkg_temp/${DEPLOY_DIR}/SETUP.bat

# 6. Web.Config Ayarı
echo "⚙️  IIS için web.config oluşturuluyor..."
echo '<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <location path="." inheritInChildApplications="false">
    <system.webServer>
      <modules runAllManagedModulesForAllRequests="false">
        <remove name="WebDAVModule" />
      </modules>
      <handlers>
        <remove name="WebDAV" />
        <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
      </handlers>
      <aspNetCore processPath=".\Unity.API.exe" stdoutLogEnabled="true" stdoutLogFile=".\logs\stdout" hostingModel="inprocess" />
    </system.webServer>
  </location>
</configuration>' > pkg_temp/${DEPLOY_DIR}/web.config

# 7. Zip Oluşturma
echo "📦 Zip paketi oluşturuluyor..."
cd pkg_temp
zip -r ../silinecekler/${PACKAGE_NAME}.zip ${DEPLOY_DIR}
cd ..

# 8. Teslimat
rm -rf pkg_temp
DESKTOP_SETUP="/Users/cloudsmac/Desktop/setup"
if [ -d "$DESKTOP_SETUP" ]; then
    echo "🚚 Paket Masaüstü SETUP klasörüne kopyalanıyor..."
    cp "silinecekler/${PACKAGE_NAME}.zip" "$DESKTOP_SETUP/"
    echo "✅ TAMAMLANDI: ${DESKTOP_SETUP}/${PACKAGE_NAME}.zip"
else
    echo "✅ TAMAMLANDI: silinecekler/${PACKAGE_NAME}.zip"
fi

echo ""
echo "TALİMAT:"
echo "1. Zip'i sunucuda kurulum yapacağınız yerin BİR ÜST klasörüne atın (Örn: C:\)."
echo "2. Zipten çıkarın (C:\UnityApp klasörü oluşacaktır)."
echo "3. UnityApp içindeki SETUP.bat dosyasını YÖNETİCİ olarak çalıştırın."
