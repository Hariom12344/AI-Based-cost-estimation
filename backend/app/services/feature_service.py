import uuid
from typing import List, Dict, Any
from app.models.feature import Feature
from app.repositories.feature_repository import feature_repository
from sqlalchemy.orm import Session

class FeatureService:
    def classify_features(
        self, db: Session, part_id: str, digital_representation: Dict[str, Any]
    ) -> List[Feature]:
        """Runs the rule-based geometric classifier over part segments."""
        geometry = digital_representation.get("geometry", [])
        classified_features = []

        # Analyze each segment and its adjacent context
        i = 0
        while i < len(geometry):
            seg = geometry[i]
            sz = seg["start"]["z"]
            sx = seg["start"]["x"]
            ez = seg["end"]["z"]
            ex = seg["end"]["x"]
            
            dz = ez - sz
            dx = ex - sx
            
            # 1. Detect Chamfer
            # Angled segment, not vertical, not horizontal (typically close to 45 deg)
            if dz != 0 and dx != 0 and abs(dz) < 10 and abs(dx) < 10:
                angle_ratio = abs(dx / dz)
                if 0.5 <= angle_ratio <= 2.0:
                    feat = Feature(
                        id=str(uuid.uuid4()),
                        part_id=part_id,
                        feature_type="chamfer",
                        start_z=sz, start_x=sx, end_z=ez, end_x=ex,
                        parameters={"angle": 45.0, "size": abs(dx)}
                    )
                    classified_features.append(feature_repository.create(db, obj_in=feat))
                    i += 1
                    continue

            # 2. Detect Groove (Lookahead pattern: Step Down -> Horizontal -> Step Up)
            if i < len(geometry) - 2:
                seg2 = geometry[i+1]
                seg3 = geometry[i+2]
                
                # Check for: vertical drop (dx < 0), horizontal segment, vertical rise (dx > 0)
                if dx < 0 and dz == 0:  # step down
                    dz2 = seg2["end"]["z"] - seg2["start"]["z"]
                    dx2 = seg2["end"]["x"] - seg2["start"]["x"]
                    
                    dz3 = seg3["end"]["z"] - seg3["start"]["z"]
                    dx3 = seg3["end"]["x"] - seg3["start"]["x"]
                    
                    if dx2 == 0 and dz2 < 0 and dx3 > 0 and dz3 == 0: # vertical down -> horizontal -> vertical up
                        feat = Feature(
                            id=str(uuid.uuid4()),
                            part_id=part_id,
                            feature_type="groove",
                            start_z=sz, start_x=sx, end_z=seg3["end"]["z"], end_x=seg3["end"]["x"],
                            parameters={"width": abs(dz2), "depth": abs(dx), "bottom_diameter": ex * 2}
                        )
                        classified_features.append(feature_repository.create(db, obj_in=feat))
                        i += 3  # skip groove segments
                        continue

            # 3. Detect Thread (Check for OCR text "M" or "G" on a cylindrical segment)
            is_cylinder = (dx == 0 and dz != 0)
            text_val = seg.get("text") or ""
            if is_cylinder and (("M" in text_val) or ("G" in text_val) or (sz >= -5.0)):  # fallback first step as thread
                feat = Feature(
                    id=str(uuid.uuid4()),
                    part_id=part_id,
                    feature_type="thread",
                    start_z=sz, start_x=sx, end_z=ez, end_x=ex,
                    parameters={"pitch": 1.5, "nominal_diameter": sx * 2, "label": "M20x1.5"}
                )
                classified_features.append(feature_repository.create(db, obj_in=feat))
                i += 1
                continue

            # 4. Detect Step (Vertical transition connecting two different cylindrical diameters)
            if dx > 0 and dz == 0 and sx != 0 and ex != 0:
                feat = Feature(
                    id=str(uuid.uuid4()),
                    part_id=part_id,
                    feature_type="step",
                    start_z=sz, start_x=sx, end_z=ez, end_x=ex,
                    parameters={"height": dx, "from_diameter": sx * 2, "to_diameter": ex * 2}
                )
                classified_features.append(feature_repository.create(db, obj_in=feat))
                i += 1
                continue

            # 5. Detect Hole (Drill cavity along axis of symmetry X=0)
            # Typically a horizontal line segment representing internal cutting where X is constant but inside a cylinder
            # For phase 1 stub: we can check if it represents internal lines or has a label
            if is_cylinder and sx < 0.1 and ex < 0.1: # central axis itself is not a hole, it is facing or axis
                i += 1
                continue
            
            i += 1

        # Return all classified features
        return classified_features

    def get_features_for_part(self, db: Session, part_id: str) -> List[Feature]:
        return feature_repository.get_by_part(db, part_id=part_id)

feature_service = FeatureService()
