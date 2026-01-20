@echo off
setlocal
cd /d "%~dp0"

echo ==========================================
echo Unity Guncelleme (IIS:8080 + Service)
echo ==========================================

:: Ayarlanabilir Hedef Klasor
set TARGET_DIR=C:\Unity\app
echo Hedef Klasor: %TARGET_DIR%

:: 1. Backend Servis Kurulumu (Eger yoksa)
echo.
echo [1/3] Backend Servis Kontrolu...
schtasks /query /tn "UnityBackend" >nul 2>&1
if %errorLevel% neq 0 (
    echo Servis bulunamadi, kuruluyor...
    call install_service_task.bat
) else (
    echo Servis zaten kurulu. Guncelleme icin durduruluyor...
    taskkill /FI "WINDOWTITLE eq Unity Backend" /F >nul 2>&1
    taskkill /IM uvicorn.exe /F >nul 2>&1
)

:: 2. Dosya Guncelleme
echo.
echo [2/3] Dosyalar Guncelleniyor...

:: Backend kodlarini kopyala (sadece kodlar, venv degil)
:: Backend kodlarini kopyala (sadece kodlar, venv degil)
if not exist "%TARGET_DIR%\backend" mkdir "%TARGET_DIR%\backend"
xcopy /E /Y /I app\backend "%TARGET_DIR%\backend"

:: Frontend build kopyala (IIS'in baktigi yer - Varsayilan C:\Unity\app\frontend-build)
:: Eger IIS baska yere bakiyorsa burayi duzeltin!
if not exist "%TARGET_DIR%\frontend-build" mkdir "%TARGET_DIR%\frontend-build"
xcopy /E /Y /I app\frontend-build "%TARGET_DIR%\frontend-build"
copy /Y app\frontend-build\web.config "%TARGET_DIR%\frontend-build\"

:: 3. Servisleri Baslat
echo.
echo [3/3] Servisler Baslatiliyor...
schtasks /run /tn "UnityBackend"
if %errorLevel% neq 0 (
    echo [UYARI] Servis baslatilamadi! Manuel baslatmayi deniyoruz...
    start "Unity Backend" "%TARGET_DIR%\start_backend.bat"
) else (
    echo [INFO] Servis baslatma komutu gonderildi.
)

echo.
echo [4/4] Saglik Kontrolu...
timeout /t 5 >nul
curl http://127.0.0.1:8000/api/health
if %errorLevel% neq 0 (
    echo [ERROR] Backend hala cevap vermiyor! Lutfen 'start_backend.bat' dosyasini manuel calistirin.
) else (
    echo [OK] Backend calisiyor.
)

echo.
echo ==========================================
echo GUNCELLEME TAMAMLANDI!
echo Frontend: http://localhost:8080 (IIS)
echo Backend: Arka planda servis olarak calisiyor
echo ==========================================
pause
