from sqlalchemy.orm import Session

from app.models.drawing import Drawing


class DrawingRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, filename: str, file_path: str, file_type: str, uploader_id: int) -> Drawing:
        drawing = Drawing(
            filename=filename,
            file_path=file_path,
            file_type=file_type,
            uploader_id=uploader_id,
        )
        self.db.add(drawing)
        self.db.commit()
        self.db.refresh(drawing)
        return drawing

    def list_all(self) -> list[Drawing]:
        return self.db.query(Drawing).order_by(Drawing.id.desc()).all()
