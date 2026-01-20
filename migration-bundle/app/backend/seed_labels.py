import asyncio
from typing import List
from uuid import uuid4
from datetime import datetime, timezone
import motor.motor_asyncio
import os

# Database connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client["4flow"]

DEFAULT_LABELS = [
    {"name": "Acil", "color": "#e2445c"},       # Red
    {"name": "Önemli", "color": "#fdab3d"},     # Orange
    {"name": "İnceleniyor", "color": "#579bfc"},# Blue
    {"name": "Beklemede", "color": "#a25ddc"},  # Purple
    {"name": "Tamamlandı", "color": "#00c875"}  # Green
]

async def seed_labels():
    print("🌱 Seeding default global labels...")
    
    for label_data in DEFAULT_LABELS:
        # Check if exists
        existing = await db.labels.find_one({
            "name": label_data["name"],
            "isGlobal": True
        })
        
        if not existing:
            new_label = {
                "id": str(uuid4()),
                "name": label_data["name"],
                "color": label_data["color"],
                "projectId": None,
                "isGlobal": True,
                "createdAt": datetime.now(timezone.utc).isoformat()
            }
            await db.labels.insert_one(new_label)
            print(f"✅ Created global label: {label_data['name']}")
        else:
            print(f"ℹ️  Label already exists: {label_data['name']}")

    print("✨ Seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed_labels())
