from typing import List
from sqlalchemy.orm import Session
from app.models.feature import Feature
from app.repositories.base import BaseRepository

class FeatureRepository(BaseRepository[Feature]):
    def __init__(self) -> None:
        super().__init__(Feature)

    def get_by_part(self, db: Session, part_id: str) -> List[Feature]:
        return db.query(self.model).filter(self.model.part_id == part_id).all()

feature_repository = FeatureRepository()
