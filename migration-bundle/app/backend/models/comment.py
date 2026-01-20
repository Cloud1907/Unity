from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class CommentBase(BaseModel):
    taskId: str
    userId: str
    text: str

class CommentCreate(CommentBase):
    pass

class CommentUpdate(BaseModel):
    text: str

class Comment(CommentBase):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
