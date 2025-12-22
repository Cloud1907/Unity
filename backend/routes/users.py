from fastapi import APIRouter, HTTPException, status, Depends, Body
from typing import List
from models.user import User, UserUpdate, UserResponse, UserCreate
from utils.auth import get_password_hash
from utils.dependencies import db, get_current_active_user, get_admin_user
import random
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/users", tags=["Users"])

def generate_random_color():
    """Generate a random hex color"""
    colors = ['#ff5a5f', '#00c875', '#0086c0', '#fdab3d', '#e2445c', '#579bfc', '#9cd326', '#a25ddc']
    return random.choice(colors)

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    current_user: dict = Depends(get_admin_user)
):
    """Create a new user (admin only)"""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user_dict = user_data.dict()
    # Remove projectIds from user_dict as it's not a field in the User model
    project_ids = user_dict.pop("projectIds", [])
    
    user_dict["password"] = get_password_hash(user_data.password)
    user_dict["_id"] = str(ObjectId())
    user_dict["createdAt"] = datetime.utcnow()
    user_dict["updatedAt"] = datetime.utcnow()
    
    # Generate random color if not provided
    if not user_dict.get("color"):
        user_dict["color"] = generate_random_color()
    
    # Set default avatar if not provided
    if not user_dict.get("avatar"):
        user_dict["avatar"] = f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_dict['email']}"
    
    await db.users.insert_one(user_dict)
    
    # Handle initial project assignment if project_ids provided
    if project_ids:
        await db.projects.update_many(
            {"_id": {"$in": project_ids}},
            {"$addToSet": {"members": user_dict["_id"]}}
        )
    
    return {k: v for k, v in user_dict.items() if k != "password"}

@router.get("", response_model=List[UserResponse])
async def get_users(current_user: dict = Depends(get_current_active_user)):
    """Get all users"""
    users = await db.users.find().to_list(1000)
    return [{k: v for k, v in user.items() if k != "password"} for user in users]

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user: dict = Depends(get_current_active_user)):
    """Get user by ID"""
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {k: v for k, v in user.items() if k != "password"}

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user: dict = Depends(get_admin_user)
):
    """Update user (admin only)"""
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {k: v for k, v in user_data.dict(exclude_unset=True).items()}
    if update_data:
        await db.users.update_one({"_id": user_id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"_id": user_id})
    return {k: v for k, v in updated_user.items() if k != "password"}

@router.put("/{user_id}/projects")
async def update_user_projects(
    user_id: str,
    project_ids: List[str],
    current_user: dict = Depends(get_admin_user)
):
    """Update user's project memberships (admin only)"""
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all projects
    all_projects = await db.projects.find().to_list(1000)
    
    # Remove user from all projects first
    # Optimization: Use update_many instead of a loop
    await db.projects.update_many(
        {"members": user_id},
        {"$pull": {"members": user_id}}
    )
    
    # Add user to selected projects
    if project_ids:
        # Optimization: Use update_many to add user to all selected projects
        await db.projects.update_many(
            {"_id": {"$in": project_ids}},
            {"$addToSet": {"members": user_id}}
        )
    
    # Return updated list of project IDs for this user
    user_projects = await db.projects.find({"members": user_id}).to_list(1000)
    return {
        "message": "User projects updated successfully",
        "projectIds": [p["_id"] for p in user_projects]
    }

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str, current_user: dict = Depends(get_admin_user)):
    """Delete user (admin only)"""
    result = await db.users.delete_one({"_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return None
