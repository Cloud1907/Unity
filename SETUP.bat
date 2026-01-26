@echo off
setlocal EnableDelayedExpansion
cls
title UnityAnalysis - OFFLINE SETUP
color 1F

echo ========================================================
echo  UNITY ANALYSIS - BASIT & GUCLU KURULUM (OFFLINE)
echo ========================================================
echo.

:: =======================================================
::  1. YONETICI YETKISI KONTROLU
:: =======================================================
net session >nul 2>&1
if %errorLevel% neq 0 (
    color 4F
    echo [HATA] Lutfen bu dosyaya sag tiklayip "Yonetici Olarak Calistir" deyin.
    echo Erisim reddedildi hatalarini onlemek icin bu sarttir.
    pause
    exit /b 1
)

:: =======================================================
::  AYARLAR
:: =======================================================
:: Script proje kok dizininde veya scripts icinde olabilir, bu yuzden kaynak belirleniyor
pushd "%~dp0"
set "SOURCE_PATH=%CD%"
popd

set "DEST_PATH=C:\inetpub\wwwroot\UnityApp"
set "SITE_NAME=UnityApp"
set "PORT=8080"
set "APPCMD=%windir%\system32\inetsrv\appcmd.exe"

echo Kaynak: %SOURCE_PATH%
echo Hedef : %DEST_PATH%
echo Site  : %SITE_NAME% (%PORT%)
echo.
echo Kurulum Basliyor...
timeout /t 3 >nul

:: =======================================================
::  2. SERVISLERI DURDURMA
:: =======================================================
echo.
echo [1/5] IIS Servisi Durduruluyor...
net stop W3SVC /y

:: =======================================================
::  3. DOSYA YONETIMI (XCOPY)
:: =======================================================
echo.
echo [2/5] Dosyalar Kopyalaniyor...

:: Hedef klasor yoksa olustur
if not exist "%DEST_PATH%" (
    mkdir "%DEST_PATH%"
    echo    + Hedef klasor olusturuldu.
)

:: Dosyalari kopyala (Alt klasorler, boslar dahil, uzerine yaz)
xcopy "%SOURCE_PATH%\*" "%DEST_PATH%\" /y /s /e /i

if %errorLevel% equ 0 (
    echo    + Kopyalama BASARILI.
) else (
    color 4F
    echo    - Kopyalama sirasinda HATA olustu!
    pause
    exit /b
)

:: =======================================================
::  4. IIS SITE VE PORT YONETIMI (APPCMD)
:: =======================================================
echo.
echo [3/5] IIS Yapilandirmasi Kontrol Ediliyor...

:: Site var mi kontrol et
"%APPCMD%" list site /name:"%SITE_NAME%" >nul 2>&1
if %errorLevel% equ 0 (
    echo    + '%SITE_NAME%' sitesi zaten mevcut, ayarlara dokunulmuyor.
) else (
    echo    + Yeni Site Olusturuluyor (%PORT%)...
    :: AppPool Olustur (Varsa hata vermez veya gecer)
    "%APPCMD%" add apppool /name:"%SITE_NAME%" /managedRuntimeVersion:"v4.0" /managedPipelineMode:"Integrated" >nul 2>&1
    
    :: Siteyi Olustur
    "%APPCMD%" add site /name:"%SITE_NAME%" /bindings:http/*:%PORT%: /physicalPath:"%DEST_PATH%" >nul 2>&1
    
    :: Siteyi AppPool'a ata
    "%APPCMD%" set app "%SITE_NAME%/" /applicationPool:"%SITE_NAME%" >nul 2>&1
    
    echo    + Site ve AppPool olusturuldu.
)

:: =======================================================
::  5. IZINLERI TANIMLA (ACCESS DENIED COZUMU)
:: =======================================================
echo.
echo [4/5] Klasor Izinleri Ayarlaniyor...

:: IIS AppPool kimligine tam yetki ver (Sanal Hesap)
icacls "%DEST_PATH%" /grant "IIS AppPool\%SITE_NAME%":F /T /Q
:: Alternatif: Standart IIS kullanicisi icin de ver (Garanti olsun)
icacls "%DEST_PATH%" /grant "IIS_IUSRS":F /T /Q

echo    + Izinler verildi.

:: =======================================================
::  6. BASLAT
:: =======================================================
echo.
echo [5/5] IIS Servisi Baslatiliyor...
net start W3SVC

echo.
echo ========================================================
echo  KURULUM TAMAMLANDI!
echo ========================================================
echo  Site Adresi: http://localhost:%PORT%
echo.
pause
