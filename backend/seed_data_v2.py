
import asyncio
import os
import random
from datetime import datetime, timedelta
from uuid import uuid4
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

    print("🌱 Starting 4Flow Enhanced Data Seeding (v2)...")

    # Clear existing data for a clean slate (optional, but good for consistency)
    await db.projects.delete_many({})
    await db.tasks.delete_many({})
    await db.labels.delete_many({})
    print("   🧹 Cleared Projects, Tasks, and Labels")

    # 1. Ensure Users Exist
    users = [
        {
            "email": "melih.bulut@4flow.com",
            "name": "Melih Bulut",
            "role": "admin",
            "color": "#0086c0"
        },
        {
            "email": "ahmet@4flow.com",
            "name": "Ahmet Admin",
            "role": "admin",
            "color": "#e2445c"
        },
        {
            "email": "test@4flow.com",
            "name": "Test Member",
            "role": "member",
            "color": "#fdab3d"
        },
        {
            "email": "ayse@4flow.com",
            "name": "Ayşe Yılmaz",
            "role": "member",
            "color": "#00c875"
        }
    ]

    user_map = {} # email -> _id

    for u in users:
        existing = await db.users.find_one({"email": u["email"]})
        if not existing:
            uid = str(ObjectId())
            user_doc = {
                "_id": uid,
                "fullName": u["name"],
                "email": u["email"],
                "password": get_password_hash("test123"),
                "role": u["role"],
                "department": "Engineering",
                "avatar": f"https://api.dicebear.com/7.x/avataaars/svg?seed={u['email']}",
                "color": u["color"],
                "isActive": True,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            await db.users.insert_one(user_doc)
            user_map[u["email"]] = uid
            print(f"   + Created user: {u['name']}")
        else:
            user_map[u["email"]] = existing["_id"]
            print(f"   . User exists: {u['name']}")

    melih_id = user_map["melih.bulut@4flow.com"]
    others_ids = list(user_map.values())

    # 2. Rich Project Data
    project_templates = [
        {
            "name": "Product Roadmap 2025",
            "desc": "Strategic initiatives for Q1-Q4 2025",
            "icon": "🚀",
            "color": "#0086c0",
            "priority": "critical"
        },
        {
            "name": "Website Redesign",
            "desc": "Complete overhaul of the marketing site",
            "icon": "🎨",
            "color": "#e2445c",
            "priority": "high"
        },
        {
            "name": "Q4 Marketing Campaign",
            "desc": "Social media and email push for end of year",
            "icon": "📣",
            "color": "#a25ddc",
            "priority": "high"
        },
        {
            "name": "Internal Knowledge Base",
            "desc": "Documentation for engineering team",
            "icon": "📚",
            "color": "#fdab3d",
            "priority": "medium"
        },
        {
            "name": "Mobile App V2",
            "desc": "React Native refactor",
            "icon": "📱",
            "color": "#00c875",
            "priority": "critical"
        }
    ]

    for pt in project_templates:
        pid = str(ObjectId())
        project_doc = {
            "_id": pid,
            "name": pt["name"],
            "description": pt["desc"],
            "icon": pt["icon"],
            "color": pt["color"],
            "status": "active",
            "priority": pt["priority"],
            "owner": melih_id,
            "createdBy": melih_id,
            "members": others_ids, # Add everyone
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
            "favorite": random.choice([True, False])
        }
        await db.projects.insert_one(project_doc)
        print(f"   📁 Created Project: {pt['name']}")

        # 3. Create Labels (Correctly using UUID 'id')
        labels = [
            {"name": "Done", "color": "#00c875", "type": "status"},
            {"name": "Working on it", "color": "#fdab3d", "type": "status"},
            {"name": "Stuck", "color": "#e2445c", "type": "status"},
            {"name": "Review", "color": "#579bfc", "type": "status"},
            {"name": "High", "color": "#e2445c", "type": "priority"},
            {"name": "Medium", "color": "#fdab3d", "type": "priority"},
            {"name": "Low", "color": "#00c875", "type": "priority"}
        ]
        
        label_ids = []
        for l in labels:
            lid = str(uuid4()) # Use UUID as per API
            l_doc = {
                "id": lid,
                "projectId": pid,
                "name": l["name"],
                "color": l["color"],
                "type": l.get("type", "status"),
                "createdAt": datetime.utcnow().isoformat()
            }
            await db.labels.insert_one(l_doc)
            label_ids.append(lid)
        
        # 4. Create Tasks (Complex)
        task_titles = [
            "Kickoff meeting", "Design mockups", "Frontend implementation",
            "Backend API setup", "Database schema design", "User testing",
            "Deployment pipeline", "Write documentation", "Client review",
            "Bug fixing sprint"
        ]

        for i, title in enumerate(task_titles):
            tid = str(ObjectId())
            
            # Random dates
            start_date = datetime.utcnow() + timedelta(days=random.randint(-10, 10))
            due_date = start_date + timedelta(days=random.randint(1, 14))
            
            task_doc = {
                "_id": tid,
                "projectId": pid,
                "title": title,
                "description": f"Detailed description for {title}. Validation required.",
                "status": random.choice(["todo", "in_progress", "done", "review"]), # Internal status
                "priority": random.choice(["low", "medium", "high"]),
                "assignees": random.sample(others_ids, k=random.randint(1, 2)),
                "labels": random.sample(label_ids, k=random.randint(0, 2)),
                "startDate": start_date,
                "dueDate": due_date,
                "progress": random.choice([0, 25, 50, 75, 100]),
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            await db.tasks.insert_one(task_doc)
        
    # Update users with project links
    all_project_ids = [p["_id"] for p in await db.projects.find({}, {"_id": 1}).to_list(None)]
    await db.users.update_many(
        {}, 
        {"$set": {"projects": all_project_ids}}
    )

    print("\n✅ Verification Data Ready!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
