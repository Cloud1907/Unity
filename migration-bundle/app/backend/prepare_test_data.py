import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from bson import ObjectId

load_dotenv()

async def setup_test_data():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', '4flow')
    db = client[db_name]

    # Clean up first
    await db.departments.delete_many({})
    # Don't delete all projects, but let's delete our test ones if they exist
    await db.projects.delete_many({"name": {"$in": ["Public Sales Project", "Private Sales Project", "Public Marketing Project"]}})

    # 1. Create Departments
    sales_dept = {
        "_id": str(ObjectId()),
        "name": "Sales",
        "description": "Sales Dept",
        "headOfDepartment": "Ahmet Admin",
        "color": "#e2445c"
    }
    marketing_dept = {
        "_id": str(ObjectId()),
        "name": "Marketing",
        "description": "Marketing Dept",
        "headOfDepartment": "Ayşe Yılmaz",
        "color": "#00c875"
    }
    await db.departments.insert_many([sales_dept, marketing_dept])
    print("Departments created.")

    # 2. Assign Users
    # Ahmet -> Manager, Sales
    await db.users.update_one(
        {"email": "ahmet@4flow.com"},
        {"$set": {"role": "manager", "department": "Sales"}}
    )
    # Test Member -> Member, Sales
    await db.users.update_one(
        {"email": "test@4flow.com"},
        {"$set": {"role": "member", "department": "Sales"}}
    )
    # Ayşe -> Member, Marketing
    await db.users.update_one(
        {"email": "ayse@4flow.com"},
        {"$set": {"role": "member", "department": "Marketing"}}
    )
    print("Users updated.")

    # Get Melih's ID for owner fields
    melih = await db.users.find_one({"email": "melih.bulut@4flow.com"})
    melih_id = melih["_id"]

    # 3. Create Projects
    projects = [
        {
            "_id": str(ObjectId()),
            "name": "Public Sales Project",
            "department": "Sales",
            "isPrivate": False,
            "owner": melih_id,
            "createdBy": melih_id,
            "members": [],
            "status": "active",
            "color": "#e2445c",
            "icon": "📈",
            "createdAt": "2023-01-01T00:00:00",
            "updatedAt": "2023-01-01T00:00:00"
        },
        {
            "_id": str(ObjectId()),
            "name": "Private Sales Project",
            "department": "Sales",
            "isPrivate": True,
            "owner": melih_id,
            "createdBy": melih_id,
            "members": [], # Only Melih sees it by default
            "status": "active",
            "color": "#e2445c",
            "icon": "🔒",
            "createdAt": "2023-01-01T00:00:00",
            "updatedAt": "2023-01-01T00:00:00"
        },
        {
            "_id": str(ObjectId()),
            "name": "Public Marketing Project",
            "department": "Marketing",
            "isPrivate": False,
            "owner": melih_id,
            "createdBy": melih_id,
            "members": [],
            "status": "active",
            "color": "#00c875",
            "icon": "📣",
            "createdAt": "2023-01-01T00:00:00",
            "updatedAt": "2023-01-01T00:00:00"
        }
    ]
    await db.projects.insert_many(projects)
    print("Projects created.")

    client.close()

if __name__ == "__main__":
    asyncio.run(setup_test_data())
