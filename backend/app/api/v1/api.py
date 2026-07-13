from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, drawings, parts

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(drawings.router, prefix="/drawings", tags=["drawings"])
api_router.include_router(parts.router, prefix="/parts", tags=["parts"])
