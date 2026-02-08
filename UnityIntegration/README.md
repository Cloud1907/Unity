# Unity SignalR Integration

Bu klasör, Unity projesi ile .NET backend arasında gerçek zamanlı görev senkronizasyonu sağlayan C# scriptlerini içerir.

## Gereksinimler

Unity projenize **Microsoft.AspNetCore.SignalR.Client** paketini kurmanız gerekir.
Bunun için "NuGet for Unity" kullanabilir veya DLL dosyalarını manuel olarak `Assets/Plugins` klasörüne atabilirsiniz.

Gerekli DLL'ler:
- Microsoft.AspNetCore.SignalR.Client
- Microsoft.AspNetCore.SignalR.Common
- Microsoft.AspNetCore.SignalR.Protocols.Json
- Microsoft.Extensions.DependencyInjection
- Microsoft.Extensions.Logging
- System.Text.Json (Unity sürümüne göre değişebilir)

## Kurulum

1.  **TaskSyncManager:**
    - `TaskSyncManager.cs` dosyasını projenize ekleyin.
    - Sahnede boş bir GameObject oluşturun (örn: `NetworkManager`) ve bu scripti sürükleyin.
    - `Hub Url` kısmına backend adresinizi girin (örn: `http://localhost:8080/appHub`).

2.  **Test Etme:**
    - `TaskSyncTester.cs` dosyasını projenize ekleyin.
    - Sahnede bir GameObject'e ekleyin.
    - Inspector'da `Api Url` (`http://localhost:8080/api`), `Email`, `Password` ve test etmek istediğiniz `Target Task Id` bilgilerini girin.
    - Oyunu başlatın.
    - Önce UI üzerinden veya bir butona bağlayarak `StartLoginAndConnect()` fonksiyonunu çağırın.
    - Konsolda "Login successful" ve "SignalR Connected" yazılarını görün.
    - `MarkTaskAsDone()` fonksiyonunu çağırın.
    - Konsolda yeşil renkli "TEST SUCCESS: Received update..." mesajını görmelisiniz.

## Özellikler

- **Otomatik Yeniden Bağlanma:** Bağlantı koptuğunda (0s, 2s, 5s, 10s) aralıklarla tekrar dener.
- **Main Thread Dispatch:** SignalR olaylarını Unity'nin ana thread'ine taşıdığı için UI güncellemeleri (Text, Image vb.) güvenle yapılabilir.
- **Authentication:** Token bazlı kimlik doğrulama desteklenir.
