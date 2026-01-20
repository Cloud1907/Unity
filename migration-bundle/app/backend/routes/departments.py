from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from models.department import Department, DepartmentCreate, DepartmentUpdate
from utils.dependencies import db, get_current_active_user, get_admin_user
from bson import ObjectId

router = APIRouter(prefix="/departments", tags=["Departments"])

@router.get("", response_model=List[Department])
async def get_departments(current_user: dict = Depends(get_current_active_user)):
    """Get all departments"""
    departments = await db.departments.find().to_list(1000)
    return departments

@router.post("", response_model=Department, status_code=status.HTTP_201_CREATED)
async def create_department(
    department_data: DepartmentCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """Create department (admin only)"""
    department_dict = department_data.dict()
    department_dict["_id"] = str(ObjectId())
    
    await db.departments.insert_one(department_dict)
    return department_dict

@router.put("/{department_id}", response_model=Department)
async def update_department(
    department_id: str,
    department_data: DepartmentUpdate,
    current_user: dict = Depends(get_admin_user)
):
    """Update department (admin only)"""
    department = await db.departments.find_one({"_id": department_id})
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    update_data = {k: v for k, v in department_data.dict(exclude_unset=True).items()}
    if update_data:
        await db.departments.update_one({"_id": department_id}, {"$set": update_data})
    
    updated_department = await db.departments.find_one({"_id": department_id})
    return updated_department

@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department(
    department_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Delete department (admin only)"""
    result = await db.departments.delete_one({"_id": department_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Department not found")
    return None
