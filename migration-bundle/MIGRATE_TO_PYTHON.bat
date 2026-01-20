@echo off
setlocal
chcp 65001 > nul

echo ==========================================
echo Unity .NET -> Python Gecis Sihirbazi
echo ==========================================

:: 1. Eski .NET Kalintilarini Temizle
echo.
echo [1/5] Eski sistem temizleniyor...
taskkill /F /IM Unity.API.exe >nul 2>&1
taskkill /F /IM w3wp.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1

:: 2. Python Kontrolu ve Kurulumu
echo.
echo [2/5] Python Ortami Kontrol Ediliyor...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [BILGI] Python bulunamadi. Otomatik kuruluyor...
    if exist "installers\python-installer.exe" (
        start /wait installers\python-installer.exe /quiet InstallAllUsers=1 PrependPath=1 Include_test=0
    ) else (
        echo [UYARI] Python installer dosyasi bulunamadi!
        echo Lutfen https://www.python.org/ftp/python/3.12.1/python-3.12.1-amd64.exe adresinden indirip kurun.
        pause
        exit /b
    )
) else (
    echo [OK] Python zaten yuklu.
)

:: 3. PATH Guncellemesi (Aninda gecerli olmasi icin)
set PATH=%PATH%;C:\Program Files\Python312;C:\Program Files\Python312\Scripts

:: 4. Dosya Kurulumu
echo.
echo [3/5] Yeni dosyalar kopyalaniyor...
if not exist "C:\Unity\app" mkdir "C:\Unity\app"
xcopy /E /I /Y "app\*" "C:\Unity\app\"

:: 5. Sanal Ortam ve Bagimliliklar
echo.
echo [4/5] Kutuphaneler Yukleniyor...
cd /d "C:\Unity\app\backend"
python -m venv venv
call venv\Scripts\activate.bat
pip install --no-index --find-links=..\..\wheels -r requirements.txt
if %errorlevel% neq 0 (
    echo [HATA] Offline kurulum basarisiz oldu. Internet varsa online deneniyor...
    pip install -r requirements.txt
)

:: 6. Baslatma
echo.
echo [5/5] Servis Baslatiliyor...
cd /d "C:\Unity"
call KILL_ALL_UNITY.bat >nul 2>&1
start "Unity Backend" "start_backend.bat"

echo.
echo ==========================================
echo GECIS TAMAMLANDI!
echo Lutfen http://localhost:8000/api adresini kontrol edin.
echo ==========================================
pause
