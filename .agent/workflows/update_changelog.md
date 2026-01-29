---
description: Her geliştirmeden sonra CHANGELOG.md güncelleme kuralı
---

# CHANGELOG Güncelleme Kuralı

Her geliştirme veya düzeltme tamamlandığında CHANGELOG.md dosyasını güncelle.

## Format

```markdown
## [VERSIYON] - YYYY-MM-DD HH:MM

### Eklendi
- Yeni özellik açıklaması

### Düzeltildi
- Düzeltilen bug açıklaması

### Değiştirildi
- Değiştirilen davranış açıklaması

### Kaldırıldı
- Kaldırılan özellik
```

## Kurallar

1. **Tarih/Saat**: Her kayıt `YYYY-MM-DD HH:MM` formatında olmalı
2. **Sıralama**: En yeni kayıt en üstte olmalı
3. **Versiyon**: Major.Minor.Patch formatında (örn: 1.2.6)
4. **Kategoriler**: Eklendi, Düzeltildi, Değiştirildi, Kaldırıldı
5. **Dosya Konumu**: `/CHANGELOG.md` (proje kök dizini)

## Örnek Güncelleme

// turbo
1. CHANGELOG.md dosyasını aç
2. En üste yeni versiyon bloğu ekle
3. Değişiklikleri uygun kategoriye yaz
