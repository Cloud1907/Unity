# Unity Yönetici ve Güncelleme Rehberi

## 1. Veritabanına Erişim (MongoDB)
Veritabanını görüntülemek ve yönetmek için en kolay yol **MongoDB Compass** programıdır.

1.  Sunucuya **MongoDB Compass** indirin ve kurun:  
    [İndirme Linki (Resmi Site)](https://www.mongodb.com/try/download/compass)
2.  Programı açın.
3.  **URI** kısmına `mongodb://localhost:27017` yazıp "Connect" deyin.
4.  Sol tarafta **`univera`** veritabanını göreceksiniz. Tüm veriler buradadır.

## 2. Uygulamayı Güncelleme
Uygulamaya yeni özellikler geldiğinde, kodları yenilemek için **`tool_manager.bat`** aracını kullanabilirsiniz.

1.  Yeni kodların olduğu klasörü sunucuya atın.
2.  `native-bundle` içindeki **`tool_manager.bat`** dosyasını çalıştırın.
3.  **2 (Uygulamayı Güncelle)** seçeneğini seçin.
4.  Sizden yeni klasörün yolunu isteyecek, girin ve Enter'a basın.
5.  Sistem otomatik olarak:
    *   Eski dosyaların yedeğini alır (`backups` klasörüne).
    *   Yeni dosyaları kopyalar.
    *   Backend servisini yeniden başlatır.

## 3. Veritabanı Güvenliği (Şifre Koyma)
Varsayılan olarak veritabanı şifresizdir (sadece sunucu içinden erişilebilir). Eğer ekstra güvenlik istiyorsanız:

1.  **`tool_manager.bat`** dosyasını çalıştırın.
2.  **3 (Veritabanı Güvenliği)** seçeneğini seçin.
3.  Orada yazan adımları sırasıyla uygulayın:
    *   Compass ile admin kullanıcısı oluşturun.
    *   MongoDB ayarlarından yetkilendirmeyi açın.
    *   Backend `.env` dosyasını güncelleyin.
