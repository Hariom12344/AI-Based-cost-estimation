from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.core.database import Base

class Part(Base):
    __tablename__ = "parts"

    id = Column(String(36), primary_key=True)
    drawing_id = Column(String(36), ForeignKey("drawings.id", ondelete="CASCADE"), unique=True, nullable=False)
    part_name = Column(String(100), nullable=False)
    digital_representation = Column(JSON, nullable=False)  # Contains segments, contours, OCR data
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
