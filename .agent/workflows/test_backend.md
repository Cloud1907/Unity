---
description: Her kod geliştirmesinden önce backend ve veritabanı seviyesinde test yapma kuralı
---

# Backend Test Kuralı

Her kod geliştirmesinden sonra, değişikliğin doğru çalıştığını doğrulamak için test yapılmalıdır.

## Test Adımları

### 1. Backend Çalışıyor mu?
// turbo
```bash
curl -s http://localhost:8080/api/health | head -1
```

### 2. Veritabanı Bağlantısı
// turbo
```bash
curl -s http://localhost:8080/api/users | head -5
```

### 3. Spesifik Endpoint Testi
Değişiklik yapılan endpoint'i test et:
```bash
# GET örneği
curl -s http://localhost:8080/api/[endpoint] -H "Authorization: Bearer [token]"

# POST örneği
curl -X POST http://localhost:8080/api/[endpoint] \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [token]" \
  -d '{"field": "value"}'
```

### 4. Browser Testi
Gerekirse browser subagent ile UI testi yap.

## Zorunlu Kontroller
- [ ] Backend 200 OK dönüyor
- [ ] Veritabanı sorguları çalışıyor
- [ ] Yeni endpoint/fonksiyon test edildi
- [ ] Hata durumları kontrol edildi

## Test Başarısız Olursa
1. Backend loglarını kontrol et
2. Hatayı düzelt
3. Testi tekrarla
4. Başarılı olana kadar devam et
