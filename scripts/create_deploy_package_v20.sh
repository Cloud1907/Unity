#!/bin/bash

# ==============================================================================
# UNITY DEPLOYMENT PACKAGE GENERATOR (v20 Structure)
# ==============================================================================
# Bu script, sunucuda kullanılan "setup_iis_master.bat" dosyasının beklediği 
# klasör yapısına uygun olarak Unity_Deploy_Package_vXX.zip dosyasını oluşturur.
#
# BEKLENEN YAPI:
# 1. setup_iis_master.bat (Root'ta)
# 2. dotnet-backend/backend-publish/ (Publish edilmiş .NET dosyaları)
# 3. frontend/build/ (Build edilmiş React dosyaları)
# ==============================================================================

# Versiyonu buradan değiştirin
VERSION="v20"
PACKAGE_NAME="Unity_Deploy_Package_${VERSION}"

# Temizlik
echo "🧹 Temizlik yapılıyor..."
rm -rf pkg_temp
rm -rf silinecekler/${PACKAGE_NAME}.zip

# Klasör Yapısını Oluştur
echo "Vg Klasör yapısı hazırlanıyor..."
mkdir -p pkg_temp/${PACKAGE_NAME}/dotnet-backend/backend-publish
mkdir -p pkg_temp/${PACKAGE_NAME}/frontend

# 1. Setup Scriptini Kopyala
# (Bu dosya sunucudaki IIS kurulumunu yönetir)
echo "📜 Setup scripti kopyalanıyor..."
cp setup_iis_master.bat pkg_temp/${PACKAGE_NAME}/

# 2. Backend Publish
echo "🚀 Backend (.NET) publish ediliyor (Self-Contained)..."
# HTTP 500.31 hatasını önlemek için self-contained true yapıyoruz.
# Bu sayede sunucuda .NET 8 kurulu olmasa bile çalışır.
dotnet publish dotnet-backend/Unity.API/Unity.API.csproj -c Release -r win-x64 --self-contained true -o pkg_temp/${PACKAGE_NAME}/dotnet-backend/backend-publish

# 3. IIS Web.Config Düzenlemesi
# (WebDAV modülünü kapatır ve ASP.NET Core modülünü aktif eder)
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
</configuration>' > pkg_temp/${PACKAGE_NAME}/dotnet-backend/backend-publish/web.config

# 4. Frontend Build & Copy
echo "🎨 Frontend kopyalanıyor..."
# Eğer build yoksa uyar, varsa kopyala (Hız için tekrar build almıyoruz, gerekirse npm run build ekleyin)
if [ -d "frontend/build" ]; then
    cp -r frontend/build pkg_temp/${PACKAGE_NAME}/frontend/
else
    echo "⚠️  Frontend build klasörü bulunamadı! Lütfen önce 'cd frontend && npm run build' çalıştırın."
    exit 1
fi

# 5. Zip Oluşturma
echo "📦 Zip paketi oluşturuluyor..."
cd pkg_temp
zip -r ../silinecekler/${PACKAGE_NAME}.zip ${PACKAGE_NAME}
cd ..

# Bitiş
rm -rf pkg_temp
echo ""
echo "✅ PAKET HAZIR: silinecekler/${PACKAGE_NAME}.zip"
echo "Bu zip dosyasını sunucuya atıp, içindeki 'setup_iis_master.bat' dosyasını çalıştırın."
