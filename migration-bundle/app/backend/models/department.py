from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class DepartmentBase(BaseModel):
    name: str
    headOfDepartment: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    headOfDepartment: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None

class Department(DepartmentBase):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "name": "Product Team",
                "description": "Ürün geliştirme ekibi",
                "color": "#6366f1"
            }
        }
