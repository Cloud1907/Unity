from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

class ActivityBase(BaseModel):
    userId: str
    action: str  # task_created, task_updated, task_deleted, comment_added, status_changed, user_assigned
    taskId: Optional[str] = None
    projectId: Optional[str] = None
    description: str
    metadata: Optional[Dict[str, Any]] = None

class ActivityCreate(ActivityBase):
    pass

class Activity(ActivityBase):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
