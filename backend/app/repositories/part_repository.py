from typing import Optional
from sqlalchemy.orm import Session
from app.models.part import Part
from app.repositories.base import BaseRepository

class PartRepository(BaseRepository[Part]):
    def __init__(self) -> None:
        super().__init__(Part)

    def get_by_drawing(self, db: Session, drawing_id: str) -> Optional[Part]:
        return db.query(self.model).filter(self.model.drawing_id == drawing_id).first()

part_repository = PartRepository()
