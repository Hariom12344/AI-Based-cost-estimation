from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, ConfigDict

class FeatureResponse(BaseModel):
    id: str
    part_id: str
    feature_type: str
    start_z: float
    start_x: float
    end_z: float
    end_x: float
    parameters: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)

class PlanResponse(BaseModel):
    id: str
    part_id: str
    material: str
    machine_tool: str
    operations: List[Dict[str, Any]]
    gcode_program: Optional[str] = None
    verification_results: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PartResponse(BaseModel):
    id: str
    drawing_id: str
    part_name: str
    digital_representation: Dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AnalysisResponse(BaseModel):
    drawing_id: str
    status: str  # "completed", "failed"
    part: PartResponse
    features: List[FeatureResponse]
    plan: PlanResponse
