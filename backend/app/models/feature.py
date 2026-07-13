from sqlalchemy import Column, String, DateTime, ForeignKey, Float, JSON
from sqlalchemy.sql import func
from app.core.database import Base

class Feature(Base):
    __tablename__ = "features"

    id = Column(String(36), primary_key=True)
    part_id = Column(String(36), ForeignKey("parts.id", ondelete="CASCADE"), nullable=False)
    feature_type = Column(String(50), nullable=False)  # "step", "groove", "thread", "chamfer", "radius", "hole"
    start_z = Column(Float, nullable=False)
    start_x = Column(Float, nullable=False)
    end_z = Column(Float, nullable=False)
    end_x = Column(Float, nullable=False)
    parameters = Column(JSON, nullable=True)  # Contains feature-specific options (e.g. pitch, angle, radius)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
