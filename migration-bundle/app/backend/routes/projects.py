from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from models.project import Project, ProjectCreate, ProjectUpdate
from models.activity import ActivityCreate
from utils.dependencies import db, get_current_active_user
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=List[Project])
async def get_projects(
    department: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_active_user)
):
    """Get projects for current user"""
    # Admin sees everything
    if current_user.get("role") == "admin":
        query = {}
    else:
        # Visibility Logic:
        # 1. User is owner or member (always see, even if private)
        # 2. Project is NOT private AND user is in the same department (or one of the user's departments)
        
        user_depts = current_user.get("departments", [])
        if current_user.get("department"):
            user_depts.append(current_user.get("department"))

        query = {
            "$or": [
                {"owner": current_user["_id"]},
                {"members": current_user["_id"]},
                {
                    "$and": [
                        {"isPrivate": {"$ne": True}}, # Not private
                        {"department": {"$in": user_depts}}, # In one of user's departments
                        {"department": {"$ne": None}}
                    ]
                }
            ]
        }
    
    # Apply department filter if provided in query
    if department:
        query["department"] = department
    
    projects = await db.projects.find(query).to_list(1000)
    return projects

@router.get("/{project_id}", response_model=Project)
async def get_project(
    project_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get project by ID"""
    project = await db.projects.find_one({"_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if user has access
    is_admin = current_user.get("role") == "admin"
    is_owner = project["owner"] == current_user["_id"]
    is_member = current_user["_id"] in project.get("members", [])
    is_private = project.get("isPrivate", False)
    is_in_department = project.get("department") == current_user.get("department") and current_user.get("department") is not None
    
    # Access is allowed if:
    # - User is Admin
    # - User is Owner/Member
    # - (Project is NOT private) AND (User is in the same department)
    can_access = is_admin or is_owner or is_member or (not is_private and is_in_department)
    
    if not can_access:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return project

@router.post("", response_model=Project, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new project"""
    project_dict = project_data.dict()
    project_dict["_id"] = str(ObjectId())
    project_dict["createdBy"] = current_user["_id"]
    
    # Department Logic
    user_depts = current_user.get("departments", [])
    if current_user.get("department"): # Legacy support
        if current_user["department"] not in user_depts:
            user_depts.append(current_user["department"])
            
    # If project department is specified, verify user has access to it
    if project_dict.get("department"):
        if project_dict["department"] not in user_depts and current_user["role"] != "admin":
             # Optional: Allow creating for other depts? Usually strict.
             # Let's verify membership.
             pass # Assuming user can only create for their depts
             if project_dict["department"] not in user_depts:
                 raise HTTPException(status_code=400, detail="You can only create projects in your assigned departments")
    else:
        # If no department specified
        if len(user_depts) == 1:
            # Auto-assign if only 1 dept
            project_dict["department"] = user_depts[0]
        elif len(user_depts) > 1:
            # Require selection if multiple
            raise HTTPException(status_code=400, detail="Please select a department for this project")
        # If 0 depts, leave as None (Global/Personal)

    # Add owner to members if not already
    if project_dict["owner"] not in project_dict["members"]:
        project_dict["members"].append(project_dict["owner"])
    
    await db.projects.insert_one(project_dict)
    
    # Log activity
    activity = ActivityCreate(
        userId=current_user["_id"],
        action="project_created",
        projectId=project_dict["_id"],
        description=f"{current_user['fullName']} created project {project_data.name}"
    )
    await db.activities.insert_one(activity.dict())
    
    return project_dict

@router.put("/{project_id}", response_model=Project)
async def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    """Update project"""
    project = await db.projects.find_one({"_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if user is owner or admin
    if str(project["owner"]) != str(current_user["_id"]) and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only project owner can update")
    
    update_data = {k: v for k, v in project_data.dict(exclude_unset=True).items()}
    update_data["updatedAt"] = datetime.utcnow()
    
    if update_data:
        await db.projects.update_one({"_id": project_id}, {"$set": update_data})
    
    updated_project = await db.projects.find_one({"_id": project_id})
    return updated_project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    # Retrieve project
    project = await db.projects.find_one({"_id": project_id})
    if not project:
        # Fallback: Try ObjectId
        try:
            project = await db.projects.find_one({"_id": ObjectId(project_id)})
        except:
            pass
            
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check if user is owner or admin or manager
    is_owner = str(project["owner"]) == str(current_user["_id"])
    is_admin = current_user["role"] == "admin"
    is_manager = current_user["role"] == "manager"
    
    if not is_owner and not is_admin and not is_manager:
        raise HTTPException(status_code=403, detail="Only project owner, admin, or manager can delete")
    
    # Perform deletion
    await db.projects.delete_one({"_id": project["_id"]})
    return None

@router.post("/{project_id}/members", response_model=Project)
async def add_project_member(
    project_id: str,
    user_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Add member to project"""
    project = await db.projects.find_one({"_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if user is owner or admin
    if str(project["owner"]) != str(current_user["_id"]) and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only project owner can add members")
    
    # Check if user exists
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Add member if not already in list
    if user_id not in project.get("members", []):
        await db.projects.update_one(
            {"_id": project_id},
            {"$push": {"members": user_id}}
        )
    
    updated_project = await db.projects.find_one({"_id": project_id})
    return updated_project

@router.delete("/{project_id}/members/{user_id}", response_model=Project)
async def remove_project_member(
    project_id: str,
    user_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Remove member from project"""
    project = await db.projects.find_one({"_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if user is owner or admin
    if str(project["owner"]) != str(current_user["_id"]) and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only project owner can remove members")
    
    # Don't allow removing owner
    if user_id == project["owner"]:
        raise HTTPException(status_code=400, detail="Cannot remove project owner")
    
    await db.projects.update_one(
        {"_id": project_id},
        {"$pull": {"members": user_id}}
    )
    
    updated_project = await db.projects.find_one({"_id": project_id})
    return updated_project

@router.put("/{project_id}/favorite", response_model=Project)
async def toggle_favorite(
    project_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Toggle project favorite"""
    project = await db.projects.find_one({"_id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if user has access
    # Check if user has access
    is_owner = str(project["owner"]) == str(current_user["_id"])
    is_member = str(current_user["_id"]) in [str(m) for m in project.get("members", [])]
    
    if not is_owner and not is_member:
        raise HTTPException(status_code=403, detail="Access denied")
    
    new_favorite = not project.get("favorite", False)
    await db.projects.update_one(
        {"_id": project_id},
        {"$set": {"favorite": new_favorite}}
    )
    
    updated_project = await db.projects.find_one({"_id": project_id})
    return updated_project
