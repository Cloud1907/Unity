from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from models.timelog import TimeLog, TimeLogCreate, TimeLogUpdate
from utils.dependencies import db, get_current_active_user
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/timelogs", tags=["TimeLogs"])

@router.get("", response_model=List[TimeLog])
async def get_timelogs(
    taskId: Optional[str] = Query(None),
    userId: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_active_user)
):
    """Get time logs with filters"""
    query = {}
    
    if taskId:
        query["taskId"] = taskId
    
    if userId:
        query["userId"] = userId
    
    timelogs = await db.timelogs.find(query).sort("date", -1).to_list(1000)
    return timelogs

@router.post("", response_model=TimeLog, status_code=status.HTTP_201_CREATED)
async def create_timelog(
    timelog_data: TimeLogCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new time log"""
    # Verify task exists
    task = await db.tasks.find_one({"_id": timelog_data.taskId})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    timelog_dict = timelog_data.dict()
    timelog_dict["_id"] = str(ObjectId())
    
    await db.timelogs.insert_one(timelog_dict)
    return timelog_dict

@router.put("/{timelog_id}", response_model=TimeLog)
async def update_timelog(
    timelog_id: str,
    timelog_data: TimeLogUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """Update time log"""
    timelog = await db.timelogs.find_one({"_id": timelog_id})
    if not timelog:
        raise HTTPException(status_code=404, detail="Time log not found")
    
    # Only log owner can update
    if timelog["userId"] != current_user["_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this time log")
    
    update_data = {k: v for k, v in timelog_data.dict(exclude_unset=True).items()}
    
    if update_data:
        await db.timelogs.update_one({"_id": timelog_id}, {"$set": update_data})
    
    updated_timelog = await db.timelogs.find_one({"_id": timelog_id})
    return updated_timelog

@router.delete("/{timelog_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_timelog(
    timelog_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Delete time log"""
    timelog = await db.timelogs.find_one({"_id": timelog_id})
    if not timelog:
        raise HTTPException(status_code=404, detail="Time log not found")
    
    # Only log owner or admin can delete
    if timelog["userId"] != current_user["_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this time log")
    
    await db.timelogs.delete_one({"_id": timelog_id})
    return None

@router.get("/reports", response_model=dict)
async def get_time_reports(
    userId: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_active_user)
):
    """Get time tracking reports"""
    query = {}
    if userId:
        query["userId"] = userId
    
    timelogs = await db.timelogs.find(query).to_list(10000)
    
    # Calculate totals
    total_hours = sum(log["hoursSpent"] for log in timelogs)
    billable_hours = sum(log["hoursSpent"] for log in timelogs if log.get("billable", True))
    non_billable_hours = total_hours - billable_hours
    
    # Group by work type
    by_work_type = {}
    for log in timelogs:
        work_type = log.get("workType", "other")
        if work_type not in by_work_type:
            by_work_type[work_type] = 0
        by_work_type[work_type] += log["hoursSpent"]
    
    return {
        "totalHours": total_hours,
        "billableHours": billable_hours,
        "nonBillableHours": non_billable_hours,
        "byWorkType": by_work_type,
        "totalLogs": len(timelogs)
    }
