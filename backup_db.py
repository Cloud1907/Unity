
import os
import json
from pymongo import MongoClient
from bson import json_util
from datetime import datetime
from dotenv import load_dotenv

# Setup paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, 'backend')
BACKUP_DIR = os.path.join(BASE_DIR, 'backup_v1')

# Load env
load_dotenv(os.path.join(BACKEND_DIR, '.env'))
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017/')
DB_NAME = os.getenv('DB_NAME', '4flow')

def backup_database():
    print(f"📦 Starting backup for database: {DB_NAME}")
    
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
        print(f"Created backup directory: {BACKUP_DIR}")

    try:
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        
        collections = db.list_collection_names()
        
        for col_name in collections:
            cursor = db[col_name].find({})
            data = list(cursor)
            
            file_path = os.path.join(BACKUP_DIR, f"{col_name}.json")
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, default=json_util.default, indent=2, ensure_ascii=False)
            
            print(f"✅ Exported {col_name}: {len(data)} records -> {file_path}")
            
        print(f"\n🎉 Backup completed successfully in '{BACKUP_DIR}'!")
        print("You can commit this folder to GitHub if you want to keep the data in the repo (not recommended for sensitive data),")
        print("or keep it local to restore to MongoDB Atlas later.")
        
    except Exception as e:
        print(f"❌ Backup failed: {str(e)}")

if __name__ == "__main__":
    backup_database()
