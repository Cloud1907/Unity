# Setup Package Contents

This is the Unity Application deployment package for IIS.

## Quick Start

1. **IMPORTANT**: Install .NET 9.0 Hosting Bundle first!
   https://dotnet.microsoft.com/download/dotnet/9.0

2. Right-click **SETUP.bat** → **Run as Administrator**

3. Access: http://localhost:8085

## Full Instructions

See **README_KURULUM.md** for detailed installation guide.

## What's Inside

- `SETUP.bat` - Automated IIS setup script (Port 8085)
- `Unity.API.exe` - Application executable
- `Unity.API.dll` - Main application library
- `web.config` - IIS configuration (clean, no locked sections)
- `appsettings.json` - Application settings
- `wwwroot/` - Static web files
- `runtimes/` - Runtime dependencies

## Support

For questions or issues, check the logs at:
`C:\inetpub\wwwroot\UnityApp\logs\`
