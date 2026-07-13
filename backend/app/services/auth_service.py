from datetime import timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.user import User
from app.repositories.user_repository import user_repository
from app.core import security
from app.core.exceptions import AuthenticationError, UserAlreadyExistsError

class AuthService:
    def authenticate(
        self, db: Session, username_or_email: str, password: str
    ) -> Optional[User]:
        """Authenticate a user by email or username, and verify their password."""
        # Try retrieving by email first, then username
        user = user_repository.get_by_email(db, username_or_email)
        if not user:
            user = user_repository.get_by_username(db, username_or_email)
            
        if not user:
            return None
        if not security.verify_password(password, user.hashed_password):
            return None
        return user

    def register_user(
        self, db: Session, *, username: str, email: str, password: str, role: str = "engineer"
    ) -> User:
        """Register a new user after checking email/username uniqueness."""
        if user_repository.get_by_email(db, email):
            raise UserAlreadyExistsError("A user with this email already exists.")
        if user_repository.get_by_username(db, username):
            raise UserAlreadyExistsError("A user with this username already exists.")
            
        hashed_password = security.get_password_hash(password)
        new_user = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            role=role,
            is_active=True
        )
        return user_repository.create(db, obj_in=new_user)

    def generate_auth_tokens(self, user: User) -> Dict[str, Any]:
        """Generate JWT access and refresh tokens for a user."""
        access_token = security.create_access_token(subject=user.id)
        refresh_token = security.create_refresh_token(subject=user.id)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }

auth_service = AuthService()
