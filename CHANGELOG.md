# Unity Application Changelog

Tüm geliştirmeler tarih ve saat ile yeniden eskiye sıralanır.

## [1.4.4] - 2026-02-04 12:40

### Düzeltildi
- **Proje Sahipliği & Erişim**: Proje güncellemelerinde metadata (sahip, oluşturan) kaybına neden olan backend hatası giderildi; "Param Yönetim Konuları" projesinin sahipliği manuel olarak onarıldı.
- **Header Katman Standardizasyonu**: Proje ayarları menüsünün alt öğelerin (tablo/filtre) arkasında kalma sorunu z-index (`z-60`) düzenlemesiyle kökten çözüldü.

### Değiştirildi
- **Gizlilik Mantığının Kaldırılması**: "Özel Proje" (isPrivate) özelliği sistemden tamamen kaldırıldı. Artık tüm projeler sahibi, üyeleri ve çalışma alanı üyeleri tarafından kısıtlamasız görülebilir.
- **UI İyileştirmeleri**: Proje ayarları menüsü için kullanılan `...` ikonu, daha anlaşılır olması amacıyla 'Settings' (dişli) ikonu ile değiştirildi.

---

## [1.4.3] - 2026-02-04 09:30

### Düzeltildi
- **SignalR & Subtask Senkronizasyonu**: SignalR üzerinden gelen güncellemelerde alt görevlerin (subtasks) ezilme sorunu, recursive veri birleştirme mantığı (`updateTaskInTree`) ile çözüldü.
- **Liste Stabilitesi & Key Yönetimi**: Tablo satırlarında yaşanan "duplicate key" hataları, görev ID'sine grup anahtarı eklenerek (`task-${groupKey}-${id}`) giderildi; bu sayede satır genişletme/daraltma işlemleri kararlı hale getirildi.
- **Görev Görünürlüğü (IIS Fix)**: Alt görev filtreleme mantığı esnetilerek, veritabanında üst görev ilişkisi tutarsız olan görevlerin (örn: IIS görevi) listeden kaybolması engellendi.
- **SignalR Bağlantı Güvenliği**: Hub bağlantısı "Connected" durumuna geçmeden yapılan grup katılım istekleri (`JoinProjectGroup`) kontrol altına alınarak konsol hataları temizlendi.

---

## [1.4.2] - 2026-02-03 20:40

### Değiştirildi
- **Tablo Stabilitesi (Iron Grip)**: Liste görünümünde sanallaştırma mantığı tamamen kaldırıldı, milimetrik hassasiyette katı (static) yapıya geçildi.
- **Dinamik Yükseklik Hiyerarşisi**: Ana görevler **52px**, alt görevler ise daha kompakt bir görünüm için **42px** olarak sabitlendi.
- **Geometri Standardizasyonu**: Expander (32px) ve Görev Başlığı (380px) kolonları inline style ile sabitlendi.
- **Görsel Bütünlük**: Tablodaki tüm hücrelere dikey çizgiler (border-r) eklendi ve tüm satırların hizalaması header ile eşitlendi.
- **Sticky Optimizasyonu**: Sabitlenmiş kolonlardaki transparanlık kaldırılarak kaydırma sırasında yaşanan "ghosting" efekti engellendi.

---

## [1.4.1] - 2026-02-02 15:40

### Eklendi
- **Avatar Tooltip Sistemi**: Sistemin her yerinde avatarın üzerine gelindiğinde kullanıcının Ad-Soyad bilgisi görünmesi özelliği eklendi.
- **Dinamik Sütun Genişliği**: "Dosyalar" kolonunun başlığı kesilmeyecek şekilde (110px) genişletildi.

### Düzeltildi
- **Dashboard Görev Tıklama**: Dashboard'dan tıklanan görevlerin doğrudan "Geçmiş" sekmesi yerine ana "Alt Görevler" sekmesiyle açılması sağlandı.
- **Bileşen Standardizasyonu**: Sidebar, Kanban, Takvim ve Raporlar ekranlarındaki avatarlar tutarlı bir yapıya (`UserAvatar`) dönüştürüldü.

