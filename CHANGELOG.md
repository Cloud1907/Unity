# Unity Application Changelog

Tüm geliştirmeler tarih ve saat ile yeniden eskiye sıralanır.

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
