import os
import re
import uuid
from typing import List, Optional
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.models.drawing import Drawing
from app.repositories.drawing_repository import drawing_repository
from app.core.exceptions import AppError

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf", "dxf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
UPLOADS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))

def sanitize_filename(filename: str) -> str:
    """Sanitize the uploaded filename to prevent directory traversal attacks."""
    # Extract only the base name
    base_name = os.path.basename(filename)
    # Replace any non-alphanumeric, dot, dash, or underscore characters with an underscore
    sanitized = re.sub(r'[^a-zA-Z0-9_.-]', '_', base_name)
    # Ensure it's not empty
    if not sanitized or sanitized in {".", ".."}:
        sanitized = f"upload_{uuid.uuid4().hex}"
    return sanitized

class DrawingService:
    def __init__(self) -> None:
        # Guarantee uploads directory exists
        os.makedirs(UPLOADS_DIR, exist_ok=True)

    def upload_drawing(
        self, db: Session, file: UploadFile, user_id: str
    ) -> Drawing:
        """Validate, save file to disk, and create drawing record in database."""
        # 1. Validate File Extension
        filename = file.filename or ""
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise AppError(
                f"Unsupported file format '.{ext}'. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}",
                status_code=400
            )

        # 2. Validate File Size (requires reading cursor check or size meta)
        # To avoid reading whole file into memory, check size dynamically
        size = 0
        chunk_size = 1024 * 1024  # 1MB
        secure_name = f"{uuid.uuid4()}_{sanitize_filename(filename)}"
        file_path = os.path.join(UPLOADS_DIR, secure_name)

        try:
            with open(file_path, "wb") as buffer:
                while True:
                    chunk = file.file.read(chunk_size)
                    if not chunk:
                        break
                    size += len(chunk)
                    if size > MAX_FILE_SIZE:
                        # Clean up file on size breach
                        buffer.close()
                        if os.path.exists(file_path):
                            os.remove(file_path)
                        raise AppError("File size exceeds maximum limit of 10MB", status_code=400)
                    buffer.write(chunk)
        except Exception as e:
            # Re-raise AppErrors
            if isinstance(e, AppError):
                raise e
            # Clean up on generic write failure
            if os.path.exists(file_path):
                os.remove(file_path)
            raise AppError(f"Failed to write file to disk: {str(e)}", status_code=500)

        # 3. Save Drawing Metadata in DB
        new_drawing = Drawing(
            original_filename=filename,
            secure_filename=secure_name,
            file_path=file_path,
            file_type=ext,
            status="pending",
            user_id=user_id
        )
        return drawing_repository.create(db, obj_in=new_drawing)

    def get_drawings_for_user(self, db: Session, user_id: str) -> List[Drawing]:
        """Fetch all drawing metadata uploads for a given user."""
        return drawing_repository.get_by_user(db, user_id=user_id)

    def get_drawing_for_user(
        self, db: Session, user_id: str, drawing_id: str
    ) -> Optional[Drawing]:
        """Fetch a specific drawing, enforcing ownership."""
        drawing = drawing_repository.get_by_user_and_id(db, user_id=user_id, id=drawing_id)
        if not drawing:
            raise AppError("Drawing not found or access denied.", status_code=404)
        return drawing

    def delete_drawing(self, db: Session, user_id: str, drawing_id: str) -> None:
        """Delete drawing file from storage disk and delete DB metadata record."""
        drawing = self.get_drawing_for_user(db, user_id=user_id, drawing_id=drawing_id)
        
        # Remove from physical disk
        if os.path.exists(drawing.file_path):
            try:
                os.remove(drawing.file_path)
            except Exception as e:
                print(f"Warning: Failed to delete file {drawing.file_path}: {e}")
                
        # Remove from DB
        drawing_repository.remove(db, id=drawing_id)

drawing_service = DrawingService()
