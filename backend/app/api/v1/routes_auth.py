from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.schemas import AccessTokenResponse, LoginRequest, RefreshRequest, TokenResponse, UserCreate, UserRead
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=UserRead)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    return AuthService(db).register(payload.email, payload.password, payload.role)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    access_token, refresh_token, user = AuthService(db).login(payload.email, payload.password)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token, user=user)


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    access_token = AuthService(db).refresh_access_token(payload.refresh_token)
    return AccessTokenResponse(access_token=access_token)


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)):
    return current_user
