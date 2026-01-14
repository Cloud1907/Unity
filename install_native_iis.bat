@echo off
setlocal
chcp 65001 > nul

echo ==========================================
echo Unity IIS Kurulumu (Profesyonel)
echo ==========================================
cd /d "%~dp0"

:: Yonetici kontrolu
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [HATA] Bu script Yonetici olarak calistirilmali!
    echo Sag tikla - "Yonetici olarak calistir" deyin.
    pause
    exit /b 1
)

echo [1/7] Python Yukleniyor...
if exist "C:\Python312\python.exe" (
    echo Python zaten yuklu.
) else (
    echo Kurulum basladi, lutfen bekleyin...
    start /wait installers\python-installer.exe /quiet InstallAllUsers=1 PrependPath=1 Include_test=0
)

echo.
echo [2/7] MongoDB Yukleniyor...
if exist "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" (
    echo MongoDB zaten yuklu.
) else (
    echo Kurulum basladi...
    start /wait msiexec /i installers\mongodb.msi /qn
)

echo.
echo [3/7] IIS URL Rewrite Modulu Yukleniyor...
if exist "%ProgramFiles%\IIS\Microsoft Web Platform Installer\rewrite_amd64.msi" (
    echo URL Rewrite zaten yuklu.
) else (
    echo Kurulum basladi...
    start /wait msiexec /i installers\rewrite.msi /qn
)

echo.
echo [4/7] Python Kutuphaneleri Hazirlaniyor...
if not exist "app\backend\venv" (
    "C:\Program Files\Python312\python.exe" -m venv app\backend\venv
    if errorlevel 1 python -m venv app\backend\venv
)
call app\backend\venv\Scripts\activate.bat
echo Paketler yukleniyor (bu biraz surebilir)...
pip install --no-index --find-links=wheels -r app\backend\requirements.txt
:: Uvicorn'u en sona manuel bir daha yukle garanti olsun
pip install --no-index --find-links=wheels uvicorn colorama

echo.
echo [5/7] IIS Ozellikleri Kontrol Ediliyor...
dism /online /get-featureinfo /featurename:IIS-WebServerRole | find "State : Enabled" >nul
if errorlevel 1 (
    echo IIS yuklu degil, aktif hale getiriliyor...
    dism /online /enable-feature /featurename:IIS-WebServerRole /all /norestart
    dism /online /enable-feature /featurename:IIS-WebServer /all /norestart
    dism /online /enable-feature /featurename:IIS-ApplicationDevelopment /all /norestart
    dism /online /enable-feature /featurename:IIS-ASPNET45 /all /norestart
    dism /online /enable-feature /featurename:IIS-WebSockets /all /norestart
    echo IIS kuruldu. Sunucuyu yeniden baslatmaniz onerilir.
) else (
    echo IIS zaten aktif.
)

echo.
echo [6/7] IIS Sitesi Olusturuluyor...
set SITE_NAME=Unity
set SITE_PATH=%~dp0app\frontend-build

:: Eski siteyi sil
%systemroot%\system32\inetsrv\appcmd delete site "%SITE_NAME%" >nul 2>&1

:: Yeni site olustur (Port 80)
%systemroot%\system32\inetsrv\appcmd add site /name:"%SITE_NAME%" /physicalPath:"%SITE_PATH%" /bindings:http/*:80:
%systemroot%\system32\inetsrv\appcmd set app "%SITE_NAME%/" /applicationPool:"DefaultAppPool"

echo.
echo ==========================================
echo KURULUM TAMAMLANDI!
echo.
echo Frontend: http://localhost (IIS uzerinden)
echo Backend: Otomatik baslatma icin 'start_backend.bat' calistirin
echo.
echo NOT: Backend'i baslatmayi unutmayin!
echo ==========================================
