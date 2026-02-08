# 🌌 Unity - Kullanım Kılavuzu & Teknik Dökümantasyon

Unity'nin resmi kullanım kılavuzuna hoş geldiniz. Bu döküman, uygulamanın amacını, nasıl kullanılacağını ve teknik altyapısını kapsamlı bir şekilde açıklamaktadır.

---

## 🎯 Unity'nin Asıl Amacı Nedir?

Unity, karmaşık iş süreçlerini basitleştirmek ve ekipler arası iletişimi en üst düzeye çıkarmak için geliştirilmiş **"Kurumsal İş Gücü Yönetim Platformu"**dur. 

Asıl hedefleri:
1.  **Odak Kaybını Engellemek:** Tek bir ekrandan tüm projelere ve görevlere erişim sağlayarak dikkati toplamak.
2.  **Şeffaflık:** Kimin ne üzerinde çalıştığını, hangi görevin ne aşamada olduğunu (Kanban/Liste) herkesin anlık görmesini sağlamak.
3.  **Verimlilik Analizi:** Haftalık ilerleme raporları ve performans kartlarıyla darboğazları tespit etmek.
4.  **Hız ve Mobilite:** Hem web hem mobil üzerinden, sahada veya ofiste kesintisiz veri akışı sunmak.

---

## 🛠 Nasıl Kullanılır? (Temel İş Akışı)

Unity'yi kullanmaya başlamak için şu adımları takip edebilirsiniz:

### 1. Çalışma Alanı (Workspace) ve Proje Oluşturma
Sistem hiyerarşisi **Çalışma Alanı -> Proje -> Görev** şeklindedir.
- Sol menüdeki "+" butonunu kullanarak yeni bir çalışma alanı oluşturun.
- Çalışma alanının içine projelerinizi (Örn: "Stokbar Projeleri") ekleyin.

### 2. Görevlerin Yönetimi
Projenin içine girdiğinizde sizi **Liste** veya **Kanban** görünümleri karşılar.
- **Görev Ekle:** "Görev Ekle" butonuna basın, ismini girin ve atamasını yapın.
- **Detaylara İnme:** Göreve tıklayarak modern modalı açın. Buradan alt görevler (subtasks) ekleyebilir, son tarih belirleyebilir ve öncelik atayabilirsiniz.

### 3. İlerleme Takibi
- Görevler tamamlandıkça durumlarını (Yapılacak, Devam Ediyor, Tamamlandı) güncelleyin.
- Ana sayfadaki (Dashboard) **Haftalık İlerleme** grafiğinden kendi veya ekibinizin performansını izleyin.

---

## 🎨 Tasarım ve Kullanıcı Deneyimi

Unity, **"Modern Premium"** tasarım dilini benimser.
- **Tipografi:** Okunabilirliği yüksek, modern yazı tipleri (Inter/Outfit).
- **Hareket:** `framer-motion` ile akıcı sayfa geçişleri ve etkileşimli hover efektleri.
- **Bileşenler:** Erişilebilirlik ve güvenilirlik için **Radix UI** temelleri üzerine inşa edilmiştir.
- **Temalar:** Karanlık ve Aydınlık mod etkileşimleri için tamamen optimize edilmiştir.

---

## 📸 Sayfa Galerisi ve Özellikler

### 1. Giriş Ekranı (Authentication)
Kullanıcıların sisteme güvenli ve şık bir arayüzle erişmesini sağlar.
![Giriş Sayfası](/Users/cloudsmac/.gemini/antigravity/brain/2972a433-3533-49cb-b7b6-8e2fbed6fa5e/login_page_v2_1770038208889.png)

### 2. Kişiselleştirilmiş Dashboard
Giriş yaptıktan sonra kullanıcıyı karşılayan özet ekranı şunları içerir:
- **Haftalık İlerleme Grafikleri:** Verimlilik takibi.
- **Durum Kartları:** Bekleyen, Devam Eden ve Tamamlanan görev sayıları.
- **Son Etkinlikler:** Proje güncellemelerinin kronolojik akışı.
![Dashboard Görünümü](/Users/cloudsmac/.gemini/antigravity/brain/2972a433-3533-49cb-b7b6-8e2fbed6fa5e/dashboard_view_1770038233339.png)

### 3. Proje ve Görev Yönetimi
Unity'nin kalbi olan çok yönlü proje görünümleri:
- **Kanban Panosu:** Sürükle-bırak iş akışı yönetimi.
- **Liste Görünümü:** Satır içi düzenleme özellikli detaylı tablo.
- **İlerleme Takibi:** Görev bazlı ilerleme çubukları ve durum göstergeleri.
![Pano Görünümü](/Users/cloudsmac/.gemini/antigravity/brain/2972a433-3533-49cb-b7b6-8e2fbed6fa5e/board_view_page_1770038296541.png)

### 4. Modern Görev Modalı
Bir göreve tıklandığında açılan detaylı yönetim ekranı:
- **Alt Görevler:** Karmaşık işleri parçalara ayırma.
- **Öncelik Seviyeleri:** Düşük, Orta, Yüksek, Acil seçenekleri.
- **Atamalar ve Etiketler:** Ekip üyelerini ve kategorileri yönetme.
- **Etkinlik Geçmişi:** Görev üzerindeki tüm değişiklikleri izleme.
![Görev Detay Modalı](/Users/cloudsmac/.gemini/antigravity/brain/2972a433-3533-49cb-b7b6-8e2fbed6fa5e/task_modal_view_1770038469015.png)

---

## 💻 Teknik Teknoloji Yığını (Tech Stack)

### **Frontend (Ön Yüz)**
- **Çekirdek:** React 18.3
- **Durum Yönetimi:** Custom Hooks + Context API
- **Stil:** Tailwind CSS + Radix UI
- **Animasyon:** Framer Motion
- **Grafikler:** Recharts
- **Haberleşme:** Axios (REST) + @microsoft/signalr (WebSocket)
- **Mobil:** Capacitor (iOS/Android)

### **Backend (Arka Yüz)**
- **Framework:** .NET 8 (C#)
- **Mimari:** Clean Architecture (Çekirdek, Altyapı, API)
- **Veritabanı:** MS SQL Server (EF Core ile)
- **Güvenlik:** JWT ve dinamik anahtar üretimi.
- **Gerçek Zamanlılık:** SignalR Hubs
- **Raporlama:** QuestPDF ile yüksek kaliteli çıktı üretimi.

---

## 🛠 Kurulum ve Geliştirme

### Ön Yüz (Frontend) Kurulumu
1. `/frontend` dizinine gidin.
2. `npm install` komutunu çalıştırın.
3. Geliştirme sunucusunu başlatın: `npm start` (v3001 portunda çalışır).

### Arka Yüz (Backend) Kurulumu
1. `/dotnet-backend/Unity.API` dizinine gidin.
2. Bağlantı dizesini `appsettings.json` veya `UNITY_CONNECTION_STRING` üzerinden yapılandırın.
3. Projeyi çalıştırın: `dotnet run --urls=http://localhost:8080`

---

## 📋 Standartlar ve Ek Dökümanlar
Daha fazla detay için ilgili dökümanlara göz atabilirsiniz:
- `ARCHITECTURE_STANDARDS.md`: Kodlama pratikleri ve desenler.
- `CHANGELOG.md`: En son güncellemeler ve sürüm notları.
- `contracts.md`: Entegrasyon için detaylı API dökümantasyonu.

---
*AntiGravity AI Engine tarafından oluşturulmuştur.*
