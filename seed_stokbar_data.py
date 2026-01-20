import sqlite3
import uuid
from datetime import datetime

db_path = 'dotnet-backend/Unity.API/unity.db'

def add_test_data():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    now = datetime.now().isoformat()
    dept_id = "dept-stokbar"
    admin_id = "user-melih"
    
    # Projects to add
    projects = [
        ("Stokbar Lojistik Optimizasyonu", "Depo içi lojistik süreçlerinin dijitalleştirilmesi ve hızlandırılması.", "📦", "#0086c0", "in_progress", "high"),
        ("Müşteri Deneyimi Platformu", "B2B müşteriler için sipariş takip ve yönetim portalı geliştirme.", "🤝", "#00c875", "planning", "critical"),
        ("Stokbar Envanter Sayım Otomasyonu", "RFID teknolojisi ile stok sayım süreçlerinin otomatize edilmesi.", "📊", "#fdab3d", "working", "medium")
    ]
    
    project_ids = []
    
    print("🚀 Projeler ekleniyor...")
    for name, desc, icon, color, status, priority in projects:
        p_id = str(uuid.uuid4())[:8]
        cursor.execute('''
            INSERT INTO Projects (Id, Name, Description, Icon, Color, Owner, Members, Department, Status, Priority, Favorite, IsPrivate, CreatedBy, CreatedAt, UpdatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)
        ''', (p_id, name, desc, icon, color, admin_id, '["user-melih", "user-ahmet", "user-ayse"]', dept_id, status, priority, admin_id, now, now))
        project_ids.append((p_id, name))
        print(f"   + Proje eklendi: {name} (ID: {p_id})")

    # Tasks to add (10 tasks total)
    # Categories: Proje Yönetimi, Müşteri Yönetimi
    tasks = [
        # Project 1: Lojistik Optimizasyonu
        (project_ids[0][0], "Lojistik Süreç Analizi Raporu", "Mevcut darboğazların tespiti ve raporlanması.", '["user-melih"]', "Proje Yönetimi", "high"),
        (project_ids[0][0], "Rota Optimizasyon Algoritması Testi", "Yeni algoritmanın depo içi testlerinin yapılması.", '["user-ahmet"]', "Proje Yönetimi", "critical"),
        (project_ids[0][0], "Depo Personeli Eğitim Planı", "Yeni sistem için personelin eğitilmesi.", '["user-ayse"]', "Proje Yönetimi", "medium"),
        
        # Project 2: Müşteri Deneyimi Platformu
        (project_ids[1][0], "Müşteri Geri Bildirimlerinin Analizi", "Mevcut sistemdeki şikayetlerin kategorize edilmesi.", '["user-melih", "user-selin"]', "Müşteri Yönetimi", "high"),
        (project_ids[1][0], "Portal UI/UX Tasarım Onayı", "Müşteri yönetim paneli taslaklarının onaya sunulması.", '["user-zeynep"]', "Müşteri Yönetimi", "critical"),
        (project_ids[1][0], "Sipariş Takip Modülü Entegrasyonu", "ERP sistemi ile portal arasındaki veri akışının sağlanması.", '["user-melih", "user-burak"]', "Proje Yönetimi", "high"),
        (project_ids[1][0], "VIP Müşteri Toplantısı Hazırlığı", "Yeni portal tanıtımı için sunum hazırlanması.", '["user-zeynep"]', "Müşteri Yönetimi", "medium"),
        
        # Project 3: Envanter Sayım Otomasyonu
        (project_ids[2][0], "RFID Etiket Tedarik Süreci", "Uygun maliyetli ve dayanıklı etiketlerin seçilmesi.", '["user-ahmet"]', "Proje Yönetimi", "medium"),
        (project_ids[2][0], "Donanım Kurulum Planı", "Antenlerin ve okuyucuların depo yerleşim planı.", '["user-melih"]', "Proje Yönetimi", "high"),
        (project_ids[2][0], "Müşteri Destek Hattı Kurulumu", "Sistem arızaları için destek hattı operasyonu.", '["user-selin"]', "Müşteri Yönetimi", "low")
    ]

    print("\n📝 Görevler ekleniyor...")
    for p_id, title, desc, assignees, label, priority in tasks:
        t_id = str(uuid.uuid4())[:10]
        cursor.execute('''
            INSERT INTO Tasks (Id, ProjectId, Title, Description, Assignees, AssignedBy, Status, Priority, Labels, IsPrivate, Progress, Subtasks, Comments, Attachments, CreatedAt, UpdatedAt)
            VALUES (?, ?, ?, ?, ?, ?, 'todo', ?, ?, 0, 0, '[]', '[]', '[]', ?, ?)
        ''', (t_id, p_id, title, desc, assignees, admin_id, priority, f'["{label}"]', now, now))
        print(f"   + Görev eklendi: {title} -> {assignees}")

    conn.commit()
    conn.close()
    print("\n✅ Veri ekleme işlemi başarıyla tamamlandı.")

if __name__ == "__main__":
    add_test_data()
