import uuid
import math
from typing import List, Dict, Any
from app.models.plan import ManufacturingPlan
from app.models.feature import Feature
from app.repositories.plan_repository import plan_repository
from sqlalchemy.orm import Session

class IntelService:
    def generate_plan(
        self, db: Session, part_id: str, max_diameter: float, overall_length: float, features: List[Feature]
    ) -> ManufacturingPlan:
        """Heuristically selects machine, tools, sequences cuts, and calculates feeds & speeds."""
        # 1. Decide Material
        material = "C45 Carbon Steel"

        # 2. Select Machine Tool
        if max_diameter <= 200.0 and overall_length <= 400.0:
            machine_tool = "Haas ST-10 CNC Lathe"
            max_rpm = 3000
        else:
            machine_tool = "DMG Mori NLX 2500 Lathe"
            max_rpm = 4000

        # 3. Compile Sequence of Operations
        operations = []
        seq = 1

        # A. Facing Operation
        d_facing = max_diameter
        vc_facing = 160.0  # cutting speed m/min
        rpm_facing = min(int((1000 * vc_facing) / (math.pi * d_facing)), max_rpm)
        est_facing = max(round((d_facing / 2) / (0.15 * rpm_facing) * 60, 1), 5.0) if rpm_facing > 0 else 5.0
        operations.append({
            "sequence": seq,
            "operation": "facing",
            "description": "Face end of stock to establish Z0 reference plane",
            "tool_code": "MWLNR 2020K08",
            "tool_name": "Facing & Turning Tool (CNMG Insert)",
            "cutting_speed": vc_facing,
            "feed_rate": 0.15,
            "depth_of_cut": 1.0,
            "rpm": rpm_facing,
            "coolant": True,
            "estimated_time": est_facing
        })
        seq += 1

        # B. Rough Turning Operation
        d_roughing = max_diameter
        vc_roughing = 180.0
        rpm_roughing = min(int((1000 * vc_roughing) / (math.pi * d_roughing)), max_rpm)
        est_roughing = max(round((overall_length * 0.7 * 2) / (0.25 * rpm_roughing) * 60, 1), 20.0) if rpm_roughing > 0 else 20.0
        operations.append({
            "sequence": seq,
            "operation": "rough_turning",
            "description": f"Rough turn steps to establish profile boundary leaving 0.5mm allowance",
            "tool_code": "MCLNR 2525M12",
            "tool_name": "External Roughing Tool (CNMG Insert)",
            "cutting_speed": vc_roughing,
            "feed_rate": 0.25,
            "depth_of_cut": 2.0,
            "rpm": rpm_roughing,
            "coolant": True,
            "estimated_time": est_roughing
        })
        seq += 1

        # C. Finish Turning Operation
        d_finishing = max_diameter
        vc_finishing = 220.0
        rpm_finishing = min(int((1000 * vc_finishing) / (math.pi * d_finishing)), max_rpm)
        est_finishing = max(round(overall_length / (0.10 * rpm_finishing) * 60, 1), 15.0) if rpm_finishing > 0 else 15.0
        operations.append({
            "sequence": seq,
            "operation": "finish_turning",
            "description": "Finish turn profile boundary to final specifications and surface quality",
            "tool_code": "SVJCR 2020K16",
            "tool_name": "External Finishing Tool (VCMT Insert)",
            "cutting_speed": vc_finishing,
            "feed_rate": 0.1,
            "depth_of_cut": 0.5,
            "rpm": rpm_finishing,
            "coolant": True,
            "estimated_time": est_finishing
        })
        seq += 1

        # D. Check if Grooving is needed
        grooves = [f for f in features if f.feature_type == "groove"]
        for g in grooves:
            d_groove = g.parameters.get("bottom_diameter", max_diameter) if g.parameters else max_diameter
            vc_groove = 100.0
            rpm_groove = min(int((1000 * vc_groove) / (math.pi * d_groove)), max_rpm)
            operations.append({
                "sequence": seq,
                "operation": "grooving",
                "description": f"Plunge cut groove at Z={g.start_z} to bottom diameter {d_groove}mm",
                "tool_code": "LF123G13-2020B",
                "tool_name": "Grooving & Parting Blade (2mm insert width)",
                "cutting_speed": vc_groove,
                "feed_rate": 0.08,
                "depth_of_cut": 1.5,
                "rpm": rpm_groove,
                "coolant": True,
                "estimated_time": 3.0
            })
            seq += 1

        # E. Check if Threading is needed
        threads = [f for f in features if f.feature_type == "thread"]
        for t in threads:
            d_thread = t.parameters.get("nominal_diameter", max_diameter) if t.parameters else max_diameter
            pitch = t.parameters.get("pitch", 1.5) if t.parameters else 1.5
            vc_thread = 90.0
            rpm_thread = min(int((1000 * vc_thread) / (math.pi * d_thread)), max_rpm)
            est_thread = max(round((28 * 8) / (pitch * rpm_thread) * 60, 1), 8.0) if rpm_thread > 0 else 8.0
            operations.append({
                "sequence": seq,
                "operation": "threading",
                "description": f"Cut thread {t.parameters.get('label', 'M20')} at nominal diameter {d_thread}mm",
                "tool_code": "SER 2020K16",
                "tool_name": "Threading Toolholder (16ER insert)",
                "cutting_speed": vc_thread,
                "feed_rate": pitch,  # feed rate MUST equal pitch for threading cycles (G76)
                "depth_of_cut": 0.2,
                "rpm": rpm_thread,
                "coolant": True,
                "estimated_time": est_thread
            })
            seq += 1

        # F. Inspection Operation
        operations.append({
            "sequence": seq,
            "operation": "inspection",
            "description": "Verify step dimensions, threads, and surface finishes using micrometers",
            "tool_code": "INSP-CALIPER",
            "tool_name": "Vernier Caliper & Thread Ring Gauges",
            "cutting_speed": 0.0,
            "feed_rate": 0.0,
            "depth_of_cut": 0.0,
            "rpm": 0,
            "coolant": False,
            "estimated_time": 15.0
        })

        new_plan = ManufacturingPlan(
            id=str(uuid.uuid4()),
            part_id=part_id,
            material=material,
            machine_tool=machine_tool,
            operations=operations,
            gcode_program=None,
            verification_results=None
        )
        return plan_repository.create(db, obj_in=new_plan)

    def get_plan_for_part(self, db: Session, part_id: str) -> ManufacturingPlan:
        return plan_repository.get_by_part(db, part_id=part_id)

intel_service = IntelService()
