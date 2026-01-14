@echo off
setlocal
chcp 65001 > nul

echo ==========================================
echo Unity Windows Kurulumu (Offline Mod)
echo ==========================================

:: 1. Calisma dizinine git
cd /d "%~dp0"
echo [BILGI] Calisma Dizini: %CD%

:: 2. Klasor icerigini listele
echo.
echo [BILGI] Klasor Icerigi:
dir /b
echo ------------------------------------------

:: 3. Docker Kontrolu (Daemon calisiyor mu?)
echo.
echo [KONTROL] Docker hizmeti kontrol ediliyor...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [KRITIK HATA] Docker Desktop calismiyor!
    echo.
    echo MUHTEMEL COZUM (WSL Hatasi):
    echo Eger Docker acilirken "WSL needs update" hatasi verdiyse:
    echo 1. Bu klasordeki "wsl_update_x64.msi" dosyasini cift tiklayip kurun.
    echo 2. Bilgisayari (veya Docker Desktop'i) yeniden baslatin.
    echo.
    echo Eger WSL hatasi yoksa, sadece Docker Desktop uygulamasini baslatin.
    echo.
    pause
    exit /b 1
)
echo [OK] Docker hizmeti aktif.

:: 4. Imajlarin Yuklenmesi
echo.
echo [1/3] Mongo imaji yukleniyor...
if exist images\mongo.tar.gz (
    docker load -i images\mongo.tar.gz
    if %errorlevel% neq 0 goto :docker_error
) else (
    echo [HATA] images\mongo.tar.gz DOSYASI YOK!
    pause
    exit /b 1
)

echo.
echo [2/3] Backend imaji yukleniyor...
if exist images\backend.tar.gz (
    docker load -i images\backend.tar.gz
    if %errorlevel% neq 0 goto :docker_error
) else (
    echo [HATA] images\backend.tar.gz DOSYASI YOK!
    pause
    exit /b 1
)

echo.
echo [3/3] Frontend imaji yukleniyor...
if exist images\frontend.tar.gz (
    docker load -i images\frontend.tar.gz
    if %errorlevel% neq 0 goto :docker_error
) else (
    echo [HATA] images\frontend.tar.gz DOSYASI YOK!
    pause
    exit /b 1
)

:: 5. Baslatma
echo.
echo Sistem baslatiliyor...
docker-compose up -d
if %errorlevel% neq 0 goto :docker_error

echo.
echo ==========================================
echo KURULUM BASARIYLA TAMAMLANDI!
echo.
echo Uygulamaya erismek icin tarayicinizi acin:
echo Adres: http://localhost
echo.
echo ==========================================
pause
exit /b 0

:docker_error
echo.
echo [HATA] Docker islemi sirasinda bir sorun olustu.
echo Yukaridaki hata mesajini kontrol edin.
pause
exit /b 1
