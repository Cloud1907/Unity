import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def check_db():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', '4flow')
    db = client[db_name]

    print("--- Departments ---")
    depts = await db.departments.find({}).to_list(None)
    for d in depts:
        print(f"ID: {d['_id']}, Name: {d.get('name')}, Head: {d.get('headOfDepartment')}")

    print("\n--- Projects ---")
    projects = await db.projects.find({}).to_list(None)
    for p in projects:
        print(f"Name: {p['name']}, Dept: {p.get('department')}, Private: {p.get('isPrivate')}")

    print("\n--- Users (Filtered) ---")
    users = await db.users.find({"email": {"$in": ["ahmet@4flow.com", "test@4flow.com"]}}).to_list(None)
    for u in users:
        print(f"Email: {u['email']}, Role: {u['role']}, Dept: {u.get('department')}")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_db())
