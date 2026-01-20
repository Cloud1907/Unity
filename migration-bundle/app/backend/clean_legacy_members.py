import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def clean_members():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', '4flow')
    db = client[db_name]

    # Get users
    ahmet = await db.users.find_one({"email": "ahmet@4flow.com"})
    ayse = await db.users.find_one({"email": "ayse@4flow.com"})
    test = await db.users.find_one({"email": "test@4flow.com"})
    
    users_to_remove = []
    if ahmet: users_to_remove.append(ahmet['_id'])
    if ayse: users_to_remove.append(ayse['_id'])
    if test: users_to_remove.append(test['_id'])
    
    if not users_to_remove:
        print("Users not found")
        return

    # Update all projects that DO NOT have a department (legacy projects)
    # Remove these users from 'members' array
    result = await db.projects.update_many(
        {"department": None}, 
        {"$pull": {"members": {"$in": users_to_remove}}}
    )
    
    print(f"Removed users from {result.modified_count} projects.")
    client.close()

if __name__ == "__main__":
    asyncio.run(clean_members())
