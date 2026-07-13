from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_token, hash_password, verify_password, decode_token
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository


class AuthService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)

    def register(self, email: str, password: str, role: UserRole) -> User:
        if self.user_repo.get_by_email(email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")

        return self.user_repo.create(email=email, hashed_password=hash_password(password), role=role)

    def login(self, email: str, password: str) -> tuple[str, str, User]:
        user = self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        access_token = create_token(
            subject=str(user.id),
            role=user.role.value,
            token_type="access",
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
        )
        refresh_token = create_token(
            subject=str(user.id),
            role=user.role.value,
            token_type="refresh",
            expires_delta=timedelta(days=settings.refresh_token_expire_days),
        )
        return access_token, refresh_token, user

    def refresh_access_token(self, refresh_token: str) -> str:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

        user_id = payload.get("sub")
        role = payload.get("role", UserRole.engineer.value)
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

        user = self.user_repo.get_by_id(int(user_id))
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user")

        return create_token(
            subject=str(user_id),
            role=role,
            token_type="access",
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
        )
