from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from models.activity import Activity
from utils.dependencies import db, get_current_active_user

router = APIRouter(prefix="/activity", tags=["Activity"])

@router.get("", response_model=List[Activity])
async def get_activity(
    projectId: Optional[str] = Query(None),
    userId: Optional[str] = Query(None),
    limit: int = Query(100, le=1000),
    current_user: dict = Depends(get_current_active_user)
):
    """Get activity log"""
    query = {}
    
    if projectId:
        query["projectId"] = projectId
    
    if userId:
        query["userId"] = userId
    
    activities = await db.activities.find(query).sort("createdAt", -1).limit(limit).to_list(limit)
    return activities
