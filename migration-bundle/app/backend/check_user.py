
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def check_user():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', '4flow')
    db = client[db_name]
    
    target_email = "melih.bulut@4flow.com"
    print(f"🔍 Searching for user: {target_email}")
    
    user = await db.users.find_one({"email": target_email})
    
    if user:
        print(f"✅ User found: {user.get('fullName')} (ID: {user.get('_id')})")
        print(f"   Role: {user.get('role')}")
        print(f"   Password Hash: {user.get('password')[:20]}...")
    else:
        print(f"❌ User '{target_email}' NOT found in database.")
    
    print("\n📋 Existing Users:")
    async for u in db.users.find():
        print(f"   - {u.get('email')} ({u.get('fullName', 'No Name')})")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_user())
