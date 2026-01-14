# Unity On-Premise Kurulum Rehberi

Bu rehber, Unity uygulamasını **internet erişimi olmayan (offline)** veya **kısıtlı erişimli** şirket sunucularına (On-Premise) kurmak için gerekli adımları içerir.

## Gereksinimler

- **Windows Server**: **Docker Desktop** yüklü ve çalışıyor olmalıdır.
- **Linux Sunucu**: **Docker** ve **Docker Compose** yüklü olmalıdır.

## 1. Kurulum Paketini Hazırlama (İnterneti Olan Bir Bilgisayarda)

Eğer sunucuda internet yoksa, önce interneti olan bir bilgisayarda kurulum paketini hazırlamanız gerekir.

1. Terminali açın ve proje dizinine gidin.
2. Aşağıdaki komutu çalıştırın:
   ```bash
   chmod +x prepare_offline_bundle.sh
   ./prepare_offline_bundle.sh
   ```
3. Bu işlem biraz sürebilir. İşlem bittiğinde `offline-bundle` adında bir klasör oluşacaktır.
4. Bu `offline-bundle` klasörünü bir USB belleğe veya güvenli dosya transferi ile sunucuya kopyalayın.

## 2. Sunucuda Kurulum (Offline)

1. `offline-bundle` klasörünü sunucuya kopyaladıktan sonra klasörün içine girin.
2. Kurulum scriptini çalıştırılabilir yapın (gerekirse):
    ```bash
    chmod +x install_offline.sh
    ```
    *(Not: `install_offline.sh` dosyası ana dizinde ise onu kullanın, yoksa manuel olarak aşağıdaki adımları yapın)*

    **Windows Kurulumu:**
    1. Sunucuda **Docker Desktop**'ın açık ve çalışır durumda olduğundan emin olun (Sağ altta balina ikonu olmalı).
    1. `offline-bundle` klasörüne girin.
    2. `install.bat` dosyasına **çift tıklayın**.
    3. Açılan siyah pencerede "Kurulum Başarıyla Tamamlandı" yazısını bekleyin.

    **Linux Kurulumu:**
    1. Terminali açıp klasöre girin:
    2. Scripti çalıştırın:
       ```bash
       chmod +x install.sh
       ./install.sh
       ```

    **Manuel Yükleme (Scriptsiz):**
    ```bash
    # İmajları yükle
    docker load -i images/mongo.tar.gz
    docker load -i images/backend.tar.gz
    docker load -i images/frontend.tar.gz

    # Sistemi başlat
    docker-compose up -d
    ```

## 3. Yönetim ve Bakım

### Sistemi Durdurma
```bash
docker-compose down
```

### Logları İzleme
```bash
docker-compose logs -f
```

### Veritabanı Yedekleme
Yedekler otomatik olarak `mongo_data` volume'ünde tutulur. Manuel yedek almak için:
```bash
docker exec -t 4flow_mongo_1 mongodump --out /data/db/backup
```
(Container ismi `docker ps` ile kontrol edilmelidir)

## 4. Sorun Giderme

- **Port 80 hatası (IIS Çakışması)**:
  - Eğer sunucuda **IIS** kurulu ise Port 80 büyük ihtimalle doludur.
  - Bu durumda `docker-compose.yml` dosyasını açın ve `frontend` servisinin port ayarını değiştirin:
    ```yaml
    ports:
      - "8080:80"  # 80:80 yerine 8080:80 yapın
    ```
  - Kurulum sonrası uygulamaya `http://localhost:8080` adresinden erişebilirsiniz.

- **MongoDB Kurulumu Gerekli mi?**:
  - **HAYIR**, sunucuya ayrıca MongoDB kurmanıza gerek **yoktur**.
  - Docker, MongoDB'yi kendi içinde izole bir şekilde çalıştırır.
  - Mevcut SQL Server veya diğer veritabanlarınızla **çakışmaz** (MongoDB varsayılan portu 27017'yi kullanır).

- **Veritabanı Bağlantı Hatası**: Backend loglarını kontrol edin. `MONGO_URL` ortam değişkeninin doğru olduğundan emin olun.

## 5. Otomatik Güncelleme ve Yetkilendirme

Sistemi otomatik güncellemek isterseniz, Windows Sunucu'nun durumuna göre iki yol izleyebilirsiniz:

### Yöntem A: Container Registry ile Tam Otomatik (Önerilen)
Eğer sunucuya kısıtlı da olsa internet çıkış izni verebilirseniz, güncellemeler siz hiçbir şey yapmadan otomatik yüklenir.

**Windows Server'ın Neye Yetkili Olması Lazım?**
1.  **Dış Ağ Erişimi (Outbound Rules):** Sunucunun **GitHub Container Registry (`ghcr.io`)** veya **Docker Hub (`hub.docker.com`)** adreslerine **HTTPS (Port 443)** üzerinden erişim izni olmalıdır.
2.  **Kimlik Doğrulama:** Private (gizli) repo kullanıyorsanız, sunucuda bir kez `docker login` komutu ile giriş yapılmalıdır.

**Sizin Yapmanız Gerekenler:**
1.  **CI/CD Kurulumu:** GitHub projenize bir "Action" ekleyerek her kod değişikliğinde imajların otomatik oluşturulup Registry'e gönderilmesini sağlamalısınız.
2.  **Watchtower Kurulumu:** Sunucudaki `docker-compose.yml` dosyasına şu servisi eklerseniz, yeni güncelleme geldiğinde sistemi kendi kendine günceller:
    ```yaml
    watchtower:
      image: containrrr/watchtower
      volumes:
        - /var/run/docker.sock:/var/run/docker.sock
      command: --interval 300  # Her 5 dakikada bir kontrol et
      restart: always
    ```

### Yöntem B: Dosya Paylaşımı ile Yarı-Otomatik (Offline)
Sunucunun internete çıkışı kesinlikle yasaksa, güncellemeleri bir klasöre atarak tetikleyebilirsiniz.

**Windows Server'ın Neye Yetkili Olması Lazım?**
1.  **Dosya Paylaşımı (SMB):** Sunucu üzerinde bir klasör (örn: `C:\4Flow_Updates`) oluşturulmalı ve ağ üzerinde dosya yazma yetkisiyle paylaşıma açılmalıdır.

**Sizin Yapmanız Gerekenler:**
1.  Hazırladığınız `offline-bundle` içeriğini bu paylaşılan klasöre kopyalamak.
2.  Sunucuda bu klasörü denetleyen ve yeni dosya geldiğinde `install.bat`'ı çalıştıran basit bir Zamanlanmış Görev (Scheduled Task) oluşturmak.
