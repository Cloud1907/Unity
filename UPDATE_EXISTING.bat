@echo off
setlocal
cd /d "%~dp0"

echo ==========================================
echo Unity Guncelleme (IIS:8080 + Service)
echo ==========================================

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
if not exist "C:\Unity\app\backend" mkdir "C:\Unity\app\backend"
xcopy /E /Y /I app\backend "C:\Unity\app\backend"

:: Frontend build kopyala (IIS'in baktigi yer - Varsayilan C:\Unity\app\frontend-build)
:: Eger IIS baska yere bakiyorsa burayi duzeltin!
if not exist "C:\Unity\app\frontend-build" mkdir "C:\Unity\app\frontend-build"
xcopy /E /Y /I app\frontend-build "C:\Unity\app\frontend-build"
copy /Y app\frontend-build\web.config "C:\Unity\app\frontend-build\"

:: 3. Servisleri Baslat
echo.
echo [3/3] Servisler Baslatiliyor...
schtasks /run /tn "UnityBackend"

echo.
echo ==========================================
echo GUNCELLEME TAMAMLANDI!
echo Frontend: http://localhost:8080 (IIS)
echo Backend: Arka planda servis olarak calisiyor
echo ==========================================
pause
