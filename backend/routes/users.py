from fastapi import APIRouter, HTTPException, status, Depends
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

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str, current_user: dict = Depends(get_admin_user)):
    """Delete user (admin only)"""
    result = await db.users.delete_one({"_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return None
