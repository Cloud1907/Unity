#!/bin/bash

# FINAL BUNDLE - IIS + Windows Service + All Fixes
BUNDLE_NAME="Unity_Final"
rm -rf $BUNDLE_NAME
mkdir -p $BUNDLE_NAME

echo "📦 Unity FINAL Paket (IIS + Service) Hazırlanıyor..."

# 1. Backend Publish
echo "🚀 Backend publish ediliyor..."
dotnet publish dotnet-backend/Unity.API/Unity.API.csproj -c Release -r win-x64 --self-contained false -o $BUNDLE_NAME/backend

# 2. Veritabanı
echo "💾 Veritabanı kopyalanıyor..."
cp dotnet-backend/Unity.API/unity.db $BUNDLE_NAME/backend/

# 3. Frontend Build
rm -rf frontend/build
echo "🔨 Frontend build..."
cd frontend && npm run build && cd ..

# 4. Frontend'i Backend içine göm (Tek Port)
echo "📥 Frontend gömülüyor..."
mkdir -p $BUNDLE_NAME/backend/wwwroot
cp -r frontend/build/* $BUNDLE_NAME/backend/wwwroot/

# 5. Backend IIS Web.Config (WebDAV devre dışı, tüm HTTP metodlarına izin)
echo '<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <location path="." inheritInChildApplications="false">
    <system.webServer>
      <!-- Remove WebDAV to allow PUT/DELETE methods -->
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
</configuration>' > $BUNDLE_NAME/backend/web.config

# 6. Windows Service Kurulum Script
echo '@echo off
echo ========================================
echo Unity Windows Service Kurulumu
echo ========================================
echo.

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo HATA: Yonetici olarak calistirin!
    pause
    exit /b 1
)

cd /d "%~dp0backend"

echo [1/3] Eski servis durduruluyor...
sc stop UnityBackend >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Servis kuruluyor...
sc create UnityBackend binPath= "%~dp0backend\Unity.API.exe" start= auto DisplayName= "Unity Backend Service"

echo [3/3] Servis baslatiliyor...
sc start UnityBackend

echo.
echo TAMAMLANDI! 
echo Servis her Windows basladiginda otomatik acilir.
pause' > $BUNDLE_NAME/SERVIS_KUR.bat

# 7. Windows Service Kaldırma Script
echo '@echo off
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo HATA: Yonetici olarak calistirin!
    pause
    exit /b 1
)
sc stop UnityBackend
sc delete UnityBackend
echo Servis kaldirildi.
pause' > $BUNDLE_NAME/SERVIS_SIL.bat

# 8. Manuel Başlatma (Test için)
echo '@echo off
echo Unity Backend (Manuel)
cd /d "%~dp0backend"
Unity.API.exe
pause' > $BUNDLE_NAME/BASLAT.bat

# 9. Firewall Script
echo '@echo off
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo HATA: Yonetici olarak calistirin!
    pause
    exit /b 1
)
netsh advfirewall firewall add rule name="UnityApp" dir=in action=allow protocol=TCP localport=8080
echo Port 8080 acildi.
pause' > $BUNDLE_NAME/FIREWALL_AC.bat

# 10. README
echo "UNITY FINAL KURULUM

appsettings.json: 0.0.0.0:8080 (Tum aglara acik)
Tum buglar duzeltilmis: Avatar, Sifre, Baglanti

============================================
YONTEM 1: IIS ILE KURULUM (Onerilen)
============================================
1. IIS Manager'da yeni site ekleyin
2. Fiziksel yol: backend klasoru
3. Port: 8080
4. Baslat

NOT: ASP.NET Core Hosting Bundle yuklu olmali!

============================================
YONTEM 2: WINDOWS SERVICE (Otomatik Baslama)
============================================
1. FIREWALL_AC.bat -> Yonetici olarak calistir
2. SERVIS_KUR.bat -> Yonetici olarak calistir
3. Her Windows basladiginda otomatik acilir

Servisi kaldirmak icin: SERVIS_SIL.bat

============================================
YONTEM 3: MANUEL (Test icin)
============================================
1. BASLAT.bat cift tikla
2. Konsol acik kaldigi surece calisir

============================================
ERISIM
============================================
http://localhost:8080
http://SUNUCU_IP:8080

Giris: melih.bulut@unity.com / 123456
" > $BUNDLE_NAME/BENIOKU.txt

# 11. Zip
echo "📦 ZIP..."
zip -r ${BUNDLE_NAME}.zip $BUNDLE_NAME
echo "✅ PAKET HAZIR: ${BUNDLE_NAME}.zip"
