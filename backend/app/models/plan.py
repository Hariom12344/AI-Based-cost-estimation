from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.core.database import Base

class ManufacturingPlan(Base):
    __tablename__ = "manufacturing_plans"

    id = Column(String(36), primary_key=True)
    part_id = Column(String(36), ForeignKey("parts.id", ondelete="CASCADE"), unique=True, nullable=False)
    material = Column(String(100), nullable=False)
    machine_tool = Column(String(100), nullable=False)
    operations = Column(JSON, nullable=False)  # List of dicts representing operations sequence
    gcode_program = Column(String, nullable=True)  # Fully compiled G-Code text
    verification_results = Column(JSON, nullable=True)  # Collision checks, warnings, and confidence score
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
