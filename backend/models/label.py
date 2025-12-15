from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class LabelBase(BaseModel):
    name: str
    color: str  # Hex color code
    projectId: str

class LabelCreate(LabelBase):
    pass

class LabelUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None

class Label(LabelBase):
    id: str = Field(alias="_id")
    createdAt: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }
