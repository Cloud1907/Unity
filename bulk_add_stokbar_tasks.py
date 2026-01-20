import sqlite3
import uuid
from datetime import datetime
import random

db_path = 'dotnet-backend/Unity.API/unity.db'

def add_bulk_tasks():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    now = datetime.now().isoformat()
    admin_id = "user-melih"
    
    users = [
        "user-ahmet", "user-ayse", "user-burak", "user-cem", "user-fatma", 
        "user-mehmet", "user-melih", "user-selin", "user-zeynep"
    ]
    
    labels = ["Proje Yönetimi", "Müşteri Yönetimi", "Teknik Destek", "AR-GE", "Saha Operasyonu", "Kalite Kontrol", "Eğitim"]
    priorities = ["low", "medium", "high", "critical"]
    statuses = ["todo", "working", "stuck", "done"]

    # Proje ID'lerini al
    cursor.execute("SELECT Id, Name FROM Projects WHERE Department = 'dept-stokbar'")
    projects = cursor.fetchall()
    
    if len(projects) < 3:
        print(f"❌ Beklenen 3 Stokbar projesi bulunamadı! Bulunan: {len(projects)}")
        return

    print("🚀 Her projeye 10 yeni görev ekleniyor (Toplam 30)...")

    for p_id, p_name in projects:
        print(f"\n📂 Proje: {p_name}")
        for i in range(1, 11):
            t_id = str(uuid.uuid4())[:10]
            title = f"{p_name} - Görev {i}: {random.choice(['Analiz', 'Geliştirme', 'Test', 'Raporlama', 'Toplantı', 'Kurulum'])}"
            desc = f"{p_name} kapsamında yürütülen {i}. detaylı iş paketi açıklaması."
            
            # Rastgele 1-2 kullanıcı ata
            task_users = random.sample(users, k=random.randint(1, 2))
            assignees_json = '["' + '", "'.join(task_users) + '"]'
            
            status = random.choice(statuses)
            priority = random.choice(priorities)
            label = random.choice(labels)
            progress = 100 if status == "done" else random.randint(10, 80) if status == "working" else random.randint(0, 20)

            cursor.execute('''
                INSERT INTO Tasks (Id, ProjectId, Title, Description, Assignees, AssignedBy, Status, Priority, Labels, IsPrivate, Progress, Subtasks, Comments, Attachments, CreatedAt, UpdatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, '[]', '[]', '[]', ?, ?)
            ''', (t_id, p_id, title, desc, assignees_json, admin_id, status, priority, f'["{label}"]', progress, now, now))
            print(f"   + Eklendi: {title} ({status}) -> {assignees_json}")

    conn.commit()
    conn.close()
    print("\n✅ Toplam 30 yeni görev başarıyla eklendi.")

if __name__ == "__main__":
    add_bulk_tasks()
