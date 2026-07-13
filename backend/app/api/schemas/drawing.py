from datetime import datetime
from pydantic import BaseModel, ConfigDict

class DrawingResponse(BaseModel):
    id: str
    original_filename: str
    file_type: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
