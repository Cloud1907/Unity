from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class SubtaskBase(BaseModel):
    taskId: str
    title: str
    description: Optional[str] = None
    assignedTo: Optional[str] = None
    status: str = "not_started"  # not_started, in_progress, completed
    dueDate: Optional[datetime] = None
    completed: bool = False

class SubtaskCreate(SubtaskBase):
    pass

class SubtaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assignedTo: Optional[str] = None
    status: Optional[str] = None
    dueDate: Optional[datetime] = None
    completed: Optional[bool] = None

class Subtask(SubtaskBase):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
