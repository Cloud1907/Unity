
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def fix():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', '4flow')
    db = client[db_name]
    
    projects = await db.projects.find().to_list(None)
    for p in projects:
        if 'createdBy' not in p:
            owner = p.get('owner')
            await db.projects.update_one({'_id': p['_id']}, {'$set': {'createdBy': owner}})
            print(f"Fixed project: {p.get('name')}")
    
    print('Fix complete.')
    client.close()

if __name__ == "__main__":
    asyncio.run(fix())
