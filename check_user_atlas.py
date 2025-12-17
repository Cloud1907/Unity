
import os
import sys
from pymongo import MongoClient

def check_user(email, connection_string):
    print(f"🔍 Searching for user: {email}")
    
    try:
        client = MongoClient(connection_string)
        db = client['4flow']
        users_collection = db['users']
        
        user = users_collection.find_one({"email": email})
        
        if user:
            print(f"✅ User FOUND: {user['email']}")
            print(f"   Name: {user.get('name')}")
            print(f"   Role: {user.get('role')}")
            print(f"   ID: {user.get('_id')}")
        else:
            print(f"❌ User NOT FOUND: {email}")
            print("   Listing all available users:")
            for u in users_collection.find({}, {"email": 1, "name": 1}):
                print(f"   - {u.get('email')} ({u.get('name')})")

    except Exception as e:
        print(f"❌ Connection Check Failed: {str(e)}")

if __name__ == "__main__":
    CONN_STR = "mongodb+srv://melihbulut00_db_user:PBCKJWAqfdNlRZfV@cluster0.4zwlnzg.mongodb.net/?appName=Cluster0"
    EMAIL = "melih.bulut@4flow.com"
    check_user(EMAIL, CONN_STR)
