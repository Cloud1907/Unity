#!/bin/bash

# V5 = Tek Port 8080 (IIS Frontend sitesini kapattıktan sonra kullan)
BUNDLE_NAME="Unity_Manuel_v5"
rm -rf $BUNDLE_NAME
mkdir -p $BUNDLE_NAME

echo "📦 Unity MANUEL Paket (v5 - TEK PORT 8080) Hazırlanıyor..."

# 1. Backend Publish (.NET)
echo "🚀 Backend publish ediliyor (Windows x64)..."
dotnet publish dotnet-backend/Unity.API/Unity.API.csproj -c Release -r win-x64 --self-contained false -o $BUNDLE_NAME/backend

# 2. Veritabanını Kopyala
echo "💾 Mevcut veritabanı kopyalanıyor..."
cp dotnet-backend/Unity.API/unity.db $BUNDLE_NAME/backend/

# 3. Frontend Build (React) - Relative Path kullan
rm -rf frontend/build
echo "🔨 Frontend build alınıyor..."
cd frontend && npm run build && cd ..

# 4. Frontend'i Backend içine göm (TEK PORT)
echo "📥 Frontend, Backend içine gömülüyor..."
mkdir -p $BUNDLE_NAME/backend/wwwroot
cp -r frontend/build/* $BUNDLE_NAME/backend/wwwroot/

# 5. BASLAT.bat (Port 8080)
echo '@echo off
echo ========================================
echo Unity Baslatiliyor (Port 8080)
echo ========================================
cd /d "%~dp0backend"
echo.
echo WEB EKRANI: http://localhost:8080
echo DIS ERISIM: http://SUNUCU_IP_ADRESI:8080
echo.
echo Lutfen bu pencereyi KAPATMAYIN.
echo.
Unity.API.exe --urls "http://0.0.0.0:8080"
pause' > $BUNDLE_NAME/BASLAT.bat

# 6. FIREWALL.bat (Port 8080)
echo '@echo off
echo ========================================
echo Unity Port Acma (8080)
echo ========================================
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo HATA: Yonetici Olarak Calistirin!
    pause
    exit /b 1
)
netsh advfirewall firewall add rule name="UnityApp8080" dir=in action=allow protocol=TCP localport=8080
echo ISLEM TAMAM.
pause' > $BUNDLE_NAME/FIREWALL_AC.bat

# 7. README
echo "MANUEL KURULUM (TEK PORT 8080)

ONEMLI: IIS UZERINDE 8080 PORTUNU KULLANAN BIR SITE VARSA ONCE ONU DURDURUN!

ADIMLAR:
1. IIS Manager'dan 8080 portundaki eski siteyi DURDURUN/SILIN.
2. 'FIREWALL_AC.bat' dosyasina Sag Tikla -> Yonetici Olarak Calistir.
3. 'BASLAT.bat' dosyasina Cift Tikla.
4. Tarayiciyi ac: http://localhost:8080 veya http://SUNUCU_IP:8080

Her sey TEK PORTTAN calisir.
" > $BUNDLE_NAME/BENIOKU.txt

# 8. Zip
echo "📦 ZIP paketleniyor..."
zip -r ${BUNDLE_NAME}.zip $BUNDLE_NAME
echo "✅ PAKET HAZIR: ${BUNDLE_NAME}.zip"
