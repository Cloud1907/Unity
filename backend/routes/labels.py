from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timezone
from uuid import uuid4

from ..models.label import Label, LabelCreate, LabelUpdate
from ..database import db
from .auth import get_current_active_user

router = APIRouter(prefix="/labels", tags=["labels"])

@router.get("/project/{project_id}", response_model=List[Label])
async def get_project_labels(
    project_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get all labels for a project"""
    labels = await db.labels.find(
        {"projectId": project_id},
        {"_id": 0}
    ).to_list(100)
    return labels

@router.post("/", response_model=Label)
async def create_label(
    label: LabelCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new label"""
    label_dict = label.dict()
    label_dict["id"] = str(uuid4())
    label_dict["createdAt"] = datetime.now(timezone.utc).isoformat()
    
    await db.labels.insert_one(label_dict)
    
    return {k: v for k, v in label_dict.items() if k != "_id"}

@router.put("/{label_id}", response_model=Label)
async def update_label(
    label_id: str,
    label: LabelUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """Update a label"""
    update_data = label.dict(exclude_unset=True)
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.labels.update_one(
        {"id": label_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Label not found")
    
    updated_label = await db.labels.find_one({"id": label_id}, {"_id": 0})
    return updated_label

@router.delete("/{label_id}")
async def delete_label(
    label_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Delete a label"""
    result = await db.labels.delete_one({"id": label_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Label not found")
    
    # Remove label from all tasks
    await db.tasks.update_many(
        {"tags": label_id},
        {"$pull": {"tags": label_id}}
    )
    
    return {"message": "Label deleted successfully"}
