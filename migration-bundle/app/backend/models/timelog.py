from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class TimeLogBase(BaseModel):
    taskId: str
    userId: str
    date: datetime = Field(default_factory=datetime.utcnow)
    hoursSpent: float
    description: Optional[str] = None
    workType: str = "development"  # development, design, analysis, planning, meeting, other
    billable: bool = True

class TimeLogCreate(TimeLogBase):
    pass

class TimeLogUpdate(BaseModel):
    date: Optional[datetime] = None
    hoursSpent: Optional[float] = None
    description: Optional[str] = None
    workType: Optional[str] = None
    billable: Optional[bool] = None

class TimeLog(TimeLogBase):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
