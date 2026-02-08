---
description: Canlı veritabanı verilerini koruma kuralı (Safe Mode)
---
# 🛡️ Canlı Veri Koruma Kuralı (Live Data Safety)

**DİKKAT: BU PROJE CANLI DATA (PRODUCTION) MODUNDADIR.**

Bu kod tabanında çalışan her türlü AI ajanı ve geliştirici için geçerli olan katı kurallar aşağıdadır:

## 🚫 Yasaklı İşlemler
1. Mevcut veritabanı kayıtları üzerinde doğrudan `DELETE`, `UPDATE` veya `TRUNCATE` komutları (DML) çalıştırılmamalıdır.
2. Veritabanı şemasını (DDL) bozan veya geriye dönük uyumluluğu (Backward Compatibility) ortadan kaldıran değişiklikler yapılamaz.
3. Test amaçlı dummy veri ekleme işlemleri canlı veritabanında yapılamaz.

## ⚠️ Güvenli Çalışma Prensipleri
1. **Soft Delete**: Veri silme gerektiren durumlarda fiziksel silme yerine her zaman `IsDeleted` vb. flagler ile Soft Delete tercih edilmelidir.
2. **Onay Mekanizması**: Veri değiştiren (Write) işlemleri içeren kodlar yayına alınmadan önce mutlaka manuel test edilmeli ve kullanıcı onayı alınmalıdır.
3. **Loglama**: Yapılan her türlü veri değişikliği (ActivityLog sistemi üzerinden) 'Kim, Neyi, Ne Zaman' bilgisiyle kayıt altına alınmalıdır.
4. **Yedekleme**: Kritik şema değişikliklerinden önce veritabanı yedeğinin alındığından emin olunmalıdır.

// turbo-all
