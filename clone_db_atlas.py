import sys
from pymongo import MongoClient

MONGO_URI = "mongodb+srv://melihbulut00_db_user:PBCKJWAqfdNlRZfV@cluster0.4zwlnzg.mongodb.net/?appName=Cluster0"
SOURCE_DB = "4flow"
TARGET_DB = "univera"

def clone_database():
    try:
        client = MongoClient(MONGO_URI)
        source = client[SOURCE_DB]
        target = client[TARGET_DB]
        
        print(f"🚀 Cloning '{SOURCE_DB}' to '{TARGET_DB}'...")
        
        # Get all collection names
        collections = source.list_collection_names()
        
        for coll_name in collections:
            print(f"   📦 Cloning collection: {coll_name}")
            
            # Get all documents
            docs = list(source[coll_name].find())
            
            if docs:
                # Clear target collection first
                target[coll_name].delete_many({})
                
                # Insert into target
                target[coll_name].insert_many(docs)
                print(f"      ✅ Copied {len(docs)} documents.")
            else:
                 print(f"      ⚠️  Collection empty, skipping.")

        print("\n🎉 Database clone completed successfully!")

    except Exception as e:
        print(f"❌ An error occurred: {e}")

if __name__ == "__main__":
    clone_database()
