from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from models.subtask import Subtask, SubtaskCreate, SubtaskUpdate
from utils.dependencies import db, get_current_active_user
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/tasks", tags=["Subtasks"])

@router.get("/{task_id}/subtasks", response_model=List[Subtask])
async def get_subtasks(
    task_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get all subtasks for a task"""
    subtasks = await db.subtasks.find({"taskId": task_id}).to_list(1000)
    return subtasks

@router.post("/{task_id}/subtasks", response_model=Subtask, status_code=status.HTTP_201_CREATED)
async def create_subtask(
    task_id: str,
    subtask_data: SubtaskCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new subtask"""
    # Verify task exists
    task = await db.tasks.find_one({"_id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    subtask_dict = subtask_data.dict()
    subtask_dict["_id"] = str(ObjectId())
    
    await db.subtasks.insert_one(subtask_dict)
    return subtask_dict

@router.put("/subtasks/{subtask_id}", response_model=Subtask)
async def update_subtask(
    subtask_id: str,
    subtask_data: SubtaskUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """Update subtask"""
    subtask = await db.subtasks.find_one({"_id": subtask_id})
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")
    
    update_data = {k: v for k, v in subtask_data.dict(exclude_unset=True).items()}
    update_data["updatedAt"] = datetime.utcnow()
    
    if update_data:
        await db.subtasks.update_one({"_id": subtask_id}, {"$set": update_data})
    
    updated_subtask = await db.subtasks.find_one({"_id": subtask_id})
    return updated_subtask

@router.delete("/subtasks/{subtask_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subtask(
    subtask_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Delete subtask"""
    result = await db.subtasks.delete_one({"_id": subtask_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subtask not found")
    return None
