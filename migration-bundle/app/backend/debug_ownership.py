import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def check_project_owner():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', '4flow')
    db = client[db_name]

    # Find Ayse
    ayse = await db.users.find_one({"email": "ayse@4flow.com"})
    print(f"Ayse ID: {ayse['_id']}")

    # Find the new project "marketing 2" (assuming user named it anything with marketing)
    # The user said "marketing 2", let's search for it loosely
    projects = await db.projects.find({"name": {"$regex": "Marketing", "$options": "i"}}).to_list(100)
    
    print("\n--- Projects found ---")
    for p in projects:
        print(f"Project: {p['name']}")
        print(f"ID: {p['_id']}")
        print(f"Owner: {p['owner']}")
        print(f"CreatedBy: {p.get('createdBy')}")
        print(f"Is Owner Match? {str(p['owner']) == str(ayse['_id'])}")
        print("---")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_project_owner())
