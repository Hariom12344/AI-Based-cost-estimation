import io
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.config import settings
from app.services.cv_service import cv_service
from app.services.feature_service import feature_service
from app.services.intel_service import intel_service
from app.services.gcode_service import gcode_service
from app.services.verification_service import verification_service

def get_auth_headers(client: TestClient, user_credentials: dict) -> dict:
    response = client.post(
        f"{settings.API_V1_STR}/auth/token",
        data={
            "username": user_credentials["username"],
            "password": user_credentials["password"]
        }
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_cv_fallback_geometry() -> None:
    # Verify that CV fallback generator builds valid segments list
    geom = cv_service._generate_fallback_geometry()
    assert len(geom) > 5
    assert geom[0]["type"] == "line"
    assert geom[0]["start"]["z"] == 0.0
    assert geom[0]["start"]["x"] == 0.0

def test_feature_classification(db: Session) -> None:
    # 1. Arrange mock geometries
    mock_cv_data = {
        "max_diameter": 50.0,
        "overall_length": 115.0,
        "geometry": cv_service._generate_fallback_geometry()
    }
    
    # 2. Act
    features = feature_service.classify_features(db, part_id="test-part", digital_representation=mock_cv_data)
    
    # 3. Assert
    # Fallback geometry contains chamfers, grooves, steps, and threads
    types = [f.feature_type for f in features]
    assert "chamfer" in types
    assert "groove" in types
    assert "step" in types
    assert "thread" in types

def test_machining_plan_generation(db: Session) -> None:
    # Arrange mock features
    mock_cv_data = {
        "max_diameter": 50.0,
        "overall_length": 115.0,
        "geometry": cv_service._generate_fallback_geometry()
    }
    features = feature_service.classify_features(db, part_id="test-part", digital_representation=mock_cv_data)
    
    # Act
    plan = intel_service.generate_plan(db, part_id="test-part", max_diameter=50.0, overall_length=115.0, features=features)
    
    # Assert
    assert plan.material == "C45 Carbon Steel"
    assert plan.machine_tool == "Haas ST-10 CNC Lathe"
    
    # Verify operation sequencing contains Facing -> Roughing -> Finishing -> Grooving -> Threading -> Inspection
    ops = [op["operation"] for op in plan.operations]
    assert "facing" in ops
    assert "rough_turning" in ops
    assert "finish_turning" in ops
    assert "grooving" in ops
    assert "threading" in ops
    assert "inspection" in ops

def test_gcode_compilation() -> None:
    mock_ops = [
        {"sequence": 1, "operation": "facing", "tool_code": "MWLNR", "rpm": 1200, "feed_rate": 0.15, "coolant": True, "description": "Face"},
        {"sequence": 2, "operation": "rough_turning", "tool_code": "MCLNR", "rpm": 1000, "feed_rate": 0.25, "coolant": True, "description": "Rough"}
    ]
    mock_geom = [
        {"sequence": 1, "type": "line", "start": {"z": 0.0, "x": 0.0}, "end": {"z": 0.0, "x": 10.0}, "text": None},
        {"sequence": 2, "type": "line", "start": {"z": 0.0, "x": 10.0}, "end": {"z": -5.0, "x": 10.0}, "text": None}
    ]
    
    gcode = gcode_service.generate_gcode(mock_ops, mock_geom)
    assert "%" in gcode
    assert "O1001" in gcode
    assert "T0101" in gcode
    assert "M03" in gcode
    assert "M08" in gcode
    assert "M05" in gcode
    assert "M30" in gcode
    assert "GEOMETRY TRACE FROM GIVEN SKETCH / DIAGRAM" in gcode
    assert "G01 X10 Z0" in gcode

def test_verification_engine() -> None:
    mock_ops_valid = [
        {"sequence": 1, "operation": "rough_turning", "rpm": 1000, "feed_rate": 0.25, "coolant": True},
        {"sequence": 2, "operation": "finish_turning", "rpm": 1200, "feed_rate": 0.1, "coolant": True}
    ]
    res_valid = verification_service.verify_plan(mock_ops_valid, overall_length=100.0, max_diameter=50.0)
    assert res_valid["confidence_score"] == 100
    
    # Check out-of-order warning
    mock_ops_invalid = [
        {"sequence": 1, "operation": "finish_turning", "rpm": 1200, "feed_rate": 0.1, "coolant": True},
        {"sequence": 2, "operation": "rough_turning", "rpm": 1000, "feed_rate": 0.25, "coolant": True}
    ]
    res_invalid = verification_service.verify_plan(mock_ops_invalid, overall_length=100.0, max_diameter=50.0)
    assert res_invalid["confidence_score"] < 100
    assert len(res_invalid["errors"]) > 0

def test_live_analysis_endpoint(client: TestClient, normal_user) -> None:
    headers = get_auth_headers(client, normal_user)
    
    # 1. Upload DXF drawing
    file_payload = {"file": ("shaft.dxf", io.BytesIO(b"SECTION\nHEADER\nENDSEC\nEOF"), "application/octet-stream")}
    upload_res = client.post(f"{settings.API_V1_STR}/drawings/upload", headers=headers, files=file_payload)
    drawing_id = upload_res.json()["id"]
    
    # 2. Trigger CAM Analysis
    analysis_res = client.post(f"{settings.API_V1_STR}/parts/{drawing_id}/analyze", headers=headers)
    assert analysis_res.status_code == 200
    
    data = analysis_res.json()
    assert data["drawing_id"] == drawing_id
    assert data["status"] == "completed"
    assert "part" in data
    assert "features" in data
    assert "plan" in data
    assert len(data["features"]) > 0
    assert len(data["plan"]["operations"]) > 0
    assert "G71" in data["plan"]["gcode_program"]
    assert data["plan"]["verification_results"]["confidence_score"] == 100
