import sys
import os
from pymongo import MongoClient
from passlib.context import CryptContext
from bson import ObjectId

# Connection string
MONGO_URI = "mongodb+srv://melihbulut00_db_user:PBCKJWAqfdNlRZfV@cluster0.4zwlnzg.mongodb.net/?appName=Cluster0"
DB_NAME = "4flow"

# Setup password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def update_user():
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        users_collection = db['users']
        
        target_email = "melih.bulut@unity.com"
        old_email = "melih.bulut@4flow.com"
        new_password = "123456" # Temporary password
        hashed_password = get_password_hash(new_password)
        
        print(f"🚀 Starting user update process...")
        
        # 1. Check if target user already exists
        user = users_collection.find_one({"email": target_email})
        
        if user:
            print(f"ℹ️  User '{target_email}' found. Updating password...")
            users_collection.update_one(
                {"_id": user["_id"]},
                {"$set": {"password": hashed_password, "isActive": True}}
            )
            print("✅ Password updated successfully.")
            return

        # 2. Check if old user exists to migrate
        old_user = users_collection.find_one({"email": old_email})
        
        if old_user:
            print(f"ℹ️  Old user '{old_email}' found. Updating email and password...")
            users_collection.update_one(
                {"_id": old_user["_id"]},
                {
                    "$set": {
                        "email": target_email,
                        "password": hashed_password,
                        "isActive": True
                    }
                }
            )
            print(f"✅ User migrated from '{old_email}' to '{target_email}' and password updated.")
            return

        # 3. Create new user if neither exists
        print(f"⚠️ User not found. Creating new user '{target_email}'...")
        new_user = {
            "_id": str(ObjectId()),
            "email": target_email,
            "password": hashed_password,
            "fullName": "Melih Bulut",
            "isActive": True,
            "avatar": f"https://api.dicebear.com/7.x/avataaars/svg?seed={target_email}",
            "role": "admin", # Assuming admin for test
            "projects": []
        }
        users_collection.insert_one(new_user)
        print("✅ New user created successfully.")

    except Exception as e:
        print(f"❌ An error occurred: {e}")

if __name__ == "__main__":
    update_user()
