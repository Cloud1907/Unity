import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def fix():
    # Force univera DB
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['univera']
    
    email = "melih.bulut@4flow.com"
    user = await db.users.find_one({"email": email})
    if user:
        print(f"Updating user {email} (Role: {user.get('role')}) -> ADMIN")
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"role": "admin"}}
        )
        print("Done.")
    else:
        print(f"User {email} not found!")

    client.close()

if __name__ == "__main__":
    asyncio.run(fix())
