
import os
import sys
# Add backend directory to sys.path to allow imports
sys.path.append(os.path.join(os.getcwd(), 'backend'))

import pymongo
from bson import ObjectId
from datetime import datetime

# Database connection
MONGO_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
client = pymongo.MongoClient(MONGO_URL)
db = client['univera']

def create_test_data():
    print("Connecting to database...")
    
    # 1. Find Ayşe
    ayse = db.users.find_one({"fullName": {"$regex": "Ayşe", "$options": "i"}})
    if not ayse:
        print("Ayşe not found! Creating Ayşe first...")
        ayse = {
            "_id": str(ObjectId()),
            "fullName": "Ayşe Yılmaz",
            "email": "ayse@unity.com",
            "password": "hashed_password",
            "role": "user",
            "department": "Sales",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Ayse",
            "createdAt": datetime.utcnow()
        }
        db.users.insert_one(ayse)
    
    print(f"Found/Created Ayşe: {ayse['fullName']}, Dept: {ayse.get('department')} (ID: {ayse['_id']})")
    department = ayse.get('department', 'Sales')

    # 2. Find target project
    # Manual search because regex is failing for some reason
    all_projects = list(db.projects.find({}))
    project = None
    
    print(f"Scanning {len(all_projects)} projects for 'Deneme 2'...")
    for p in all_projects:
        title = p.get('title') or p.get('name')
        if title and "Deneme 2" in title:
            project = p
            break
            
    if not project:
        # Fallback to fuzzy search in python
        for p in all_projects:
             title = p.get('title') or p.get('name')
             if title and "Deneme" in title:
                 project = p
                 break
                 
    if not project:
        print("Project 'Deneme 2' still not found!")
        for p in all_projects:
             print(f" - {p.get('title')}")
        return

    project_title = project.get('title') or project.get('name') or "Untitled Project"
    print(f"Target Project: {project_title} ({project['_id']})")

    # 3. Create New Users (Zeynep & Can)
    new_users_data = [
        {
            "fullName": "Zeynep Demir",
            "email": "zeynep@unity.com",
            "password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWUNUb.wXya.a.r6/c9zX.a.r6/c9z", # Dummy hash
            "role": "user",
            "department": department,
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Zeynep",
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        },
        {
            "fullName": "Can Yılmaz",
            "email": "can@unity.com",
            "password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWUNUb.wXya.a.r6/c9zX.a.r6/c9z",
            "role": "user",
            "department": department,
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Can",
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
    ]

    created_user_ids = []
    
    for user_data in new_users_data:
        exist = db.users.find_one({"email": user_data["email"]})
        if exist:
            print(f"User {user_data['fullName']} already exists (ID: {exist['_id']}).")
            created_user_ids.append(str(exist["_id"]))
        else:
            user_data["_id"] = str(ObjectId())
            db.users.insert_one(user_data)
            print(f"Created user: {user_data['fullName']} (ID: {user_data['_id']})")
            created_user_ids.append(str(user_data["_id"]))

    # 4. Update Project Members
    current_members = project.get("members", [])
    updated_members = set(current_members)
    
    # Add Ayşe and new users
    updated_members.add(str(ayse["_id"]))
    for uid in created_user_ids:
        updated_members.add(uid)
    
    # Convert back to list
    final_members = list(updated_members)
    
    db.projects.update_one(
        {"_id": project["_id"]},
        {"$set": {"members": final_members}}
    )
    
    print(f"Updated project members. New member count: {len(final_members)}")
    print("New Members Added:")
    for uid in created_user_ids:
        print(f" - {uid}")
    print(f" - {ayse['_id']} (Ayşe)")

if __name__ == "__main__":
    create_test_data()
