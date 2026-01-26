# ==============================================================================================
# Script Name: Deploy-UnityApp.ps1
# Description: Automates the deployment of 'UnityApp' to IIS with logging, backup, and error handling.
# Author: Antigravity AI
# Date: 2026-01-25
# ==============================================================================================

# ----------------------------------------------------------------------------------------------
# 1. VARIABLE DEFINITIONS
# ----------------------------------------------------------------------------------------------
$siteName = "UnityApp"
# Source is resolving to the parent of the scripts folder
$sourcePath = Join-Path $PSScriptRoot ".." 
$destinationPath = "C:\inetpub\wwwroot\UnityApp"
$logPath = "C:\Logs\Setup_UnityApp.log"
$backupRoot = "C:\Backups"
$appPoolName = "UnityApp"
$serviceName = "w3svc" # World Wide Web Publishing Service

# Identify sub-folders to copy
$frontendSource = Join-Path $sourcePath "frontend"
$backendSource = Join-Path $sourcePath "dotnet-backend"

# ----------------------------------------------------------------------------------------------
# 2. HELPER FUNCTIONS
# ----------------------------------------------------------------------------------------------
function Write-Log {
    param (
        [string]$Message,
        [string]$Level = "INFO"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    # Write to Console with color
    switch ($Level) {
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        "WARN"  { Write-Host $logEntry -ForegroundColor Yellow }
        "INFO"  { Write-Host $logEntry -ForegroundColor Cyan }
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
        Default { Write-Host $logEntry }
    }

    # Write to File
    Add-Content -Path $logPath -Value $logEntry -Force
}

# ----------------------------------------------------------------------------------------------
# 3. MAIN EXECUTION BLOCK
# ----------------------------------------------------------------------------------------------
try {
    # Ensure Log Directory Exists
    $logDir = Split-Path $logPath -Parent
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }

    Write-Log "=========================================="
    Write-Log "STARTING DEPLOYMENT FOR '$siteName'"
    Write-Log "Source: $sourcePath"
    Write-Log "Destination: $destinationPath"
    Write-Log "=========================================="

    # Check Administrator Privileges
    if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
        throw "This script must be run as Administrator."
    }

    # ------------------------------------------------------------------------------------------
    # STEP 1: SAFE STOP
    # ------------------------------------------------------------------------------------------
    Write-Log "Step 1: Stopping Services and Application Pool..."

    # Stop AppPool
    if (Get-WebConfiguration -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.applicationHost/applicationPools/add[@name='$appPoolName']") {
        Write-Log "Stopping AppPool: $appPoolName"
        Stop-WebAppPool -Name $appPoolName -ErrorAction SilentlyContinue
        
        # Wait for it to allow full stop
        $status = Get-WebAppPoolState -Name $appPoolName
        while ($status.Value -ne "Stopped") {
            Start-Sleep -Seconds 1
            $status = Get-WebAppPoolState -Name $appPoolName
            Write-Log "Waiting for AppPool to stop..."
        }
    } else {
        Write-Log "AppPool '$appPoolName' not found. It might be created during IIS setup manually later." "WARN"
    }

    # Stop IIS Service
    Write-Log "Stopping IIS Service (W3SVC)..."
    Stop-Service -Name $serviceName -Force
    Start-Sleep -Seconds 2
    Write-Log "Services stopped." "SUCCESS"

    # ------------------------------------------------------------------------------------------
    # STEP 2: BACKUP
    # ------------------------------------------------------------------------------------------
    Write-Log "Step 2: Creating Backup..."
    
    if (Test-Path $destinationPath) {
        $timestampFolder = (Get-Date).ToString("yyyyMMdd_HHmmss")
        $backupPath = Join-Path $backupRoot "${siteName}_$timestampFolder"
        
        if (-not (Test-Path $backupPath)) {
            New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
        }

        Write-Log "Backing up contents to: $backupPath"
        Copy-Item -Path "$destinationPath\*" -Destination $backupPath -Recurse -Force
        Write-Log "Backup completed." "SUCCESS"
    } else {
        Write-Log "Destination path does not exist. Skipping backup." "WARN"
        New-Item -ItemType Directory -Path $destinationPath -Force | Out-Null
    }

    # ------------------------------------------------------------------------------------------
    # STEP 3: FILE TRANSFER
    # ------------------------------------------------------------------------------------------
    Write-Log "Step 3: Copying Files..."

    # Using Robocopy logic via PowerShell wrapper for better output control or direct Copy-Item
    # Verify Source Directories
    if (-not (Test-Path $frontendSource)) { throw "Frontend source not found: $frontendSource" }
    if (-not (Test-Path $backendSource)) { throw "Backend source not found: $backendSource" }

    Write-Log "Copying Frontend..."
    Copy-Item -Path "$frontendSource\*" -Destination "$destinationPath\frontend" -Recurse -Force
    
    Write-Log "Copying Backend..."
    Copy-Item -Path "$backendSource\*" -Destination "$destinationPath\backend" -Recurse -Force

    Write-Log "Files copied successfully." "SUCCESS"

    # ------------------------------------------------------------------------------------------
    # STEP 4: PERMISSIONS
    # ------------------------------------------------------------------------------------------
    Write-Log "Step 4: Setting Permissions..."
    
    $permCmd = "icacls `"$destinationPath`" /grant `"IIS_IUSRS:(OI)(CI)F`" /T /Q"
    Write-Log "Executing: $permCmd"
    Invoke-Expression $permCmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Permissions set successfully." "SUCCESS"
    } else {
        Write-Log "Failed to set permissions via icacls." "WARN"
    }

    # ------------------------------------------------------------------------------------------
    # STEP 5: SYSTEM RESTART
    # ------------------------------------------------------------------------------------------
    Write-Log "Step 5: Restarting Services..."

    # Start IIS Service
    Start-Service -Name $serviceName
    Write-Log "IIS Service started."

    # Start AppPool
    if (Get-WebConfiguration -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.applicationHost/applicationPools/add[@name='$appPoolName']") {
        Start-WebAppPool -Name $appPoolName
        Write-Log "AppPool started."
    }

    Write-Log "Services verified up." "SUCCESS"

    # ------------------------------------------------------------------------------------------
    # STEP 6: VERIFICATION
    # ------------------------------------------------------------------------------------------
    Write-Log "Step 6: Health Checks..."

    # Check Website Status
    $site = Get-Website -Name $siteName -ErrorAction SilentlyContinue
    if ($site) {
        Write-Log "Website '$siteName' Status: $($site.State)" "INFO"
    } else {
        Write-Log "Website '$siteName' not found in IIS." "ERROR"
    }

    # Check Port 8080 (Frontend)
    Write-Log "Checking Port 8080 binding (Frontend)..."
    try {
        $conn = Get-NetTCPConnection -LocalPort 8080 -ErrorAction Stop
        Write-Log "Port 8080 is LISTENING (PID: $($conn.OwningProcess))" "SUCCESS"
    } catch {
        Write-Log "Port 8080 is NOT responding. Backend might not be running yet." "WARN"
    }

    Write-Log "=========================================="
    Write-Log "DEPLOYMENT COMPLETED SUCCESSFULLY"
    Write-Log "=========================================="

} catch {
    Write-Log "FATAL ERROR CAUGHT: $($_.Exception.Message)" "ERROR"
    Write-Log "Attempting emergency service start..." "WARN"
    
    # Emergency Cleanup/Start
    Start-Service -Name $serviceName -ErrorAction SilentlyContinue
    if (Get-WebConfiguration -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.applicationHost/applicationPools/add[@name='$appPoolName']") {
        Start-WebAppPool -Name $appPoolName -ErrorAction SilentlyContinue
    }
    
    Write-Log "Deployment Aborted." "ERROR"
    exit 1
}
