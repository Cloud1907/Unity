from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import timedelta, datetime
from models.user import UserCreate, User, UserInDB, UserResponse
from utils.auth import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_refresh_token, ACCESS_TOKEN_EXPIRE_MINUTES
from utils.dependencies import db, get_current_active_user
from bson import ObjectId
import random

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str # Can be email or username
    password: str

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: UserResponse

class RegisterRequest(UserCreate):
    pass

def generate_random_color():
    """Generate a random hex color"""
    colors = ['#ff5a5f', '#00c875', '#0086c0', '#fdab3d', '#e2445c', '#579bfc', '#9cd326', '#a25ddc']
    return random.choice(colors)

@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: RegisterRequest):
    """Register a new user"""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user_dict = user_data.dict()
    user_dict["password"] = get_password_hash(user_data.password)
    user_dict["_id"] = str(ObjectId())
    
    # Generate username if not provided
    if not user_dict.get("username"):
        user_dict["username"] = user_dict["email"].split('@')[0]
    
    # Generate random color if not provided
    if not user_dict.get("color"):
        user_dict["color"] = generate_random_color()
    
    # Set default avatar if not provided
    if not user_dict.get("avatar"):
        # Use DiceBear API for consistent, professional avatars
        # Style: avataaars (human-like avatars)
        user_dict["avatar"] = f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_dict['email']}"
    
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user_dict["_id"]}
    )

    # Create refresh token
    refresh_token = create_refresh_token(
        data={"sub": user_dict["_id"]}
    )
    
    # Remove password from response
    user_response = {k: v for k, v in user_dict.items() if k != "password"}
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_response
    }

@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    """Login user via Email OR Username"""
    # Find user by email or username
    identifier = login_data.email # Frontend sends it in 'email' field for compatibility, but it can be username
    
    user = await db.users.find_one({
        "$or": [
            {"email": identifier},
            {"username": identifier}
        ]
    })
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Hatalı kullanıcı adı/email veya şifre",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(login_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Hatalı kullanıcı adı/email veya şifre",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.get("isActive", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user["_id"]}
    )

    # Create refresh token
    refresh_token = create_refresh_token(
        data={"sub": user["_id"]}
    )
    
    # Remove password from response
    user_response = {k: v for k, v in user.items() if k != "password"}
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_response
    }

class RefreshTokenRequest(BaseModel):
    refresh_token: str

@router.post("/refresh", response_model=dict)
async def refresh_token(request: RefreshTokenRequest):
    """Refresh access token"""
    payload = decode_refresh_token(request.refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Check if user exists and is active
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    if not user.get("isActive", True):
        raise HTTPException(status_code=400, detail="Inactive user account")
        
    # Create new access token
    access_token = create_access_token(
        data={"sub": user_id}
    )
    
    # Optional: Rotate refresh token?
    # For now, keep the same refresh token until it expires
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_active_user)):
    """Get current user"""
    return {k: v for k, v in current_user.items() if k != "password"}

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/change-password", response_model=dict)
async def change_password(
    password_data: PasswordChangeRequest,
    current_user: dict = Depends(get_current_active_user)
):
    """Change current user password"""
    # Verify current password
    user = await db.users.find_one({"_id": current_user["_id"]})
    if not verify_password(password_data.current_password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mevcut şifre yanlış"
        )
    
    # Update password
    new_hash = get_password_hash(password_data.new_password)
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"password": new_hash}}
    )
    
    return {"message": "Şifre başarıyla güncellendi"}

class ProfileUpdateRequest(BaseModel):
    fullName: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: ProfileUpdateRequest,
    current_user: dict = Depends(get_current_active_user)
):
    """Update current user profile"""
    update_data = profile_data.dict(exclude_unset=True)
    
    if update_data:
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"_id": current_user["_id"]})
    return {k: v for k, v in updated_user.items() if k != "password"}
