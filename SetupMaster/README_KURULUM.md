# Unity Application - Sunucu Kurulum Paketi

## Gereksinimler

### Yazılım Gereksinimleri
- ✅ Windows Server (IIS destekli)
- ✅ IIS (Internet Information Services) - Yüklü ve aktif olmalı
- ✅ .NET 9.0 Hosting Bundle - **ÖNEMLİ: Kurulum öncesi yüklenmelidir!**

### .NET 9.0 Hosting Bundle Kurulumu
Kuruluma başlamadan ÖNCE .NET 9.0 Hosting Bundle'ı yüklemelisiniz:

**İndirme Bağlantısı:**
https://dotnet.microsoft.com/download/dotnet/9.0

"ASP.NET Core 9.0 Runtime - Windows Hosting Bundle Installer" seçeneğini indirin ve çalıştırın.

Kurulumdan sonra:
```powershell
iisreset
```

## Kurulum Adımları

### 1. Setup Paketini Hazırlayın
- Bu klasördeki tüm dosyaları sunucuya kopyalayın
- Klasör konumu önemli değil (örn: `C:\Temp\UnitySetup`)

### 2. Yönetici Olarak Çalıştırın
- `SETUP.bat` dosyasına **SAĞ TIK**layın
- **"Yönetici olarak çalıştır"** seçeneğini tıklayın

### 3. Kurulum İlerleyişini İzleyin
Script otomatik olarak:
- [1/6] IIS servisini durduracak
- [2/6] Dosyaları `C:\inetpub\wwwroot\UnityApp` konumuna kopyalayacak
- [3/6] IIS sitesi "UnityApp" oluşturacak (Port: 8085)
- [4/6] IIS konfigürasyonlarının kilidini açacak
- [5/6] Klasör izinlerini ayarlayacak
- [6/6] IIS servisini başlatacak

### 4. Kurulum Tamamlandı
Kurulum başarıyla tamamlandığında şu mesajı göreceksiniz:
```
========================================================
 KURULUM TAMAMLANDI!
========================================================
 Site Adresi: http://localhost:8085
```

## Kurulum Sonrası Doğrulama

### 1. Tarayıcıda Test Edin
```
http://localhost:8085
```

### 2. Swagger API'yi Kontrol Edin
```
http://localhost:8085/swagger
```

### 3. PowerShell ile Doğrulayın
```powershell
# IIS sitesini kontrol et
Get-IISSite -Name "UnityApp"

# Port dinlemesini kontrol et
Get-NetTCPConnection -LocalPort 8085

# HTTP durumunu test et
Invoke-WebRequest -Uri "http://localhost:8085" -UseBasicParsing
```

## Yapılandırma Dosyaları

### Port Değiştirmek İsterseniz
`SETUP.bat` dosyasını düzenleyin, 34. satırı bulun:
```batch
set "PORT=8085"
```
İstediğiniz port numarasını yazın.

### Veritabanı Bağlantı Dizesi
`appsettings.json` dosyasında:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=10.135.140.17\\yazdes;Database=UnityDB;User Id=UNIVERA;Password=P@ssw0rd;TrustServerCertificate=True;"
}
```
Sunucunuza göre bu bilgileri güncelleyin.

## Sorun Giderme

### Hata: "Erişim engellendi"
- Script'i **yönetici olarak** çalıştırdığınızdan emin olun

### Hata: HTTP 500.19
- .NET 9.0 Hosting Bundle'ın yüklendiğinden emin olun
- `iisreset` komutunu çalıştırın

### Hata: "Port zaten kullanımda"
- Başka bir uygulama 8085 portunu kullanıyor olabilir
- `SETUP.bat` içinde farklı bir port belirleyin

### Site Çalışmıyor
Logları kontrol edin:
```
C:\inetpub\wwwroot\UnityApp\logs\stdout_*.log
```

## Destek

Sorun yaşarsanız:
1. Event Viewer > Windows Logs > Application kontrolünü yapın
2. IIS Manager > Sites > UnityApp > Browse *:8085 ile test edin
3. Application Pool'un çalıştığından emin olun

## Teknik Detaylar

**Site Adı:** UnityApp  
**Port:** 8085  
**Physical Path:** C:\inetpub\wwwroot\UnityApp  
**Application Pool:** UnityApp (No Managed Code)  
**Runtime:** .NET 9.0 / ASP.NET Core 9.0

**İzinler:**
- IIS_IUSRS: Full Control
- IIS AppPool\UnityApp: Full Control

**IIS Modülleri:**
- AspNetCoreModuleV2 (Hosting Bundle ile gelir)
