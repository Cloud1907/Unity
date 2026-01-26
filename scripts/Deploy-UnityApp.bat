@echo off
setlocal EnableDelayedExpansion
cls
title UnityApp Profesyonel Kurulum Araci

:: ==============================================================================================
::  SCRIPT AYARLARI VE DEGISKENLER
:: ==============================================================================================
:: Lutfen asagidaki yollari kendi ortaminiza gore duzenleyin
:: Eger script proje klasorunun icindeyse (scripts klasoru), kaynak otomatik olarak bir ust dizin secilir:
pushd "%~dp0.."
set "SOURCE_PATH=%CD%"
popd
set "DEST_PATH=C:\inetpub\wwwroot\UnityApp"

:: Güvenlik Kontrolü: Doğru klasörde miyiz?
if not exist "%SOURCE_PATH%\dotnet-backend" (
    color 4F
    echo [HATA] Kaynak klasor dogrulanamadi!
    echo Beklenen: "%SOURCE_PATH%\dotnet-backend"
    echo Script yanlis klasorde olabilir. Lutfen 'scripts' klasoru icinden calistirin.
    pause
    exit /b 1
)
set "LOG_PATH=C:\SetupLogs\deploy_log.txt"
set "APP_POOL=UnityApp"

:: Log Klasoru Kontrolu
if not exist "C:\SetupLogs" mkdir "C:\SetupLogs"

:: ==============================================================================================
::  1. YONETICI YETKISI KONTROLU
:: ==============================================================================================
call :Logger "Yonetici yetkisi kontrol ediliyor..."
net session >nul 2>&1
if %errorLevel% neq 0 (
    color 4F
    echo [HATA] Bu script YONETICI [Administrator] yetkisi ile calistirilmalidir.
    call :Logger "[KRITIK] Yonetici haklari yok. Script durduruldu."
    pause
    exit /b 1
)
call :Logger "[BASARILI] Yonetici yetkisi onaylandi."

:: ==============================================================================================
::  2. SERVISLERI GUVENLI DURDURMA
:: ==============================================================================================
call :Logger "--------------------------------------------------------"
call :Logger "ADIM 1: Servisler ve Uygulama Havuzu Durduruluyor..."
call :Logger "--------------------------------------------------------"

:: AppPool Durdurma
%windir%\system32\inetsrv\appcmd.exe stop apppool /apppool.name:"%APP_POOL%" >nul 2>&1
if %errorLevel% equ 0 (
    call :Logger "[OK] '%APP_POOL%' uygulama havuzu durduruldu."
) else (
    call :Logger "[UYARI] '%APP_POOL%' durdurulamadi veya bulunamadi."
)

:: IIS Servisini Durdurma (Dosya kilitlemelerini onlemek icin)
net stop W3SVC /y >nul 2>&1
call :Logger "[OK] W3SVC (IIS) servisi durduruldu."

:: ==============================================================================================
::  3. DOSYA KOPYALAMA (ROBOCOPY)
:: ==============================================================================================
call :Logger "--------------------------------------------------------"
call :Logger "ADIM 2: Dosyalar Kopyalaniyor (Akilli Senkronizasyon)..."
call :Logger "Kaynak: %SOURCE_PATH%"
call :Logger "Hedef : %DEST_PATH%"
call :Logger "--------------------------------------------------------"

:: Robocopy Parametreleri:
:: /E     : Alt klasorleri kopyala (bos olanlar dahil)
:: /Z     : Restartable mode (Ag kesintisi olursa kaldigi yerden devam eder)
:: /IS    : Ayni dosyalarin uzerine yaz (Guvenlik icin)
:: /IT    : Degisen ozellikleri kopyala
:: /PURGE : Kaynakta olmayan dosyalari hedefte sil (Temiz deployment)
:: /NP    : Ilerleme yuzdesini gizle (Log dosyasini sisirmemek icin)
:: /R:3   : Hata durumunda 3 kez dene
:: /W:2   : Denemeler arasi 2 saniye bekle

robocopy "%SOURCE_PATH%" "%DEST_PATH%" /E /Z /IS /IT /NP /R:3 /W:2 /LOG+:"%LOG_PATH%" /TEE

:: Robocopy Cikis Kodlari (Exit Codes):
:: 0-7 arasi kodlar basarili kabul edilir (Kopyalandi, degisiklik yok vb.)
:: 8 ve uzeri kritk hatadir.
if %ERRORLEVEL% GEQ 8 (
    color 4F
    call :Logger "[KRITIK HATA] Kopyalama islemi basarisiz oldu! (Hata Kodu: %ERRORLEVEL%)"
    goto :Recover
) else (
    call :Logger "[BASARILI] Dosya senkronizasyonu tamamlandi."
)

:: ==============================================================================================
::  4. IZIN VE YETKILENDIRME
:: ==============================================================================================
call :Logger "--------------------------------------------------------"
call :Logger "ADIM 3: Dosya Izinleri Ayarlaniyor (IIS_IUSRS)..."
call :Logger "--------------------------------------------------------"

:: IIS Kullanici Grubuna Okuma/Yazma izni ver
icacls "%DEST_PATH%" /grant "IIS_IUSRS:(OI)(CI)F" /T /Q >nul 2>&1
if %errorLevel% equ 0 (
    call :Logger "[OK] IIS_IUSRS grubuna yetkiler tanimlandi."
) else (
    call :Logger "[UYARI] Izinler atanirken bir sorun olustu."
)

:: ==============================================================================================
::  5. SERVISLERI BASLATMA
:: ==============================================================================================
:StartServices
call :Logger "--------------------------------------------------------"
call :Logger "ADIM 4: Servisler Tekrar Baslatiliyor..."
call :Logger "--------------------------------------------------------"

net start W3SVC >nul 2>&1
call :Logger "[OK] IIS servisi baslatildi."

%windir%\system32\inetsrv\appcmd.exe start apppool /apppool.name:"%APP_POOL%" >nul 2>&1
call :Logger "[OK] Uygulama havuzu baslatildi."

:: ==============================================================================================
::  6. DOGRULAMA
:: ==============================================================================================
call :Logger "--------------------------------------------------------"
call :Logger "ADIM 5: Sistem Kontrolu (Health Check)..."
call :Logger "--------------------------------------------------------"

:: Port 8080 Kontrolu
netstat -ano | findstr :8080 >nul
if %errorLevel% equ 0 (
    color 2F
    call :Logger "[BASARILI] Uygulama 8080 portunda calisiyor."
    call :Logger "KURULUM TAMAMLANDI!"
    timeout /t 5
    exit /b 0
) else (
    color 6F
    call :Logger "[UYARI] Uygulama portunda (8080) aktivite gorulmedi. Lutfen IIS loglarini kontrol edin."
    pause
    exit /b 0
)

:: ==============================================================================================
::  HATA KURTARMA (RECOVERY)
:: ==============================================================================================
:Recover
call :Logger "[ROLLBACK] Hata nedeniyle servisler acil olarak tekrar aciliyor..."
net start W3SVC >nul 2>&1
%windir%\system32\inetsrv\appcmd.exe start apppool /apppool.name:"%APP_POOL%" >nul 2>&1
call :Logger "Servisler geri yuklendi. Lutfen log dosyasini inceleyin: %LOG_PATH%"
pause
exit /b 1

:: ==============================================================================================
::  FONKSIYONLAR
:: ==============================================================================================
:Logger
set "msg=%~1"
set "timestamp=%date% %time%"
echo [%timestamp%] %msg%
echo [%timestamp%] %msg% >> "%LOG_PATH%"
exit /b
