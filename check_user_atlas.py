import sys
from pymongo import MongoClient
import os

# Connection string manually provided for this task
MONGO_URI = "mongodb+srv://melihbulut00_db_user:PBCKJWAqfdNlRZfV@cluster0.4zwlnzg.mongodb.net/?appName=Cluster0"
DB_NAME = "4flow" # Based on restore_to_atlas.py

def check_user(email):
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        users_collection = db['users']
        
        print(f"Checking for user: {email} in database: {DB_NAME}...")
        
        user = users_collection.find_one({"email": email})
        
        if user:
            print(f"✅ User found!")
            print(f"ID: {user.get('_id')}")
            print(f"Email: {user.get('email')}")
            print(f"Full Name: {user.get('fullName')}")
            # Identify if it has a password set (don't print the hash)
            if user.get('password'):
                print("🔑 Password hash is present.")
            else:
                print("❌ No password field found.")
        else:
            print(f"❌ User '{email}' not found.")
            
            # List all users to see what's there
            print("\n--- Existing Users ---")
            for u in users_collection.find():
                print(f"- {u.get('email')} ({u.get('fullName')})")
                
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    check_user("melih.bulut@unity.com")
