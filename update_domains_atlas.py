import sys
from pymongo import MongoClient

MONGO_URI = "mongodb+srv://melihbulut00_db_user:PBCKJWAqfdNlRZfV@cluster0.4zwlnzg.mongodb.net/?appName=Cluster0"
DATABASES = ["4flow", "univera"]

def update_domains():
    try:
        client = MongoClient(MONGO_URI)
        
        for db_name in DATABASES:
            print(f"\n🔄 Processing database: '{db_name}'")
            db = client[db_name]
            users_collection = db['users']
            
            users = list(users_collection.find())
            
            if not users:
                print("   ⚠️  No users found.")
                continue
                
            print(f"   found {len(users)} users.")
            
            for user in users:
                old_email = user.get('email', '')
                if not old_email:
                    continue
                    
                if '@' in old_email:
                    username = old_email.split('@')[0]
                    new_email = f"{username}@unity.com"
                    
                    if old_email != new_email:
                        users_collection.update_one(
                            {"_id": user["_id"]},
                            {"$set": {"email": new_email}}
                        )
                        print(f"   ✅ Updated: {old_email} -> {new_email}")
                    else:
                        print(f"   ℹ️  Skipped: {old_email} (already correct)")
                else:
                    print(f"   ⚠️  Invalid email skipped: {old_email}")

        print("\n🎉 All updates completed!")

    except Exception as e:
        print(f"❌ An error occurred: {e}")

if __name__ == "__main__":
    update_domains()
