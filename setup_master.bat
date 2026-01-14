@echo off
setlocal
chcp 65001 > nul

echo ==========================================
echo Unity - TEK TIKLA TAM KURULUM
echo ==========================================
cd /d "%~dp0"

:: 1. Yonetici Izni Kontrolu
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [HATA] Lutfen bu dosyaya sag tiklayip "Yonetici olarak calistir" deyin.
    pause
    exit /b 1
)

echo.
echo [1/4] Kurulumlar Kontrol Ediliyor...
:: Python ve MongoDB kurulumunu cagir (Sessiz modda)
call install_native_iis.bat /auto

echo.
echo [2/4] IIS Sitesi Kuruluyor (Port 80)...
set SITE_NAME=Unity
set SITE_PATH=%~dp0app\frontend-build

:: Eski siteyi temizle
%systemroot%\system32\inetsrv\appcmd delete site "%SITE_NAME%" >nul 2>&1

:: Yeni siteyi kur (Port 80)
%systemroot%\system32\inetsrv\appcmd add site /name:"%SITE_NAME%" /physicalPath:"%SITE_PATH%" /bindings:http/*:80:
%systemroot%\system32\inetsrv\appcmd set app "%SITE_NAME%/" /applicationPool:"DefaultAppPool"

echo.
echo [3/4] Backend Otomatik Baslatma Ayarlaniyor...
:: Baslangic klasorune kisayol olusturma (VBScript yardimiyla)
set "TARGET_SCRIPT=%~dp0start_backend.bat"
set "SHORTCUT_PATH=%ProgramData%\Microsoft\Windows\Start Menu\Programs\StartUp\UnityBackend.lnk"
set "VBS_SCRIPT=%~dp0create_shortcut.vbs"

echo Set oWS = WScript.CreateObject("WScript.Shell") > "%VBS_SCRIPT%"
echo sLinkFile = "%SHORTCUT_PATH%" >> "%VBS_SCRIPT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%VBS_SCRIPT%"
echo oLink.TargetPath = "%TARGET_SCRIPT%" >> "%VBS_SCRIPT%"
echo oLink.WorkingDirectory = "%~dp0" >> "%VBS_SCRIPT%"
echo oLink.Save >> "%VBS_SCRIPT%"

cscript /nologo "%VBS_SCRIPT%"
del "%VBS_SCRIPT%"

:: Servisi hemen baslat
start "" "%TARGET_SCRIPT%"

echo.
echo ==========================================
echo KURULUM BASARIYLA TAMAMLANDI!
echo.
echo 1. Web Sitesi: http://localhost (IIS uzerinde aktif)
echo 2. Backend: Arkaplanda baslatildi ve her acilista otomatik calisacak.
echo.
echo Artik hicbir seye tiklamaniza gerek yok. Pencereyi kapatabilirsiniz.
echo ==========================================
pause
