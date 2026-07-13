from fastapi import APIRouter

from app.api.v1.routes_auth import router as auth_router
from app.api.v1.routes_drawings import router as drawing_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(drawing_router, prefix="/drawings", tags=["drawings"])
