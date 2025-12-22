from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class TaskBase(BaseModel):
    projectId: Optional[str] = None  # Nullable - standalone task olabilir
    title: str
    description: Optional[str] = None
    assignees: List[str] = []
    assignedBy: Optional[str] = None
    status: str = "todo"  # todo, working, stuck, review, done
    priority: str = "medium"  # low, medium, high, urgent
    labels: List[str] = []
    startDate: Optional[datetime] = None
    dueDate: Optional[datetime] = None
    progress: int = 0  # 0-100
    subtasks: List[dict] = []  # List of subtask objects
    comments: List[dict] = []  # List of comments
    attachments: List[dict] = []  # List of attachment objects {id, name, url, type, size, uploadedAt}

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    projectId: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    assignees: Optional[List[str]] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    labels: Optional[List[str]] = None
    startDate: Optional[datetime] = None
    dueDate: Optional[datetime] = None
    progress: Optional[int] = None
    subtasks: Optional[List[dict]] = None
    comments: Optional[List[dict]] = None
    attachments: Optional[List[dict]] = None

class Task(TaskBase):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "title": "Ana sayfa tasarımı",
                "description": "Modern ve kullanıcı dostu ana sayfa",
                "status": "working",
                "priority": "high",
                "progress": 65
            }
        }
