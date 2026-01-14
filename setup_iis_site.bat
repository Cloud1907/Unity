@echo off
setlocal
chcp 65001 > nul

echo ==========================================
echo Unity - IIS Site Kurulumu (Basit)
echo ==========================================

:: Yonetici kontrolu
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [HATA] Bu script Yonetici olarak calistirilmali!
    pause
    exit /b 1
)

cd /d "%~dp0"

:: Kullanicidan port al
set /p PORT="Hangi porttan calismali? (Ornek: 80, 8080, 5000): "
if "%PORT%"=="" set PORT=80

echo.
echo [BILGI] Site Port %PORT% uzerinden olusturulacak.

set SITE_NAME=Unity
set SITE_PATH=%~dp0app\frontend-build

:: Web.config'i kontrol et
if not exist "%SITE_PATH%\web.config" (
    echo [HATA] web.config bulunamadi! Lutfen 'native-bundle' paketini kullandiginizdan emin olun.
    pause
    exit /b 1
)

:: Eski siteyi sil (varsa)
echo Eski site siliniyor...
%systemroot%\system32\inetsrv\appcmd delete site "%SITE_NAME%" >nul 2>&1

:: Yeni site olustur
echo Site olusturuluyor...
%systemroot%\system32\inetsrv\appcmd add site /name:"%SITE_NAME%" /physicalPath:"%SITE_PATH%" /bindings:http/*:%PORT%:

if errorlevel 1 (
    echo [HATA] Site olusturulamadi!
    echo IIS yuklu degil veya aktif degil olabilir.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo SITE OLUSTURULDU!
echo.
echo URL: http://localhost:%PORT%
echo.
echo ONEMLI: Backend'i baslatmayi unutmayin:
echo - 'start_backend.bat' dosyasina cift tiklayin
echo ==========================================
pause
