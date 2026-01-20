import sqlite3
import random
from datetime import datetime

db_path = 'dotnet-backend/Unity.API/unity.db'

def seed_stokbar_final():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get users
    cursor.execute("SELECT Id FROM Users WHERE Id LIKE 'user-%'")
    users = [row[0] for row in cursor.fetchall()]
    
    projects = [
        ("proj-stok-smart", "Stokbar Akıllı Depo", "Depo içi robotik toplama ve yapay zeka destekli yerleştirme sistemleri."),
        ("proj-stok-net", "Stokbar Lojistik Ağı", "Bölgesel dağıtım merkezleri arası sevkiyat ve rota optimizasyonu."),
        ("proj-stok-opt", "Stokbar Envanter Optimizasyonu", "Emniyet stoğu hesaplama ve talep tahminleme modelleri geliştirme.")
    ]
    
    statuses = ["todo", "working", "done", "stuck"]
    priorities = ["low", "medium", "high", "critical"]
    labels = ["Planlama", "Geliştirme", "Saha", "Analiz", "Acil"]
    
    print("🚀 Stokbar Verileri Ekleniyor...")
    
    now = datetime.now().isoformat()
    # Members is required for Projects
    members_json = '["user-melih", "user-ahmet", "user-ayse"]'
    
    for p_id, p_name, p_desc in projects:
        cursor.execute("""
            INSERT OR REPLACE INTO Projects (Id, Name, Description, Icon, Color, Members, Department, Status, Priority, Favorite, IsPrivate, CreatedAt, UpdatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (p_id, p_name, p_desc, "📦", "#6366f1", members_json, "Stokbar", "active", "medium", 0, 0, now, now))
        
        print(f"   [Proje] {p_name} eklendi. (10 görev ekleniyor...)")
        
        for i in range(1, 11):
            t_id = f"task-{p_id}-{i}"
            t_title = f"{p_name} - Görev {i}"
            t_status = random.choice(statuses)
            t_priority = random.choice(priorities)
            t_assignee = random.choice(users)
            t_label = random.choice(labels)
            
            # All required fields for Tasks
            cursor.execute("""
                INSERT OR REPLACE INTO Tasks (
                    Id, ProjectId, Title, Description, Assignees, Status, Priority, 
                    Labels, IsPrivate, Progress, Subtasks, Comments, Attachments, 
                    CreatedAt, UpdatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                t_id, p_id, t_title, f"{p_name} çalışmaları: {t_label}", 
                f'["{t_assignee}"]', t_status, t_priority, f'["{t_label}"]', 
                0, 0, "[]", "[]", "[]", now, now
            ))
            
    conn.commit()
    conn.close()
    print("\n✅ İşlem başarıyla tamamlandı: 3 Proje ve 30 Görev eklendi.")

if __name__ == "__main__":
    seed_stokbar_final()
