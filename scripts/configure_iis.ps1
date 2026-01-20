param (
    [string]$SiteName = "UnityApp",
    [int]$Port = 80,
    [string]$PhysicalPath
)

Write-Host "IIS Konfigurasyonu Basliyor..." -ForegroundColor Cyan

# IIS Yonetim Modulunu Yukle
try {
    Import-Module WebAdministration
} catch {
    Write-Host "WebAdministration modulu yuklenemedi. IIS kurulu mu?" -ForegroundColor Red
    exit 1
}

# 1. IIS Kurulu degilse kur (Server only)
if ((Get-WindowsFeature Web-Server).InstallState -ne "Installed") {
    Write-Host "IIS Rollari Yukleniyor..." -ForegroundColor Yellow
    Install-WindowsFeature -Name Web-Server -IncludeManagementTools
}

# 2. Siteyi Temizle (Varsa sil)
if (Test-Path "IIS:\Sites\$SiteName") {
    Write-Host "Mevcut site ($SiteName) siliniyor..." -ForegroundColor Yellow
    Remove-Website -Name $SiteName
}

# Varsayilan Web Sitesi port 80 kullaniyorsa ve biz de 80 sectiysek cakisma olabilir.
if ($Port -eq 80 -and (Test-Path "IIS:\Sites\Default Web Site")) {
    $defaultSite = Get-Item "IIS:\Sites\Default Web Site"
    if ($defaultSite.state -eq "Started") {
        Write-Host "UYARI: 'Default Web Site' 80 portunu kullaniyor olabilir. Durduruluyor..." -ForegroundColor Yellow
        Stop-Website -Name "Default Web Site"
    }
}

# 3. Yeni Site Olustur
Write-Host "Yeni site olusturuluyor -> Name: $SiteName, Port: $Port, Path: $PhysicalPath" -ForegroundColor Green
New-Website -Name $SiteName -Port $Port -PhysicalPath $PhysicalPath -ApplicationPool "DefaultAppPool" -Force

Write-Host "IIS Ayarlari Tamamlandi." -ForegroundColor Green
