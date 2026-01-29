---
description: Unity application için IIS uyumlu kurulum paketi (v20) oluşturur.
---

# Setup Paketi Oluşturma

Unity uygulaması için Windows IIS uyumlu, self-contained kurulum paketi oluşturur.

## Ön Koşullar
- Frontend build güncel olmalı
- Backend derleme hatasız olmalı

## Adımlar

// turbo
1. Frontend'i production için derle:
```bash
cd frontend && npm run build
```

// turbo
2. Backend'i self-contained olarak publish et:
```bash
cd dotnet-backend/Unity.API && dotnet publish -c Release -r win-x64 --self-contained true -o ~/Desktop/unity_publish
```

// turbo
3. Frontend build dosyalarını wwwroot'a kopyala:
```bash
cp -r frontend/build/* ~/Desktop/unity_publish/wwwroot/
```

4. web.config dosyasını oluştur (InProcess hosting):
```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <location path="." inheritInChildApplications="false">
    <system.webServer>
      <handlers>
        <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
      </handlers>
      <aspNetCore processPath=".\Unity.API.exe" stdoutLogEnabled="true" stdoutLogFile=".\logs\stdout" hostingModel="inprocess" />
      <modules>
        <remove name="WebDAVModule" />
      </modules>
    </system.webServer>
  </location>
</configuration>
```

// turbo
5. ZIP paketi oluştur:
```bash
cd ~/Desktop/unity_publish && zip -r "../Unity Setup.zip" .
```

## Çıktı
- `~/Desktop/Unity Setup.zip` (~64-114 MB)
- Self-contained, .NET runtime gerektirmez
- IIS'e doğrudan deploy edilebilir

## Önemli Kontroller
- [ ] `localhost:8080` referansı olmadığını doğrula: `grep -r "localhost:8080" frontend/build/static/js/*.js | wc -l` (0 olmalı)
- [ ] web.config mevcut
- [ ] wwwroot/index.html mevcut
