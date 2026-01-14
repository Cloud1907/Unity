@echo off
setlocal
chcp 65001 > nul
cd /d "%~dp0"

:MENU
cls
echo ==========================================
echo Unity - YONETIM ARACI
echo ==========================================
echo 1. Veritabani Baglantisini Kontrol Et
echo 2. Uygulamayi Guncelle (Update)
echo 3. Veritabani Guvenligi (Sifre Koyma)
echo 4. Cikis
echo ==========================================
set /p CHOICE="Seciminiz (1-4): "

if "%CHOICE%"=="1" goto CHECK_DB
if "%CHOICE%"=="2" goto UPDATE_APP
if "%CHOICE%"=="3" goto SECURITY_INFO
if "%CHOICE%"=="4" exit /b
goto MENU

:CHECK_DB
cls
echo [1/2] MongoDB Servisi Kontrol Ediliyor...
sc query MongoDB >nul 2>&1
if %errorlevel% neq 0 (
    echo [HATA] MongoDB servisi BULUNAMADI veya CALISMIYOR.
    echo Lutfen 'install_native_iis.bat' ile kurulum yaptiginizdan emin olun.
) else (
    echo [OK] MongoDB servisi calisiyor.
)

echo.
echo [2/2] Baglanti Testi...
powershell -Command "try { $client = New-Object System.Net.Sockets.TcpClient('localhost', 27017); echo '[OK] Port 27017 acik (Baglanti basarili).'; $client.Close(); } catch { echo '[HATA] Port 27017 kapali (MongoDB cevap vermiyor).'; }"

echo.
echo MongoDB Compass Programi ile Baglanmak Icin:
echo URL: mongodb://localhost:27017
echo Database: univera
echo.
pause
goto MENU

:UPDATE_APP
cls
echo ==========================================
echo UYGULAMA GUNCELLEME
echo ==========================================
echo.
echo Guncelleme paketi (yeni kodlar) iceren klasorun yolunu girin.
echo Ornek: C:\Users\Administrator\Desktop\yeni-v2-paket
echo.
set /p UPDATE_PATH="Klasor Yolu: "

if not exist "%UPDATE_PATH%" (
    echo [HATA] Belirtilen klasor bulunamadi!
    pause
    goto MENU
)

echo.
echo [1/3] Yedek Aliniyor...
set BACKUP_NAME=app_backup_%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%
set BACKUP_NAME=%BACKUP_NAME: =0%
xcopy /E /I /Q "app" "backups\%BACKUP_NAME%\app"
echo Yedek alindi: backups\%BACKUP_NAME%

echo.
echo [2/3] Dosyalar Kopyalaniyor...
xcopy /E /I /Y "%UPDATE_PATH%\*" "app\"

echo.
echo [3/3] Backend Yeniden Baslatiliyor...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq Unity Backend*" >nul 2>&1
start "" "start_backend.bat"

echo.
echo GUNCELLEME TAMAMLANDI!
pause
goto MENU

:SECURITY_INFO
cls
echo ==========================================
echo MONGODB GUVENLIGI (SIFRE KOYMA)
echo ==========================================
echo.
echo MongoDB varsayilan olarak sifresiz kurulur (Localhost).
echo Guvenlik icin asagidaki adimlari izleyin:
echo.
echo ADIM 1: KULLANICI OLUSTURMA
echo ---------------------------
echo 1. Sunucuya 'MongoDB Compass' indirin ve kurun via:
echo    https://www.mongodb.com/try/download/compass
echo 2. mongodb://localhost:27017 adresine baglanin.
echo 3. Alt taraftan 'MONGOSH' (Console) acin.
echo 4. Su komutlari yapistirin (Sifreyi kendinize gore degisin):
echo.
echo    use admin
echo    db.createUser({ user: "admin", pwd: "GUCLU_BIR_SIFRE", roles: [ "root" ] })
echo.
echo ADIM 2: YETKILENDIRMEYI ACMA
echo ---------------------------
echo 1. C:\Program Files\MongoDB\Server\7.0\bin\mongod.cfg dosyasini Not Defteri ile acin.
echo 2. '#security:' satirini bulun ve soyle degistirin:
echo.
echo    security:
echo      authorization: enabled
echo.
echo 3. Dosyayi kaydedin ve MongoDB servisini yeniden baslatin (Hizmetler'den).
echo.
echo ADIM 3: BACKEND AYARINI DEGISTIRME
echo --------------------------
echo 1. native-bundle\app\backend\.env dosyasini acin.
echo 2. MONGO_URL satirini guncelleyin:
echo    MONGO_URL=mongodb://admin:GUCLU_BIR_SIFRE@localhost:27017
echo.
pause
goto MENU
