---
description: Unity Application Production Build & Setup
---

# Production Build Workflow

Bu workflow, uygulamanın IIS uyumlu, VS Publish mantığında **"Flat"** (iç içe klasör olmayan) kurulum paketini oluşturur. Uygulama, üretim ortamında (Production) sunucu IP ve portundan bağımsız çalışacak şekilde (dinamik API URL) konfigüre edilmiştir.

## Otomatik Kurulum (Önerilen)

Projeyi derlemek ve paketlemek için aşağıdaki komutu çalıştırın. Bu script temizlik, derleme, entegrasyon ve flat-zip işlemlerini otomatik yapar.

// turbo
```bash
./build_production.sh
```

**Kritik Kural:**
- Çıktı Dosyası: Masaüstünde **`UnityApp_Setup.zip`** ismiyle oluşmalıdır.
- Dosya Yapısı: ZIP dosyası açıldığında dosyalar doğrudan kök dizinde olmalıdır (klasör içinde olmamalıdır).

## Manuel Adımlar (Referans)

Eğer script çalıştırılamazsa, manuel adımlar şunlardır:

1.  **Frontend Build:**
    ```bash
    cd frontend
    npm run build
    ```

2.  **Backend Publish:**
    ```bash
    cd dotnet-backend/Unity.API
    dotnet publish -c Release -r win-x64 --self-contained -o ~/Desktop/UnityApp_Setup_Manual
    ```

3.  **Entegrasyon:**
    Frontend `build` klasörünün içindekileri, Backend publish klasöründeki `wwwroot` içine kopyalayın.

4.  **Paketleme:**
    Publish klasörünün **içindekileri** klasör olmadan doğrudan `UnityApp_Setup.zip` olarak sıkıştırın.