## [1.4.0] - 2026-02-02 15:10

### Eklendi
- **Gelişmiş Aktivite Loglama Sistemi**: Uygulama genelinde granüler değişiklik takibi (Field-level logging) devre dışı bırakılan veritabanı trigger'larının yerine eklendi.
- **İnsan-Okunur Değerler**: Atanan kişilerin ID'leri yerine isimleri (örn: "Melih Bulut") loglarda gösteriliyor.
- **TraceId Takibi**: Frontend'den (`X-Trace-Id`) backend'e kadar uçtan uca istek takibi eklendi.
- **Silinen Veri Yedekleme**: Silinen görev ve alt görevler, tüm verileriyle birlikte JSON formatında log tablosuna yedekleniyor.
- **Hata ve İzlenebilirlik**: Loglar artık TraceId ile birbirine bağlı, bu da bir işlemin tüm adımlarını izlemeyi kolaylaştırıyor.

### Değiştirildi
- **Veritabanı Tetikleyicileri (Triggers)**: Eski ve performans kaybı yaratan SQL trigger'ları kaldırıldı, yerine uygulama seviyesinde daha güvenli aktivite takip servisi (`ActivityLogger`) getirildi.


## [1.3.0] - 2026-02-02 09:45

### Eklendi
- **Görev Detay Otomatik Yenileme**: Bir görev modalı açıldığında artık sunucudan en güncel veriler (yorumlar, dosyalar) otomatik olarak çekiliyor.
- **Performans Optimizasyonu**: Görev listesi yüklenirken yorum ve ek sayıları backend seviyesinde optimize edildi.

### Düzeltildi
- **Çalışma Grubu Üye Yönetimi**: Çalışma alanına (workspace) üye eklerken/çıkarırken alınan 500 hatası giderildi. Navigasyon özellikleri (Include) veritabanı sorgularına eklendi.
- **Gantt PDF Raporu**: A2 Yatay formatında gerçek zaman çizelgesi ve görsel barlar eklendi. Renk ve metod hataları giderildi.

---

## [1.2.7] - 2026-01-28 16:50

### Değiştirildi
- **Avatar Görünümü**: Artık sadece kullanıcı rengi + baş harfler gösterilecek (resim avatarları devre dışı)

### Eklendi
- `/update_changelog` workflow - Her geliştirmeden sonra CHANGELOG güncelleme
- `/test_backend` workflow - Backend ve veritabanı test kuralı
- `/setup` workflow - IIS uyumlu setup paketi oluşturma
- `CHANGELOG.md` - Versiyon geçmişi takibi

---

## [1.2.6] - 2026-01-28 16:30

### Düzeltildi
- **Mixed Content Hatası**: Frontend'deki 5 dosyada (`api.js`, `KanbanViewV2.jsx`, `ModernTaskModal.jsx`, `TaskRow.jsx`) ve 2 ortam dosyasında (`.env`, `.env.production`) hardcoded `localhost:8080` URL'leri temizlendi
- HTTPS üzerinden API istekleri artık doğru çalışıyor

### Eklendi
- Şifremi unuttum email gönderimi (SMTP: smtp.gmail.com)
- Login hata mesajları Türkçeleştirildi

---

## [1.2.5] - 2026-01-27 19:00

### Eklendi
- Alt görev (subtask) sistemi tam fonksiyonel
- Alt görev atama, tarih seçimi, tamamlama
- Haftalık İlerleme kartı (Türkçe: Toplam Görev, Devam Eden, Geciken)
- "Created by Univera AI Team" login imzası

### Düzeltildi
- Subtask persistence sorunları
- Liste görünümünde atanan kişi gösterimi

---

## [1.2.4] - 2026-01-26

### Eklendi
- Kanban görünümü drag & drop
- Görev detay modalı
- Yorum ve dosya ekleme sistemi

---

## [1.2.3] - 2026-01-24

### Eklendi
- Windows IIS deployment paketi
- Self-contained .NET runtime
