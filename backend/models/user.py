from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class UserBase(BaseModel):
    fullName: str
    email: EmailStr
    department: Optional[str] = None
    role: str = "member"  # admin, manager, member, guest
    manager: Optional[str] = None
    avatar: Optional[str] = None
    color: Optional[str] = None
    isActive: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    fullName: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None
    role: Optional[str] = None
    manager: Optional[str] = None
    avatar: Optional[str] = None
    color: Optional[str] = None
    isActive: Optional[bool] = None

class User(UserBase):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "fullName": "Ahmet Yılmaz",
                "email": "ahmet@example.com",
                "role": "member",
                "color": "#ff5a5f",
                "isActive": True
            }
        }

class UserInDB(User):
    password: str

class UserResponse(User):
    pass
