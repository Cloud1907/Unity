import asyncio
import os
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

async def seed_additional_data():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', '4flow')
    db = client[db_name]

    print("🌱 Adding Additional Sample Data for Ayşe and Ahmet...")

    # Find or create Ayşe
    ayse = await db.users.find_one({"email": "ayse@4flow.com"})
    if not ayse:
        ayse_id = str(ObjectId())
        ayse = {
            "_id": ayse_id,
            "fullName": "Ayşe Yılmaz",
            "email": "ayse@4flow.com",
            "password": get_password_hash("test123"),
            "role": "member",
            "department": "Sales",
            "avatar": f"https://api.dicebear.com/7.x/avataaars/svg?seed=ayse@4flow.com",
            "color": "#e91e63",
            "isActive": True,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        await db.users.insert_one(ayse)
        print("   ✅ Created user: ayse@4flow.com")
    else:
        ayse_id = ayse["_id"]
        print("   ℹ️  User ayse@4flow.com already exists")

    # Find or create Ahmet
    ahmet = await db.users.find_one({"email": "ahmet@4flow.com"})
    if not ahmet:
        ahmet_id = str(ObjectId())
        ahmet = {
            "_id": ahmet_id,
            "fullName": "Ahmet Admin",
            "email": "ahmet@4flow.com",
            "password": get_password_hash("test123"),
            "role": "manager",
            "department": "Sales",
            "avatar": f"https://api.dicebear.com/7.x/avataaars/svg?seed=ahmet@4flow.com",
            "color": "#2196f3",
            "isActive": True,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        await db.users.insert_one(ahmet)
        print("   ✅ Created user: ahmet@4flow.com")
    else:
        ahmet_id = ahmet["_id"]
        print("   ℹ️  User ahmet@4flow.com already exists")

    # Create projects for Ayşe and Ahmet
    projects_data = [
        {
            "name": "Müşteri İlişkileri Yönetimi",
            "description": "CRM sisteminin geliştirilmesi ve iyileştirilmesi",
            "icon": "👥",
            "color": "#e91e63",
            "owner": ayse_id,
            "members": [ayse_id, ahmet_id],
            "department": "Sales",
            "status": "in_progress",
            "priority": "high",
            "isPrivate": False
        },
        {
            "name": "Satış Raporlama Sistemi",
            "description": "Otomatik satış raporlama ve analiz platformu",
            "icon": "📊",
            "color": "#2196f3",
            "owner": ahmet_id,
            "members": [ahmet_id, ayse_id],
            "department": "Sales",
            "status": "in_progress",
            "priority": "critical",
            "isPrivate": False
        },
        {
            "name": "E-ticaret Entegrasyonu",
            "description": "Online satış kanallarının entegrasyonu",
            "icon": "🛒",
            "color": "#ff9800",
            "owner": ayse_id,
            "members": [ayse_id],
            "department": "Sales",
            "status": "planning",
            "priority": "medium",
            "isPrivate": False
        },
        {
            "name": "Müşteri Destek Portalı",
            "description": "Self-servis müşteri destek platformu",
            "icon": "💬",
            "color": "#9c27b0",
            "owner": ahmet_id,
            "members": [ahmet_id],
            "department": "Sales",
            "status": "on_hold",
            "priority": "low",
            "isPrivate": False
        }
    ]

    print("\n   📁 Creating Projects...")
    created_projects = []
    for p in projects_data:
        exists = await db.projects.find_one({"name": p["name"]})
        if not exists:
            p["_id"] = str(ObjectId())
            p["createdBy"] = p["owner"]
            p["createdAt"] = datetime.utcnow()
            p["updatedAt"] = datetime.utcnow()
            p["favorite"] = False
            await db.projects.insert_one(p)
            created_projects.append(p)
            print(f"      + Created project: {p['name']}")
        else:
            created_projects.append(exists)
            print(f"      . Project exists: {p['name']}")

    # Create tasks for each project
    print("\n   📝 Creating Tasks...")
    task_templates = [
        {"title": "Proje planlaması ve analiz", "status": "done", "priority": "high"},
        {"title": "Teknik tasarım dokümanı hazırlama", "status": "done", "priority": "high"},
        {"title": "Veritabanı şeması oluşturma", "status": "working", "priority": "critical"},
        {"title": "API endpoint'lerini geliştirme", "status": "working", "priority": "high"},
        {"title": "Frontend arayüz tasarımı", "status": "working", "priority": "medium"},
        {"title": "Kullanıcı testleri yapma", "status": "todo", "priority": "medium"},
        {"title": "Performans optimizasyonu", "status": "todo", "priority": "low"},
        {"title": "Dokümantasyon yazma", "status": "todo", "priority": "low"},
    ]

    for project in created_projects:
        # Create 5-8 tasks per project
        num_tasks = 6
        for i in range(num_tasks):
            template = task_templates[i % len(task_templates)]
            
            # Assign tasks to project members
            assignees = [project["owner"]]
            if len(project["members"]) > 1 and i % 2 == 0:
                assignees = project["members"]
            
            # Set due dates
            days_offset = (i + 1) * 3
            if template["status"] == "done":
                due_date = datetime.utcnow() - timedelta(days=days_offset)
            elif template["status"] == "working":
                due_date = datetime.utcnow() + timedelta(days=5)
            else:
                due_date = datetime.utcnow() + timedelta(days=days_offset)
            
            task_doc = {
                "_id": str(ObjectId()),
                "projectId": project["_id"],
                "title": f"{template['title']} - {project['name'][:20]}",
                "description": f"Bu görev {project['name']} projesi kapsamında yapılacak",
                "status": template["status"],
                "priority": template["priority"],
                "assignees": assignees,
                "labels": [],
                "dueDate": due_date,
                "assignedBy": project["owner"],
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            
            exists = await db.tasks.find_one({"title": task_doc["title"]})
            if not exists:
                await db.tasks.insert_one(task_doc)
                print(f"      + Created task: {task_doc['title'][:50]}...")

    print("\n✅ Additional Data Seeding Complete!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_additional_data())
