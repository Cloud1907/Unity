@echo off
setlocal
cd /d "%~dp0"
title Unity Kurulum Sihirbazi

color 1F
cls
echo ===============================================================================
echo.
echo                       UNITY OTOMATIK KURULUM SIHIRBAZI
echo.
echo ===============================================================================
echo.
echo Bu kurulum, Unity uygulamasini IIS uzerine kuracak ve Backend servisini baslatacaktir.
echo.

:: Yonetici İzni Kontrolu
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [HATA] Lutfen bu dosyayi SAG TIKLAYIP "Yonetici Olarak Calistir" deyin.
    echo.
    pause
    exit
)

echo.
echo [1] Kurulum Parametreleri
echo -------------------------
set /p TARGET_DIR="Kurulum Dizini (Tam Yol) [Varsayilan: C:\inetpub\wwwroot\Unity]: "
if "%TARGET_DIR%"=="" set TARGET_DIR=C:\inetpub\wwwroot\Unity

set /p FRONTEND_PORT="Frontend Portu (Web Arayuzu) [Varsayilan: 80]: "
if "%FRONTEND_PORT%"=="" set FRONTEND_PORT=80

echo.
echo Kurulum Dizini: %TARGET_DIR%
echo Port: %FRONTEND_PORT%
echo.
set /p CONFIRM="Onayliyor musunuz? (E/H) [Varsayilan: E]: "
if /i "%CONFIRM%"=="H" exit

cls
echo ===============================================================================
echo KURULUM BASLIYOR...
echo ===============================================================================
echo.

:: 1. URL Rewrite Modulu Kontrol ve Kurulum
echo [1/5] URL Rewrite Modulu kontrol ediliyor...
if exist "installers\rewrite_amd64_en-US.msi" (
    echo -> Modul installer bulundu, kuruluyor...
    msiexec /i "installers\rewrite_amd64_en-US.msi" /qn /norestart
    echo -> Kurulum komutu gonderildi.
) else (
    echo [UYARI] URL Rewrite installer bulunamadi. IIS icerisinden URL Rewrite modulunun kurulu oldugundan emin olun.
    echo Eger kurulu degilse installers\README.txt dosyasindaki linkten indirin.
)
echo.

:: 2. Hedef Klasor Hazirligi ve Dosya Kopyalama
echo.
echo [2/5] Dosyalar kopyalaniyor...
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%" 2>nul
if errorlevel 1 (
    echo [HATA] Hedef klasor olusturulamadi: %TARGET_DIR%
    echo Lutfen gecerli bir yol girdiginizden emin olun.
    pause
    exit
)

:: IIS ve Backend Servisini ve Tum Processleri ZORLA Durdur
echo -> Servisler ve Processler zorla kapatiliyor...
sc stop UnityBackend >nul 2>&1
iisreset /stop >nul 2>&1
:: Force Kill (Asili kalan islemler icin)
taskkill /F /IM Unity.API.exe /T >nul 2>&1
taskkill /F /IM w3wp.exe /T >nul 2>&1
timeout /t 3 /nobreak >nul

:: Dosya Kopyalama (Robocopy ile daha guclu)
echo -> Backend dosyalari kopyalaniyor...
:: /MIR: Mirror (Eskileri sil, yenileri at)
:: /R:3 : 3 kez dene
:: /W:1 : 1 saniye bekle
robocopy "backend" "%TARGET_DIR%\backend" /MIR /R:5 /W:2 /NP /NFL /NDL >nul
:: Robocopy exit code 8'den kucukse basarili demektir (0-7 arasi degisiklik var/yok vs)
if %ERRORLEVEL% GEQ 8 (
    echo [HATA] Backend dosyalari kopyalanamadi! (Hata Kodu: %ERRORLEVEL%)
    echo Lutfen sunlari kontrol edin:
    echo 1. Klasor izinleri (Yazma izniniz var mi?)
    echo 2. Dosya baska bir program tarafindan kullaniliyor mu?
    iisreset /start >nul
    pause
    exit
)

echo -> Frontend dosyalari kopyalaniyor...
robocopy "frontend-build" "%TARGET_DIR%\frontend" /MIR /R:5 /W:2 /NP /NFL /NDL >nul
if %ERRORLEVEL% GEQ 8 (
    echo [HATA] Frontend dosyalari kopyalanamadi! (Hata Kodu: %ERRORLEVEL%)
    iisreset /start >nul
    pause
    exit
)

:: Veritabani Islemleri
echo.
echo [3/5] Veritabani yapilandiriliyor...
if exist "%TARGET_DIR%\backend\unity.db" (
    echo -> [DIKKAT] Mevcut veritabani bulundu!
    echo -> Yedegi aliniyor: unity.db.bak
    copy /Y "%TARGET_DIR%\backend\unity.db" "%TARGET_DIR%\backend\unity.db.bak" >nul
)
echo -> Yeni veritabani kopyalaniyor...
copy /Y "backend\unity.db" "%TARGET_DIR%\backend\unity.db" >nul

:: Servisleri Tekrar Baslat (IIS) - Backend servisi en sonda baslayacak
echo -> IIS servisleri tekrar baslatiliyor...
iisreset /start >nul

:: 3. IIS Kurulumu
echo.
echo [4/5] IIS ve Site yapilandiriliyor...
powershell -NoProfile -ExecutionPolicy Bypass -Command "& 'scripts\configure_iis.ps1' -SiteName 'UnityApp' -Port %FRONTEND_PORT% -PhysicalPath '%TARGET_DIR%\frontend'"
if errorlevel 1 (
    echo [HATA] IIS yapilandirmasi sirasinda hata olustu.
    pause
)

:: 4. Backend Servisi Kurulumu
echo.
echo [5/5] Backend Windows Servisi kuruluyor...
sc create UnityBackend binPath= "%TARGET_DIR%\backend\Unity.API.exe" start= auto DisplayName= "Unity Backend Service" >nul
sc description UnityBackend "Unity application backend API service." >nul
sc failure UnityBackend reset= 0 actions= restart/60000 >nul

echo -> Servis baslatiliyor...
net start UnityBackend

echo.
echo ===============================================================================
echo KURULUM TAMAMLANDI!
echo ===============================================================================
echo.
echo Frontend Erisimi: http://localhost:%FRONTEND_PORT%
echo Backend Erisimi : http://localhost:8000
echo.
echo Bu pencereyi kapatabilirsiniz.
pause
