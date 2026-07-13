from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.v1.schemas import DrawingRead, DrawingUploadResponse
from app.core.config import settings
from app.core.database import get_db
from app.core.deps import require_roles
from app.models.user import User, UserRole
from app.repositories.drawing_repository import DrawingRepository
from app.services.parser_service import parse_drawing

router = APIRouter()

ALLOWED_EXTENSIONS = {".dxf": "dxf", ".png": "image", ".jpg": "image", ".jpeg": "image"}


@router.post("/upload", response_model=DrawingUploadResponse)
async def upload_drawing(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.engineer)),
):
    extension = Path(file.filename or "").suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")

    upload_dir = Path(settings.uploads_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    stored_name = f"{uuid4().hex}{extension}"
    file_path = upload_dir / stored_name
    file_content = await file.read()
    file_path.write_bytes(file_content)

    drawing = DrawingRepository(db).create(
        filename=file.filename or stored_name,
        file_path=str(file_path),
        file_type=ALLOWED_EXTENSIONS[extension],
        uploader_id=current_user.id,
    )

    parsed_summary = parse_drawing(str(file_path), ALLOWED_EXTENSIONS[extension])
    return DrawingUploadResponse(drawing=DrawingRead.model_validate(drawing), parsed_summary=parsed_summary)


@router.get("/", response_model=list[DrawingRead])
def list_drawings(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin, UserRole.engineer)),
):
    drawings = DrawingRepository(db).list_all()
    return [DrawingRead.model_validate(drawing) for drawing in drawings]
