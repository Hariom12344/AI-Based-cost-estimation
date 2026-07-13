from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Part(Base):
    __tablename__ = "parts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    drawing_id: Mapped[int] = mapped_column(ForeignKey("drawings.id"), nullable=False)
    part_name: Mapped[str] = mapped_column(String(255), nullable=False)
    material: Mapped[str] = mapped_column(String(100), nullable=False)
    raw_stock_dimensions: Mapped[str] = mapped_column(String(255), nullable=False)

    drawing = relationship("Drawing", back_populates="parts")
    features = relationship("Feature", back_populates="part", cascade="all, delete")
    manufacturing_plans = relationship("ManufacturingPlan", back_populates="part", cascade="all, delete")
