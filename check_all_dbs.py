import sys
from pymongo import MongoClient

# Connection string
MONGO_URI = "mongodb+srv://melihbulut00_db_user:PBCKJWAqfdNlRZfV@cluster0.4zwlnzg.mongodb.net/?appName=Cluster0"
TARGET_EMAIL = "melih.bulut@unity.com"

def check_all_dbs():
    try:
        client = MongoClient(MONGO_URI)
        
        # List all database names
        dbs = client.list_database_names()
        print(f"📦 Found databases: {dbs}")
        
        for db_name in dbs:
            if db_name in ['admin', 'local', 'config']:
                continue
                
            print(f"\n🔍 Checking database: '{db_name}'")
            db = client[db_name]
            
            # Check users collection
            if 'users' in db.list_collection_names():
                count = db.users.count_documents({})
                print(f"   📄 'users' collection has {count} documents.")
                
                user = db.users.find_one({"email": TARGET_EMAIL})
                if user:
                    print(f"   ✅ FOUND target user in '{db_name}'!")
                    print(f"      ID: {user.get('_id')}")
                    print(f"      Active: {user.get('isActive')}")
                else:
                    print(f"   ❌ Target user NOT found in '{db_name}'.")
                    # Check for partial match or other domains
                    fuzzy = db.users.find_one({"email": {"$regex": "melih", "$options": "i"}})
                    if fuzzy:
                        print(f"      ℹ️  Found similar user: {fuzzy.get('email')}")
            else:
                print("   ⚠️  No 'users' collection found.")

    except Exception as e:
        print(f"❌ An error occurred: {e}")

if __name__ == "__main__":
    check_all_dbs()
