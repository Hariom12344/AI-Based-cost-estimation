from typing import Optional
from sqlalchemy.orm import Session
from app.models.plan import ManufacturingPlan
from app.repositories.base import BaseRepository

class PlanRepository(BaseRepository[ManufacturingPlan]):
    def __init__(self) -> None:
        super().__init__(ManufacturingPlan)

    def get_by_part(self, db: Session, part_id: str) -> Optional[ManufacturingPlan]:
        return db.query(self.model).filter(self.model.part_id == part_id).first()

plan_repository = PlanRepository()
