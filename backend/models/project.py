from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = "📁"
    color: Optional[str] = "#0086c0"
    owner: str
    members: List[str] = []
    department: Optional[str] = None
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None
    budget: Optional[float] = None
    status: str = "planning"  # planning, in_progress, on_hold, completed, cancelled
    priority: str = "medium"  # low, medium, high, urgent
    favorite: bool = False

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    members: Optional[List[str]] = None
    department: Optional[str] = None
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None
    budget: Optional[float] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    favorite: Optional[bool] = None

class Project(ProjectBase):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    createdBy: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "name": "Web Sitesi Yenileme",
                "description": "Şirket web sitesinin yenilenmesi",
                "icon": "🌐",
                "color": "#0086c0",
                "status": "in_progress",
                "priority": "high"
            }
        }
