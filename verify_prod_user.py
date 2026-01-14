import sys
from pymongo import MongoClient
import pprint

MONGO_URI = "mongodb+srv://melihbulut00_db_user:PBCKJWAqfdNlRZfV@cluster0.4zwlnzg.mongodb.net/?appName=Cluster0"
DB_NAME = "univera"
TARGET_EMAIL = "melih.bulut@unity.com"

def verify_prod_user():
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        users = db['users']
        
        print(f"🔍 Checking user '{TARGET_EMAIL}' in DB '{DB_NAME}'...")
        
        user = users.find_one({"email": TARGET_EMAIL})
        
        if user:
            print("✅ User found!")
            print(f"   _id: {user.get('_id')}")
            print(f"   email: {user.get('email')}")
            print(f"   isActive: {user.get('isActive')}")
            if user.get('password'):
                print("   🔑 Password field exists (hash hidden)")
            else:
                print("   ❌ Password field MISSING!")
        else:
            print("❌ User NOT found in 'univera' database.")
            print("   Listing all users in 'univera':")
            for u in users.find():
                print(f"   - {u.get('email')}")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    verify_prod_user()
