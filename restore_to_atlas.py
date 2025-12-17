
import os
import json
import sys
from pymongo import MongoClient
from bson import json_util

# Setup paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKUP_DIR = os.path.join(BASE_DIR, 'backup_v1')

def restore_to_atlas(connection_string):
    print(f"🚀 Starting migration to Atlas...")
    
    if not connection_string:
        print("❌ Error: No connection string provided.")
        return

    try:
        # Connect to Atlas
        client = MongoClient(connection_string)
        # Force a connection check
        client.admin.command('ping')
        print("✅ Connected to MongoDB Atlas successfully!")
        
        # Use '4flow' database
        db = client['4flow']
        
        # Iterate over JSON files
        if not os.path.exists(BACKUP_DIR):
             print(f"❌ Backup directory not found: {BACKUP_DIR}")
             return

        files = [f for f in os.listdir(BACKUP_DIR) if f.endswith('.json')]
        
        if not files:
            print("❌ No JSON files found in backup directory.")
            return

        for filename in files:
            collection_name = filename.replace('.json', '')
            file_path = os.path.join(BACKUP_DIR, filename)
            
            print(f"📦 Restoring {collection_name}...")
            
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f, object_hook=json_util.object_hook)
            
            if not data:
                print(f"   ⚠️  Skipping {collection_name} (Empty)")
                continue
                
            # Clear existing data in Atlas to prevent duplicates
            db[collection_name].delete_many({})
            
            # Insert new data
            if isinstance(data, list):
                db[collection_name].insert_many(data)
                print(f"   ✅ Imported {len(data)} documents into '{collection_name}'")
            else:
                print(f"   ⚠️  Data in {filename} is not a list, skipping.")

        print(f"\n🎉 Migration completed successfully!")
        print("You can now connect your backend to this Atlas database.")
        
    except Exception as e:
        print(f"\n❌ Restoration failed: {str(e)}")
        print("Check your connection string and password.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python restore_to_atlas.py <connection_string>")
    else:
        restore_to_atlas(sys.argv[1])
