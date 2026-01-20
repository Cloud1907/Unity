from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from models.notification import Notification, NotificationUpdate
from utils.dependencies import db, get_current_active_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[Notification])
async def get_notifications(current_user: dict = Depends(get_current_active_user)):
    """Get current user's notifications"""
    notifications = await db.notifications.find(
        {"recipientId": current_user["_id"]}
    ).sort("createdAt", -1).to_list(1000)
    return notifications

@router.put("/{notification_id}/read", response_model=Notification)
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Mark notification as read"""
    notification = await db.notifications.find_one({"_id": notification_id})
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Only notification recipient can mark as read
    if notification["recipientId"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.notifications.update_one(
        {"_id": notification_id},
        {"$set": {"isRead": True}}
    )
    
    updated_notification = await db.notifications.find_one({"_id": notification_id})
    return updated_notification

@router.put("/read-all", response_model=dict)
async def mark_all_read(current_user: dict = Depends(get_current_active_user)):
    """Mark all notifications as read"""
    result = await db.notifications.update_many(
        {"recipientId": current_user["_id"], "isRead": False},
        {"$set": {"isRead": True}}
    )
    
    return {"updated": result.modified_count}

@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Delete notification"""
    notification = await db.notifications.find_one({"_id": notification_id})
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Only notification recipient can delete
    if notification["recipientId"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.notifications.delete_one({"_id": notification_id})
    return None
