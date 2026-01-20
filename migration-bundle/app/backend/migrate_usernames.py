from motor.motor_asyncio import AsyncIOMotorClient
import os
import asyncio
from dotenv import load_dotenv
from pathlib import Path

# Load env
ROOT_DIR = Path(__file__).parent.parent
env_path = ROOT_DIR / '.env'
if env_path.exists():
    load_dotenv(env_path)

async def migrate_usernames():
    print("🚀 Starting Username Migration...")
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', '4Flow')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    users = await db.users.find({}).to_list(length=None)
    
    count = 0
    for user in users:
        email = user.get('email')
        if not email:
            continue
            
        current_username = user.get('username')
        if current_username:
            print(f"Skipping {email}: already has username {current_username}")
            continue
            
        # Derive username from email (part before @)
        new_username = email.split('@')[0]
        
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"username": new_username}}
        )
        print(f"✅ Updated {email} -> username: {new_username}")
        count += 1
        
    print(f"\n🎉 Migration Complete! Updated {count} users.")
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate_usernames())
