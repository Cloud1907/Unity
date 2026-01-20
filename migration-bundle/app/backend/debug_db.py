
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def ping_server():
    mongo_url = os.environ.get('MONGO_URL')
    print(f"MONGO_URL: {mongo_url}")
    if not mongo_url:
        print("MONGO_URL not set!")
        return

    client = AsyncIOMotorClient(mongo_url)
    try:
        await client.admin.command('ping')
        print("Pinged your deployment. You successfully connected to MongoDB!")
        
        db_name = os.environ.get('DB_NAME', 'test')
        db = client[db_name]
        users = await db.users.find_one()
        print(f"Found user: {users}")
        
    except Exception as e:
        print(e)
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(ping_server())
