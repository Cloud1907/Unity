
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

async def seed_data():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', '4flow')
    db = client[db_name]

    print("🌱 Starting 4Flow Data Seeding...")

    # 1. Create User: melih.bulut@4flow.com
    email = "melih.bulut@4flow.com"
    existing_user = await db.users.find_one({"email": email})
    
    if not existing_user:
        user_id = str(ObjectId())
        user_data = {
            "_id": user_id,
            "fullName": "Melih Bulut",
            "email": email,
            "password": get_password_hash("test123"), # Default password
            "role": "admin",
            "department": "Engineering",
            "avatar": f"https://api.dicebear.com/7.x/avataaars/svg?seed={email}",
            "color": "#0086c0",
            "isActive": True,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        await db.users.insert_one(user_data)
        print("   ✅ Created user: melih.bulut@4flow.com (Pass: test123)")
    else:
        user_id = existing_user["_id"]
        print("   ℹ️  User melih.bulut@4flow.com already exists")

    # 2. Create Projects (Monday.com Clone Style)
    bg_green = "#00c875"
    bg_red = "#e2445c"
    bg_blue = "#0086c0"
    bg_yellow = "#fdab3d"
    bg_purple = "#a25ddc"
    
    projects = [
        {
            "name": "Q4 Marketing Campaign",
            "description": "Planning and execution of end-of-year marketing activities",
            "icon": "📣",
            "color": bg_purple,
            "status": "active",
            "priority": "high",
            "members": [user_id]
        },
        {
            "name": "Product Roadmap 2025",
            "description": "Strategic planning for next year's core features",
            "icon": "🚀",
            "color": bg_blue,
            "status": "active",
            "priority": "critical",
            "members": [user_id]
        },
        {
            "name": "Website Redesign",
            "description": "Overhaul of the corporate website UX/UI",
            "icon": "🎨",
            "color": bg_red,
            "status": "on_hold",
            "priority": "medium",
            "members": [user_id]
        }
    ]

    project_ids = []
    
    print("\n   📁 Seeding Projects...")
    for p in projects:
        # Check if project exists
        exists = await db.projects.find_one({"name": p["name"]})
        if not exists:
            p["_id"] = str(ObjectId())
            p["owner"] = user_id
            p["createdBy"] = user_id
            p["createdAt"] = datetime.utcnow()
            p["updatedAt"] = datetime.utcnow()
            await db.projects.insert_one(p)
            project_ids.append(p["_id"])
            print(f"      + Created project: {p['name']}")
        else:
            project_ids.append(exists["_id"])
            print(f"      . Project exists: {p['name']}")

    # 3. Create Labels (Status & Priority Columns style)
    if project_ids:
        main_project_id = project_ids[0] # Marketing Campaign
        
        labels_data = [
            {"name": "Done", "color": bg_green, "type": "status"},
            {"name": "Working on it", "color": bg_yellow, "type": "status"},
            {"name": "Stuck", "color": bg_red, "type": "status"},
            {"name": "Briefing", "color": bg_purple, "type": "status"},
            {"name": "High", "color": "#ff5ac4", "type": "priority"},
            {"name": "Medium", "color": "#579bfc", "type": "priority"},
            {"name": "Low", "color": "#784bd1", "type": "priority"}
        ]
        
        print("\n   🏷️  Seeding Labels...")
        for l in labels_data:
            l["projectId"] = main_project_id
            l["_id"] = str(ObjectId())
            await db.labels.insert_one(l)
        print("      + Added status/priority labels")

        # 4. Create Tasks (Items) with Monday.com flavor
        tasks = [
            {
                "title": "Define campaign goals",
                "status": "Done",
                "priority": "High",
                "timeline": "Oct 1 - Oct 5",
                "owner": "Melih Bulut"
            },
            {
                "title": "Create social media assets",
                "status": "Working on it",
                "priority": "Medium",
                "timeline": "Oct 6 - Oct 15",
                "owner": "Design Team"
            },
            {
                "title": "Draft email newsletter",
                "status": "Stuck",
                "priority": "High",
                "timeline": "Oct 10 - Oct 12",
                "owner": "Copywriter"
            },
            {
                "title": "Launch ads on LinkedIn",
                "status": "Briefing",
                "priority": "High",
                "timeline": "Oct 20",
                "owner": "Marketing Lead"
            }
        ]
        
        print("\n   📝 Seeding Tasks...")
        for t in tasks:
            task_doc = {
                "_id": str(ObjectId()),
                "projectId": main_project_id,
                "title": t["title"],
                "description": f"Task for {t['title']}",
                "status": "todo", # mapped to internal status
                "priority": "medium",
                "assignees": [user_id],
                "labels": [], 
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            await db.tasks.insert_one(task_doc)
            print(f"      + Created task: {t['title']}")

        # 5. Link User to Projects
        await db.users.update_one(
            {"_id": user_id},
            {"$set": {"projects": project_ids}}
        )
        print(f"\n   🔗 Linked {len(project_ids)} projects to user {email}")

    print("\n✅ Seeding Complete!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
