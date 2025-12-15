from fastapi import APIRouter, HTTPException, status, Depends, Body
from typing import List
from models.user import User, UserUpdate, UserResponse
from utils.dependencies import db, get_current_active_user, get_admin_user
from bson import ObjectId

router = APIRouter(prefix="/users", tags=["Users"])

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
    for project in all_projects:
        if user_id in project.get("members", []):
            await db.projects.update_one(
                {"_id": project["_id"]},
                {"$pull": {"members": user_id}}
            )
    
    # Add user to selected projects
    for project_id in project_ids:
        await db.projects.update_one(
            {"_id": project_id},
            {"$addToSet": {"members": user_id}}
        )
    
    return {"message": "User projects updated successfully"}

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str, current_user: dict = Depends(get_admin_user)):
    """Delete user (admin only)"""
    result = await db.users.delete_one({"_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return None
