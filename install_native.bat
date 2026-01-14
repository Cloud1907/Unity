@echo off
setlocal
chcp 65001 > nul

echo ==========================================
echo Unity Native Kurulum (Docker'siz)
echo ==========================================
cd /d "%~dp0"

echo [1/4] Python Yukleniyor...
if exist "C:\Python312\python.exe" (
    echo Python zaten yuklu, geciliyor.
) else (
    echo Python kuruluyor, lutfen bekleyin...
    start /wait installers\python-installer.exe /quiet InstallAllUsers=1 PrependPath=1 Include_test=0
    echo Python kuruldu.
)

echo.
echo [2/4] Veritabani (MongoDB) Yukleniyor...
if exist "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" (
    echo MongoDB zaten yuklu, geciliyor.
) else (
    echo MongoDB kuruluyor, lutfen bekleyin...
    start /wait msiexec /i installers\mongodb.msi /qn
    echo MongoDB kuruldu.
)

echo.
echo [3/4] Python Sanal Ortam (venv) Hazirlaniyor...
if not exist "app\backend\venv" (
    "C:\Program Files\Python312\python.exe" -m venv app\backend\venv
    if errorlevel 1 (
         :: Fallback to standard path if Program Files check failed
         python -m venv app\backend\venv
    )
)

echo.
echo [4/4] Kutuphaneler Yukleniyor (Offline)...
call app\backend\venv\Scripts\activate.bat
pip install --no-index --find-links=wheels -r app\backend\requirements.txt
if errorlevel 1 (
    echo [UYARI] Bazi paketler yuklenemedi. Eger 'pyodbc' hatasi alirsaniz lutfen Microsoft ODBC Driver 18'i manuel kurun.
)

echo.
echo ==========================================
echo KURULUM TAMAMLANDI!
echo Baslatmak icin 'start_native.bat' dosyasina tiklayin.
echo ==========================================
pause
