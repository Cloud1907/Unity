from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from models.comment import Comment, CommentCreate, CommentUpdate
from models.notification import NotificationCreate
from utils.dependencies import db, get_current_active_user
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/tasks", tags=["Comments"])

@router.get("/{task_id}/comments", response_model=List[Comment])
async def get_comments(
    task_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get all comments for a task"""
    comments = await db.comments.find({"taskId": task_id}).sort("createdAt", 1).to_list(1000)
    return comments

@router.post("/{task_id}/comments", response_model=Comment, status_code=status.HTTP_201_CREATED)
async def create_comment(
    task_id: str,
    comment_data: CommentCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new comment"""
    # Verify task exists
    task = await db.tasks.find_one({"_id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    comment_dict = comment_data.dict()
    comment_dict["_id"] = str(ObjectId())
    
    await db.comments.insert_one(comment_dict)
    
    # Notify assignees
    for assignee_id in task.get("assignees", []):
        if assignee_id != current_user["_id"]:
            notification = NotificationCreate(
                recipientId=assignee_id,
                type="comment_added",
                taskId=task_id,
                senderId=current_user["_id"],
                message=f"{current_user['fullName']} commented on {task['title']}",
                priority="low"
            )
            await db.notifications.insert_one(notification.dict())
    
    return comment_dict

@router.put("/comments/{comment_id}", response_model=Comment)
async def update_comment(
    comment_id: str,
    comment_data: CommentUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """Update comment"""
    comment = await db.comments.find_one({"_id": comment_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Only comment author can update
    if comment["userId"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this comment")
    
    update_data = comment_data.dict()
    update_data["updatedAt"] = datetime.utcnow()
    
    await db.comments.update_one({"_id": comment_id}, {"$set": update_data})
    
    updated_comment = await db.comments.find_one({"_id": comment_id})
    return updated_comment

@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Delete comment"""
    comment = await db.comments.find_one({"_id": comment_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Only comment author or admin can delete
    if comment["userId"] != current_user["_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
    
    await db.comments.delete_one({"_id": comment_id})
    return None
