import sqlite3
import uuid
from datetime import datetime

db_path = 'dotnet-backend/Unity.API/unity.db'

def extend_test_data():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    now = datetime.now().isoformat()
    admin_id = "user-melih"
    
    # Proje ID'lerini al
    cursor.execute("SELECT Id, Name FROM Projects WHERE Department = 'dept-stokbar'")
    projects = cursor.fetchall()
    
    if not projects:
        print("❌ Stokbar projeleri bulunamadı!")
        return
    
    # Proje ID'lerini eşle
    p_ids = {name: p_id for p_id, name in projects}
    
    # Yeni eklenecek görevler (Özellikle statü odaklı)
    # done (tamamlandı), working (devam ediyor), stuck (takıldı)
    
    new_tasks = [
        # Stokbar Lojistik Optimizasyonu
        (p_ids.get("Stokbar Lojistik Optimizasyonu"), "Depo Yerleşim Planı Onayı", "Mevcut taslakların yönetim tarafından onaylanması.", '["user-melih"]', "done", "high", "Proje Yönetimi"),
        (p_ids.get("Stokbar Lojistik Optimizasyonu"), "Forklift Operasyon Testleri", "Yeni rota üzerindeki forklift manevra testleri.", '["user-ahmet"]', "working", "medium", "Proje Yönetimi"),
        (p_ids.get("Stokbar Lojistik Optimizasyonu"), "WMS Entegrasyon Hatası Çözümü", "Veritabanı bağlantı kopması sorunu araştırılıyor.", '["user-melih", "user-burak"]', "stuck", "critical", "Proje Yönetimi"),
        
        # Müşteri Deneyimi Platformu
        (p_ids.get("Müşteri Deneyimi Platformu"), "Müşteri Portalı Beta Yayını", "Seçili 10 müşteri için portalın yayına alınması.", '["user-melih", "user-zeynep"]', "done", "critical", "Müşteri Yönetimi"),
        (p_ids.get("Müşteri Deneyimi Platformu"), "B2B Katalog Veri Girişi", "Ürün görsellerinin ve açıklamalarının güncellenmesi.", '["user-ayse"]', "working", "low", "Müşteri Yönetimi"),
        (p_ids.get("Müşteri Deneyimi Platformu"), "Sms Bildirim Servisi Entegrasyonu", "API sağlayıcı kaynaklı gecikme yaşanıyor.", '["user-burak"]', "stuck", "medium", "Proje Yönetimi"),
        (p_ids.get("Müşteri Deneyimi Platformu"), "Kullanım Kılavuzu Hazırlığı", "Müşteriler için PDF ve video içerik üretimi.", '["user-selin"]', "working", "medium", "Müşteri Yönetimi"),
        
        # Stokbar Envanter Sayım Otomasyonu
        (p_ids.get("Stokbar Envanter Sayım Otomasyonu"), "Pilot Bölge Seçimi", "Sayım otomasyonu için A blok depo seçildi.", '["user-melih"]', "done", "medium", "Proje Yönetimi"),
        (p_ids.get("Stokbar Envanter Sayım Otomasyonu"), "RFID Okuyucu Kalibrasyonu", "Hatalı okumaların önüne geçmek için ince ayarlar yapılıyor.", '["user-ahmet"]', "working", "high", "Proje Yönetimi"),
        (p_ids.get("Stokbar Envanter Sayım Otomasyonu"), "Etiket Yapıştırma Standartları", "Hangi kutunun neresine etiket geleceğinin belirlenmesi.", '["user-ayse"]', "done", "low", "Proje Yönetimi"),
        (p_ids.get("Stokbar Envanter Sayım Otomasyonu"), "Eski Barkodların Kaldırılması", "Karışıklık olmaması için eski sistemin temizlenmesi.", '["user-mehmet"]', "working", "low", "Proje Yönetimi"),
        (p_ids.get("Stokbar Envanter Sayım Otomasyonu"), "Sunucu Kapasite Artımı", "Bütçe onayı bekleniyor, işlem durduruldu.", '["user-melih", "user-zeynep"]', "stuck", "high", "Proje Yönetimi")
    ]

    print("📝 12 yeni görev ekleniyor...")
    for p_id, title, desc, assignees, status, priority, label in new_tasks:
        if not p_id: continue
        t_id = str(uuid.uuid4())[:10]
        cursor.execute('''
            INSERT INTO Tasks (Id, ProjectId, Title, Description, Assignees, AssignedBy, Status, Priority, Labels, IsPrivate, Progress, Subtasks, Comments, Attachments, CreatedAt, UpdatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, '[]', '[]', '[]', ?, ?)
        ''', (t_id, p_id, title, desc, assignees, admin_id, status, priority, f'["{label}"]', 100 if status=="done" else 30 if status=="working" else 10, now, now))
        print(f"   + Görev eklendi: {title} ({status})")

    conn.commit()
    conn.close()
    print("\n✅ Veri genişletme işlemi başarıyla tamamlandı.")

if __name__ == "__main__":
    extend_test_data()
