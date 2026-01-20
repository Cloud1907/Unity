import sqlite3
import uuid
import random
from datetime import datetime, timedelta

db_path = 'dotnet-backend/Unity.API/unity.db'

def bulk_seed_stokbar():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get users
    cursor.execute("SELECT Id FROM Users WHERE Id LIKE 'user-%'")
    users = [row[0] for row in cursor.fetchall()]
    
    projects = [
        ("proj-stok-rf", "Stokbar RF Terminal Entegrasyonu", "Depo içi RF terminal cihazlarının API entegrasyonu ve saha testleri."),
        ("proj-stok-ecom", "Stokbar E-Ticaret Lojistiği", "Online siparişlerin paketleme ve kargo çıkış süreçlerinin optimizasyonu."),
        ("proj-stok-replenish", "Stokbar Mağaza İkmal Sistemi", "Merkezi depodan mağazalara otomatik stok besleme algoritması."),
        ("proj-stok-return", "Stokbar İade Yönetimi", "Müşteri iadelerinin kalite kontrol ve yeniden stoğa giriş süreçleri."),
        ("proj-stok-cross", "Stokbar Cross-Docking Operasyonu", "Depolama yapmadan gelen malın doğrudan sevkiyata yönlendirilmesi."),
        ("proj-stok-iot", "Stokbar Akıllı Raf Sistemi", "IoT sensörleri ile raf doluluk oranı ve ağırlık kontrolü takibi."),
        ("proj-stok-perf", "Stokbar Personel Performans Takibi", "Depo personelinin toplama ve yerleştirme hızlarının raporlanması."),
        ("proj-stok-cold", "Stokbar Soğuk Zincir İzleme", "Frigorifik araçlar ve soğuk hava depoları sıcaklık takibi."),
        ("proj-stok-barcode", "Stokbar Barkod Standartizasyonu", "Tüm tedarikçi etiketlerinin GS1 standartlarına dönüştürülmesi."),
        ("proj-stok-kpi", "Stokbar Veri Analitiği", "Yönetim için anlık stok devir hızı ve hata oranı dashboardları.")
    ]
    
    statuses = ["todo", "working", "done", "stuck"]
    priorities = ["low", "medium", "high", "critical"]
    labels = ["Teknik", "Operasyon", "Analiz", "Acil", "Planlama", "Yazılım"]
    
    print("🚀 Stokbar Projeleri Ekleniyor...")
    
    for p_id, p_name, p_desc in projects:
        # Create Project
        now = datetime.now().isoformat()
        cursor.execute("""
            INSERT OR REPLACE INTO Projects (Id, Name, Description, Department, Status, Priority, CreatedAt, UpdatedAt, Favorite, Color, Icon)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (p_id, p_name, p_desc, "Stokbar", "active", "medium", now, now, 0, "#4F46E5", "📦"))
        
        # Add 10 Tasks per project
        print(f"   📂 Proje: {p_name} (10 görev ekleniyor...)")
        for i in range(1, 11):
            t_id = f"task-{p_id}-{i}"
            t_title = f"{p_name} - Görev {i}"
            t_status = random.choice(statuses)
            t_priority = random.choice(priorities)
            t_assignee = random.choice(users)
            t_label = random.choice(labels)
            
            # Simple tasks descriptions
            t_desc = f"{p_name} kapsamında {t_label.lower()} odaklı çalışma yürütülecek. Detaylar dokümantasyonda."
            
            cursor.execute("""
                INSERT OR REPLACE INTO Tasks (Id, ProjectId, Title, Description, Status, Priority, Assignees, Labels, CreatedAt, UpdatedAt, Progress)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (t_id, p_id, t_title, t_desc, t_status, t_priority, f'["{t_assignee}"]', f'["{t_label}"]', now, now, 0))
            
    conn.commit()
    conn.close()
    print("\n✅ 10 Proje ve 100 Görev başarıyla eklendi!")

if __name__ == "__main__":
    bulk_seed_stokbar()
