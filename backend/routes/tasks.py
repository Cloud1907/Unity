from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from models.task import Task, TaskCreate, TaskUpdate
from models.activity import ActivityCreate
from models.notification import NotificationCreate
from utils.dependencies import db, get_current_active_user
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("", response_model=List[Task])
async def get_tasks(
    projectId: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    assignee: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_active_user)
):
    """Get tasks with filters"""
    query = {}
    
    if projectId:
        query["projectId"] = projectId
    
    if status:
        query["status"] = status
    
    if assignee:
        query["assignees"] = assignee
    
    tasks = await db.tasks.find(query).to_list(1000)
    return tasks

@router.get("/{task_id}", response_model=Task)
async def get_task(
    task_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get task by ID"""
    task = await db.tasks.find_one({"_id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.post("", response_model=Task, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new task"""
    task_dict = task_data.dict()
    task_dict["_id"] = str(ObjectId())
    task_dict["assignedBy"] = current_user["_id"]
    
    await db.tasks.insert_one(task_dict)
    
    # Log activity
    activity = ActivityCreate(
        userId=current_user["_id"],
        action="task_created",
        taskId=task_dict["_id"],
        projectId=task_dict.get("projectId"),
        description=f"{current_user['fullName']} created task {task_data.title}"
    )
    await db.activities.insert_one(activity.dict())
    
    # Create notifications for assignees
    for assignee_id in task_dict.get("assignees", []):
        if assignee_id != current_user["_id"]:
            notification = NotificationCreate(
                recipientId=assignee_id,
                type="task_assigned",
                taskId=task_dict["_id"],
                senderId=current_user["_id"],
                message=f"{current_user['fullName']} assigned you a task: {task_data.title}",
                priority="normal"
            )
            await db.notifications.insert_one(notification.dict())
    
    return task_dict

@router.put("/{task_id}", response_model=Task)
async def update_task(
    task_id: str,
    task_data: TaskUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """Update task"""
    task = await db.tasks.find_one({"_id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = {k: v for k, v in task_data.dict(exclude_unset=True).items()}
    update_data["updatedAt"] = datetime.utcnow()
    
    if update_data:
        await db.tasks.update_one({"_id": task_id}, {"$set": update_data})
        
        # Log activity
        activity = ActivityCreate(
            userId=current_user["_id"],
            action="task_updated",
            taskId=task_id,
            projectId=task.get("projectId"),
            description=f"{current_user['fullName']} updated task {task['title']}"
        )
        await db.activities.insert_one(activity.dict())
    
    updated_task = await db.tasks.find_one({"_id": task_id})
    return updated_task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Delete task"""
    task = await db.tasks.find_one({"_id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    await db.tasks.delete_one({"_id": task_id})
    
    # Also delete related subtasks, comments, timelogs
    await db.subtasks.delete_many({"taskId": task_id})
    await db.comments.delete_many({"taskId": task_id})
    await db.timelogs.delete_many({"taskId": task_id})
    
    return None

@router.put("/{task_id}/status", response_model=Task)
async def update_task_status(
    task_id: str,
    status: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Update task status (for drag-drop)"""
    task = await db.tasks.find_one({"_id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    await db.tasks.update_one(
        {"_id": task_id},
        {"$set": {"status": status, "updatedAt": datetime.utcnow()}}
    )
    
    # Log activity
    activity = ActivityCreate(
        userId=current_user["_id"],
        action="status_changed",
        taskId=task_id,
        projectId=task.get("projectId"),
        description=f"{current_user['fullName']} changed task status to {status}",
        metadata={"oldStatus": task["status"], "newStatus": status}
    )
    await db.activities.insert_one(activity.dict())
    
    updated_task = await db.tasks.find_one({"_id": task_id})
    return updated_task

@router.put("/{task_id}/progress", response_model=Task)
async def update_task_progress(
    task_id: str,
    progress: int,
    current_user: dict = Depends(get_current_active_user)
):
    """Update task progress"""
    if not 0 <= progress <= 100:
        raise HTTPException(status_code=400, detail="Progress must be between 0 and 100")
    
    task = await db.tasks.find_one({"_id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    await db.tasks.update_one(
        {"_id": task_id},
        {"$set": {"progress": progress, "updatedAt": datetime.utcnow()}}
    )
    
    updated_task = await db.tasks.find_one({"_id": task_id})
    return updated_task

@router.post("/{task_id}/assign", response_model=Task)
async def assign_task(
    task_id: str,
    user_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Assign user to task"""
    task = await db.tasks.find_one({"_id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if user exists
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Add user if not already assigned
    if user_id not in task.get("assignees", []):
        await db.tasks.update_one(
            {"_id": task_id},
            {"$push": {"assignees": user_id}}
        )
        
        # Create notification
        notification = NotificationCreate(
            recipientId=user_id,
            type="task_assigned",
            taskId=task_id,
            senderId=current_user["_id"],
            message=f"{current_user['fullName']} assigned you a task: {task['title']}",
            priority="normal"
        )
        await db.notifications.insert_one(notification.dict())
        
        # Log activity
        activity = ActivityCreate(
            userId=current_user["_id"],
            action="user_assigned",
            taskId=task_id,
            projectId=task.get("projectId"),
            description=f"{current_user['fullName']} assigned {user['fullName']} to task"
        )
        await db.activities.insert_one(activity.dict())
    
    updated_task = await db.tasks.find_one({"_id": task_id})
    return updated_task
