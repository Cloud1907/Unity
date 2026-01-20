#!/bin/bash

BUNDLE_NAME="Unity_Service_v1"
rm -rf $BUNDLE_NAME
mkdir -p $BUNDLE_NAME

echo "📦 Unity WINDOWS SERVICE Paketi Hazırlanıyor..."

# 1. Backend Publish (.NET - Windows x64, Service modunda)
echo "🚀 Backend publish ediliyor (Windows Service)..."
dotnet publish dotnet-backend/Unity.API/Unity.API.csproj -c Release -r win-x64 --self-contained false -o $BUNDLE_NAME/backend

# 2. Veritabanını Kopyala
echo "💾 Veritabanı kopyalanıyor..."
cp dotnet-backend/Unity.API/unity.db $BUNDLE_NAME/backend/

# 3. Frontend Build
if [ ! -d "frontend/build" ]; then
    echo "⚠️ Frontend build bulunamadı, oluşturuluyor..."
    cd frontend && npm run build && cd ..
else 
    echo "ℹ️ Mevcut frontend build kullanılıyor."
fi

# 4. Frontend'i kopyala
echo "📂 Frontend kopyalanıyor..."
mkdir -p $BUNDLE_NAME/frontend
cp -r frontend/build/* $BUNDLE_NAME/frontend/

# 5. Frontend için Web.Config (URL Rewrite)
echo '<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
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
</configuration>' > $BUNDLE_NAME/frontend/web.config

# 6. Servis Kurulum Scripti
echo '@echo off
echo ========================================
echo Unity Backend - Windows Service Kurulumu
echo ========================================
echo.

:: Admin kontrolü
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo HATA: Bu scripti Yonetici olarak calistirin!
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
echo ========================================
echo TAMAMLANDI!
echo ========================================
echo Servis basariyla kuruldu ve baslatildi.
echo Backend artik her Windows basladiginda otomatik acilacak.
echo.
pause' > $BUNDLE_NAME/SERVIS_KUR.bat

# 7. Servis Kaldırma Scripti
echo '@echo off
echo ========================================
echo Unity Backend - Windows Service Kaldir
echo ========================================
echo.

:: Admin kontrolü
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo HATA: Bu scripti Yonetici olarak calistirin!
    pause
    exit /b 1
)

echo [1/2] Servis durduruluyor...
sc stop UnityBackend

echo [2/2] Servis kaldiriliyor...
sc delete UnityBackend

echo.
echo ========================================
echo TAMAMLANDI!
echo ========================================
echo Servis basariyla kaldirildi.
echo.
pause' > $BUNDLE_NAME/SERVIS_SIL.bat

# 8. README
echo "UNITY - WINDOWS SERVICE KURULUMU

Bu paket, Backend'i Windows Service olarak, Frontend'i IIS'te çalıştırır.

===========================================
GEREKSİNİMLER
===========================================
1. .NET Runtime 10.0 (veya SDK)
2. IIS yüklü olmalı
3. IIS URL Rewrite Modülü (Frontend için)

===========================================
KURULUM ADIMLARI
===========================================

1. BACKEND SERVİSİNİ KURALIN:
   - 'SERVIS_KUR.bat' dosyasına SAĞ TIK → 'Yönetici olarak çalıştır'
   - Script otomatik olarak servisi kurup başlatacak
   - Backend artık arka planda çalışıyor (Port 8000)

2. FRONTEND'İ IIS'TE AÇIN:
   a) IIS Manager'ı açın
   b) 'Sites' → 'Add Website' 
   c) Site Adı: Unity
   d) Fiziksel Yol: [Bu klasör]/frontend
   e) Port: 80 (veya 8080)
   f) 'OK' deyin

3. TEST EDİN:
   - Tarayıcıdan http://localhost açın
   - Giriş: melih.bulut@unity.com / 123456

===========================================
SERVİS YÖNETİMİ
===========================================
- Servisi Durdur:  sc stop UnityBackend
- Servisi Başlat:  sc start UnityBackend
- Servisi Kaldır:  SERVIS_SIL.bat (Admin olarak çalıştır)

===========================================
NOTLAR
===========================================
- Backend her Windows başlangıcında otomatik açılır
- IIS sadece Frontend için kullanılır (basit!)
- Backend hızlı başlar, hiç bekleme yok
" > $BUNDLE_NAME/BENIOKU.txt

# 9. Zip Paketleme
echo "📦 ZIP dosyası oluşturuluyor..."
zip -r ${BUNDLE_NAME}.zip $BUNDLE_NAME

echo "✅ SERVİS PAKETİ HAZIR: ${BUNDLE_NAME}.zip"
echo "   Backend: Windows Service (Port 8000, Otomatik)"
echo "   Frontend: IIS (Port 80/8080, Statik)"
