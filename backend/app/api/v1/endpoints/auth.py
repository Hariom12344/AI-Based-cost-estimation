import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api import deps
from app.api.schemas.auth import Token, TokenRefreshResponse, RefreshTokenRequest, TokenPayload
from app.api.schemas.user import UserCreate, UserResponse
from app.services.auth_service import auth_service
from app.repositories.user_repository import user_repository
from app.core import security
from app.core.exceptions import AppError

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserCreate,
    db: Session = Depends(deps.get_db)
) -> UserResponse:
    """Register a new engineer or admin account."""
    try:
        user = auth_service.register_user(
            db,
            username=user_in.username,
            email=user_in.email,
            password=user_in.password,
            role=user_in.role
        )
        return user
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.post("/token", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(deps.get_db)
) -> Token:
    """OAuth2 password flow token generation (login)."""
    user = auth_service.authenticate(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username, email, or password",
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )
    
    tokens = auth_service.generate_auth_tokens(user)
    return {
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": tokens["token_type"],
        "user": user
    }

@router.post("/refresh", response_model=TokenRefreshResponse)
def refresh_token(
    payload: RefreshTokenRequest,
    db: Session = Depends(deps.get_db)
) -> TokenRefreshResponse:
    """Generate a new access token using a valid refresh token."""
    try:
        # Decode and validate refresh token
        decoded = security.decode_token(payload.refresh_token)
        token_payload = TokenPayload(**decoded)
        
        if token_payload.type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type. Refresh token required.",
            )
            
        if not token_payload.sub:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token payload.",
            )
            
        user = user_repository.get(db, id=token_payload.sub)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is inactive.",
            )
            
        # Issue new access token
        new_access_token = security.create_access_token(subject=user.id)
        return {"access_token": new_access_token, "token_type": "bearer"}
        
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is expired or invalid.",
        )
