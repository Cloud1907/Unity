from fastapi import APIRouter, Depends
from utils.dependencies import db, get_current_active_user
from typing import Dict, Any

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview", response_model=Dict[str, Any])
async def get_overview(current_user: dict = Depends(get_current_active_user)):
    """Get overview analytics"""
    # Count projects where user is member or owner
    total_projects = await db.projects.count_documents({
        "$or": [
            {"owner": current_user["_id"]},
            {"members": current_user["_id"]}
        ]
    })
    
    # Count tasks
    total_tasks = await db.tasks.count_documents({})
    completed_tasks = await db.tasks.count_documents({"status": "done"})
    in_progress_tasks = await db.tasks.count_documents({"status": "working"})
    
    # Count tasks assigned to current user
    my_tasks = await db.tasks.count_documents({"assignees": current_user["_id"]})
    my_completed = await db.tasks.count_documents({
        "assignees": current_user["_id"],
        "status": "done"
    })
    
    # Calculate completion rate
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    my_completion_rate = (my_completed / my_tasks * 100) if my_tasks > 0 else 0
    
    return {
        "totalProjects": total_projects,
        "totalTasks": total_tasks,
        "completedTasks": completed_tasks,
        "inProgressTasks": in_progress_tasks,
        "completionRate": round(completion_rate, 2),
        "myTasks": my_tasks,
        "myCompleted": my_completed,
        "myCompletionRate": round(my_completion_rate, 2)
    }

@router.get("/workload", response_model=Dict[str, Any])
async def get_workload(current_user: dict = Depends(get_current_active_user)):
    """Get workload analysis"""
    # Get all users
    users = await db.users.find().to_list(1000)
    
    workload_data = []
    for user in users:
        user_tasks = await db.tasks.count_documents({"assignees": user["_id"]})
        active_tasks = await db.tasks.count_documents({
            "assignees": user["_id"],
            "status": {"$ne": "done"}
        })
        completed_tasks = await db.tasks.count_documents({
            "assignees": user["_id"],
            "status": "done"
        })
        
        workload_percentage = min((active_tasks / 10) * 100, 100)  # 10 tasks = 100%
        
        workload_data.append({
            "userId": user["_id"],
            "fullName": user["fullName"],
            "email": user["email"],
            "avatar": user.get("avatar"),
            "totalTasks": user_tasks,
            "activeTasks": active_tasks,
            "completedTasks": completed_tasks,
            "workloadPercentage": round(workload_percentage, 2)
        })
    
    return {"workload": workload_data}

@router.get("/project-progress", response_model=Dict[str, Any])
async def get_project_progress(current_user: dict = Depends(get_current_active_user)):
    """Get project progress report"""
    # Get projects where user is member
    projects = await db.projects.find({
        "$or": [
            {"owner": current_user["_id"]},
            {"members": current_user["_id"]}
        ]
    }).to_list(1000)
    
    project_data = []
    for project in projects:
        total_tasks = await db.tasks.count_documents({"projectId": project["_id"]})
        completed_tasks = await db.tasks.count_documents({
            "projectId": project["_id"],
            "status": "done"
        })
        
        progress = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        project_data.append({
            "projectId": project["_id"],
            "projectName": project["name"],
            "totalTasks": total_tasks,
            "completedTasks": completed_tasks,
            "progress": round(progress, 2),
            "status": project.get("status"),
            "priority": project.get("priority")
        })
    
    return {"projects": project_data}
