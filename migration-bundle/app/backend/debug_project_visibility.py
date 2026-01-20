import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def debug_visibility():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', '4flow')
    db = client[db_name]

    print("--- User: Ahmet ---")
    ahmet = await db.users.find_one({"email": "ahmet@4flow.com"})
    print(f"ID: {ahmet['_id']}")
    print(f"Role: {ahmet.get('role')}")
    print(f"Dept: {ahmet.get('department')}")

    print("\n--- Project: Product Roadmap 2025 ---")
    proj = await db.projects.find_one({"name": "Product Roadmap 2025"})
    print(f"ID: {proj['_id']}")
    print(f"Owner: {proj.get('owner')}")
    print(f"Members: {proj.get('members')}")
    print(f"Dept: {proj.get('department')}")
    print(f"Private: {proj.get('isPrivate')}")

    # Simulate logic
    is_owner = proj['owner'] == ahmet['_id']
    is_member = ahmet['_id'] in proj.get('members', [])
    not_private = proj.get('isPrivate') != True
    same_dept = proj.get('department') == ahmet.get('department')
    dept_not_none = proj.get('department') is not None
    
    print(f"\nLogic for Ahmet:")
    print(f"Is Owner: {is_owner}")
    print(f"Is Member: {is_member}")
    print(f"Is Public: {not_private}")
    print(f"Same Dept: {same_dept}")
    print(f"Dept Not None: {dept_not_none}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(debug_visibility())
