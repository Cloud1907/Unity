@echo off
setlocal DisableDelayedExpansion
cls
title UnityAnalysis - MANUEL DEPLOY (SABIT KAYNAK)

echo ========================================================
echo  UNITY ANALYSIS - MANUEL DEPLOYMENT
echo ========================================================
echo.

:: ==============================================================================================
::  AYARLAR: KAYNAK VE HEDEF
:: ==============================================================================================

:: BURASINI DUZENLEYIN: Kaynak dosyalarin tam yolu.
:: NOT: Eger bu script "Sunucu"da calisiyorsa ve dosyalari sizin bilgisayarinizdan cekecekse,
:: buraya AG YOLU (Network Path) yazmalisiniz. Ornek: \\BILGISAYAR_ADI\Paylasim\UnityAnalysis
:: Eger ayni makine ise, normal dosya yolu kalsin.
set "SOURCE_PATH=C:\Users\univera\.gemini\antigravity\scratch\UnityAnalysis"

:: Hedef (IIS) Yolu:
set "DEST_PATH=C:\inetpub\wwwroot\UnityApp"

:: Log Yolu:
set "LOG_FILE=C:\SetupLogs\unity_deploy.log"


echo [DEBUG] Ayarlanan Kaynak: %SOURCE_PATH%
echo.

:: ==============================================================================================
::  KONTROL
:: ==============================================================================================
if not exist "%SOURCE_PATH%\dotnet-backend" (
    color 4F
    echo [HATA] Kaynak klasor bulunamadi!
    echo Aranan: "%SOURCE_PATH%\dotnet-backend"
    echo.
    echo 1. Bu scripti IIS sunucusunda calistiriyorsaniz, sunucunun bu yolu gormesi imkansizdir.
    echo    (Cunku sunucunun C: surucusu ile sizin bilgisayarinizin C: surucusu farklidir.)
    echo 2. Cozum: Dosyalari sunucuya kopyalayin veya Ag Paylasimi acarak yolu \\IP\Paylasim seklinde girin.
    echo.
    echo YENI BIR YOL GIRMEK ISTER MISINIZ?
    set /p "NEW_PATH=Yol (Bos birakirsaniz Cikis yapilir): "
)

if defined NEW_PATH (
    set "SOURCE_PATH=%NEW_PATH:"=%"
)

:: Tekrar Kontrol
if not exist "%SOURCE_PATH%\dotnet-backend" (
    echo [KRITIK] Yol hala gecersiz. Cikis yapiliyor.
    pause
    exit /b
)

echo [OK] Kaynak dogrulandi.
echo.

:: ==============================================================================================
::  ISLEMLER
:: ==============================================================================================
if not exist "C:\SetupLogs" mkdir "C:\SetupLogs"

echo Hedef: %DEST_PATH%
echo Islem: Kopyalama (SAFE MODE - Silme Yok)
echo.
set /p "ONAY=Baslatilsin mi? (E/H): "
if /i not "%ONAY%"=="E" exit /b

echo [BILGI] Servisler durduruluyor...
%windir%\system32\inetsrv\appcmd.exe stop apppool /apppool.name:"UnityApp" >nul 2>&1
net stop W3SVC /y >nul 2>&1

echo [BILGI] Kopyalaniyor...
robocopy "%SOURCE_PATH%" "%DEST_PATH%" /E /IS /IT /Z /R:2 /W:2 /NP /LOG+:"%LOG_FILE%" /TEE

echo [BILGI] Servisler baslatiliyor...
net start W3SVC >nul 2>&1
%windir%\system32\inetsrv\appcmd.exe start apppool /apppool.name:"UnityApp" >nul 2>&1

echo.
echo ISLEM TAMAMLANDI.
pause
