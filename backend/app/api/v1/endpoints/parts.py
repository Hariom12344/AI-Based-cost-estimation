from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.api.schemas.part import AnalysisResponse, PlanResponse, FeatureResponse
from app.models.user import User
from app.repositories.drawing_repository import drawing_repository
from app.repositories.part_repository import part_repository
from app.repositories.feature_repository import feature_repository
from app.repositories.plan_repository import plan_repository
from app.services.cv_service import cv_service
from app.services.feature_service import feature_service
from app.services.intel_service import intel_service
from app.services.gcode_service import gcode_service
from app.services.verification_service import verification_service
from app.models.part import Part
from app.core.exceptions import AppError
import uuid

router = APIRouter()

@router.post("/{drawing_id}/analyze", response_model=AnalysisResponse)
def analyze_drawing(
    drawing_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> AnalysisResponse:
    """Run full CAM pipeline: pre-process, extract edges, detect features, sequence plans, compile G-Code."""
    # 1. Verify drawing ownership
    drawing = drawing_repository.get_by_user_and_id(db, user_id=current_user.id, id=drawing_id)
    if not drawing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Drawing not found or access denied."
        )

    try:
        # Check if already analyzed, to prevent duplicate creations
        existing_part = part_repository.get_by_drawing(db, drawing_id=drawing_id)
        if existing_part:
            # Clean up old part cascades to re-analyze cleanly
            part_repository.remove(db, id=existing_part.id)

        # 2. Run Module 3: CV Vectorizer & OCR annotations mapping
        cv_data = cv_service.analyze_drawing(drawing.file_path, drawing.file_type)
        
        part_obj = Part(
            id=str(uuid.uuid4()),
            drawing_id=drawing_id,
            part_name=drawing.original_filename.split(".")[0],
            digital_representation=cv_data
        )
        part = part_repository.create(db, obj_in=part_obj)

        # 3. Run Module 4: Geometric Feature recognition & Classification
        features = feature_service.classify_features(db, part_id=part.id, digital_representation=cv_data)

        # 4. Run Module 5, 6, & 7: Sequence operations, tooling, parameters
        plan = intel_service.generate_plan(
            db,
            part_id=part.id,
            max_diameter=cv_data["max_diameter"],
            overall_length=cv_data["overall_length"],
            features=features
        )

        # 5. Run Module 8: G-Code Compilation
        gcode = gcode_service.generate_gcode(plan.operations, cv_data["geometry"])

        # 6. Run Module 9: Verification, checks, and confidence score
        verification = verification_service.verify_plan(
            plan.operations,
            overall_length=cv_data["overall_length"],
            max_diameter=cv_data["max_diameter"]
        )

        # 7. Update plan with generated program & verification
        plan.gcode_program = gcode
        plan.verification_results = verification
        
        db.add(plan)
        db.commit()
        db.refresh(plan)

        # Update drawing status to completed
        drawing.status = "completed"
        db.add(drawing)
        db.commit()

        return {
            "drawing_id": drawing_id,
            "status": "completed",
            "part": part,
            "features": features,
            "plan": plan
        }
        
    except AppError as e:
        drawing.status = "failed"
        db.add(drawing)
        db.commit()
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        drawing.status = "failed"
        db.add(drawing)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Unexpected pipeline failure: {str(e)}")

@router.get("/{drawing_id}/plan", response_model=PlanResponse)
def get_part_machining_plan(
    drawing_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> PlanResponse:
    """Retrieve the generated plan, cutting parameters, and G-Code for a drawing."""
    # Verify drawing ownership
    drawing = drawing_repository.get_by_user_and_id(db, user_id=current_user.id, id=drawing_id)
    if not drawing:
        raise HTTPException(status_code=404, detail="Drawing not found or access denied.")

    part = part_repository.get_by_drawing(db, drawing_id=drawing_id)
    if not part:
        raise HTTPException(status_code=404, detail="Drawing has not been analyzed yet. Run analysis first.")

    plan = plan_repository.get_by_part(db, part_id=part.id)
    if not plan:
        raise HTTPException(status_code=404, detail="Machining plan not found.")
        
    return plan

@router.get("/{drawing_id}", response_model=AnalysisResponse)
def get_full_analysis(
    drawing_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> AnalysisResponse:
    """Retrieve full analysis (Part, Features, Plan) for a drawing."""
    # Verify drawing ownership
    drawing = drawing_repository.get_by_user_and_id(db, user_id=current_user.id, id=drawing_id)
    if not drawing:
        raise HTTPException(status_code=404, detail="Drawing not found or access denied.")

    part = part_repository.get_by_drawing(db, drawing_id=drawing_id)
    if not part:
        raise HTTPException(status_code=404, detail="Drawing has not been analyzed yet.")

    features = feature_repository.get_by_part(db, part_id=part.id)
    plan = plan_repository.get_by_part(db, part_id=part.id)
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found.")

    return {
        "drawing_id": drawing_id,
        "status": "completed",
        "part": part,
        "features": features,
        "plan": plan
    }
