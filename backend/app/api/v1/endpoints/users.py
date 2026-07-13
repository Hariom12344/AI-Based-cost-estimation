from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.api.schemas.user import UserResponse, UserUpdate
from app.models.user import User
from app.repositories.user_repository import user_repository
from app.core.security import get_password_hash

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def read_user_me(
    current_user: User = Depends(deps.get_current_active_user)
) -> UserResponse:
    """Retrieve details of the currently authenticated user."""
    return current_user

@router.get("/", response_model=List[UserResponse])
def read_users(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.RoleRequired(allowed_roles=["admin"]))
) -> List[UserResponse]:
    """Retrieve all users (Admin only)."""
    users = user_repository.get_multi(db, skip=skip, limit=limit)
    return users

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    user_in: UserUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> UserResponse:
    """Update user information (Admin can update anyone, Engineer can update self)."""
    # Enforce access policy
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. Cannot update another user's profile."
        )
        
    db_obj = user_repository.get(db, id=user_id)
    if not db_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    # Convert schema to dict, filter out unset optional values
    update_data = user_in.model_dump(exclude_unset=True)
    
    # Process password hash update if present
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = get_password_hash(update_data["password"])
        del update_data["password"]
        
    # Restrict roles updates to Admins
    if "role" in update_data and current_user.role != "admin":
        del update_data["role"]
        
    updated_user = user_repository.update(db, db_obj=db_obj, obj_in=update_data)
    return updated_user
