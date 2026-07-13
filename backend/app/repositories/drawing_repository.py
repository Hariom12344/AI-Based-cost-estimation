from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.drawing import Drawing
from app.repositories.base import BaseRepository

class DrawingRepository(BaseRepository[Drawing]):
    def __init__(self) -> None:
        super().__init__(Drawing)

    def get_by_user(self, db: Session, user_id: str) -> List[Drawing]:
        """Fetch all drawings belonging to a specific user."""
        return db.query(self.model).filter(self.model.user_id == user_id).all()

    def get_by_user_and_id(self, db: Session, user_id: str, id: str) -> Optional[Drawing]:
        """Fetch a specific drawing and verify user ownership in a single query."""
        return db.query(self.model).filter(
            self.model.user_id == user_id,
            self.model.id == id
        ).first()

drawing_repository = DrawingRepository()
