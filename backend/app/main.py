from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import engine, Base
from app.core.exceptions import AppError
from app.api.v1.api import api_router
# Import models to register them with Base.metadata
from app.models.user import User
from app.models.drawing import Drawing
from app.models.part import Part
from app.models.feature import Feature
from app.models.plan import ManufacturingPlan

# Automatically create database tables if they do not exist
# Note: In production environments, migration tools like Alembic are preferred.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS middleware for secure cross-origin resource sharing
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Register global custom exceptions handler to translate AppErrors
@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
    )

# Include application API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"message": "Welcome to IntelliCAM AI API"}
