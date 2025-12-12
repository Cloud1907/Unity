from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class NotificationBase(BaseModel):
    recipientId: str
    type: str  # task_assigned, task_updated, comment_added, due_date_reminder, mention
    taskId: Optional[str] = None
    senderId: Optional[str] = None
    message: str
    isRead: bool = False
    priority: str = "normal"  # low, normal, high

class NotificationCreate(NotificationBase):
    pass

class NotificationUpdate(BaseModel):
    isRead: Optional[bool] = None

class Notification(NotificationBase):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
