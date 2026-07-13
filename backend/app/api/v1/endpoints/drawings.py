from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, status, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.api import deps
from app.api.schemas.drawing import DrawingResponse
from app.models.user import User
from app.services.drawing_service import drawing_service
from app.core.exceptions import AppError

router = APIRouter()

@router.post("/upload", response_model=DrawingResponse, status_code=status.HTTP_201_CREATED)
def upload_drawing_file(
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> DrawingResponse:
    """Upload a 2D engineering drawing (PNG, JPG, PDF, DXF)."""
    try:
        drawing = drawing_service.upload_drawing(db, file=file, user_id=current_user.id)
        return drawing
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.get("/", response_model=List[DrawingResponse])
def get_user_drawings(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> List[DrawingResponse]:
    """Retrieve list of drawing files uploaded by the active user."""
    return drawing_service.get_drawings_for_user(db, user_id=current_user.id)

@router.get("/{drawing_id}", response_model=DrawingResponse)
def get_drawing_details(
    drawing_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> DrawingResponse:
    """Retrieve metadata information for a specific drawing file."""
    try:
        return drawing_service.get_drawing_for_user(db, user_id=current_user.id, drawing_id=drawing_id)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.get("/{drawing_id}/file")
def download_drawing_file(
    drawing_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> FileResponse:
    """Retrieve the physical drawing file for rendering or download."""
    try:
        drawing = drawing_service.get_drawing_for_user(db, user_id=current_user.id, drawing_id=drawing_id)
        return FileResponse(
            path=drawing.file_path,
            filename=drawing.original_filename,
            media_type="application/octet-stream"
        )
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.delete("/{drawing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_drawing_file(
    drawing_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> None:
    """Delete a drawing metadata record and erase its file from physical disk."""
    try:
        drawing_service.delete_drawing(db, user_id=current_user.id, drawing_id=drawing_id)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
