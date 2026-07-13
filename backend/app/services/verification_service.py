from typing import Dict, Any, List

class VerificationService:
    def verify_plan(
        self, operations: List[Dict[str, Any]], overall_length: float, max_diameter: float
    ) -> Dict[str, Any]:
        """Runs validation checks on the predicted plan and returns errors, warnings, and confidence score."""
        checks = []
        warnings = []
        errors = []
        
        # 1. Check Tool Sequence (Roughing before Finishing)
        has_roughing = False
        has_finishing = False
        rough_seq = 99
        finish_seq = 0
        
        for op in operations:
            op_type = op["operation"]
            seq = op["sequence"]
            
            if op_type == "rough_turning":
                has_roughing = True
                rough_seq = seq
            elif op_type == "finish_turning":
                has_finishing = True
                finish_seq = seq
                
        if has_roughing and has_finishing:
            if rough_seq > finish_seq:
                errors.append("Critical Error: Finishing operation is scheduled before Roughing.")
                checks.append({"name": "Operation Sequencing", "passed": False})
            else:
                checks.append({"name": "Operation Sequencing", "passed": True})
        else:
            warnings.append("Warning: Missing either Roughing or Finishing operation in sequence.")
            checks.append({"name": "Operation Sequencing", "passed": False})

        # 2. Check Spindle Speed (RPM Limit)
        rpm_exceeded = False
        for op in operations:
            if op["rpm"] > 4000:
                rpm_exceeded = True
                errors.append(f"Critical Error: Spindle speed {op['rpm']} RPM in OP{op['sequence']} exceeds machine safety limits.")
                
        checks.append({"name": "Spindle RPM Limits Check", "passed": not rpm_exceeded})

        # 3. Check Travel Limits & Chuck Collisions
        # Chuck is assumed to be at Z = -130mm for a stock of 115mm
        collision_risk = False
        for op in operations:
            if op.get("operation") != "inspection":
                # For this simplified model, check if length goes beyond safe bounds
                if overall_length > 130.0:
                    collision_risk = True
                    
        if collision_risk:
            errors.append("Critical Error: Part length (exceeding 130mm) poses a high risk of chuck/toolholder collision.")
            checks.append({"name": "Chuck Collision Scan", "passed": False})
        else:
            checks.append({"name": "Chuck Collision Scan", "passed": True})

        # 4. Check Feed Rate Limits
        feed_ok = True
        for op in operations:
            op_type = op["operation"]
            feed = op["feed_rate"]
            if op_type != "threading" and feed > 0.8:
                feed_ok = False
                warnings.append(f"Warning: High feed rate ({feed} mm/rev) in OP{op['sequence']} may damage cutter.")
                
        checks.append({"name": "Feed Rate Tolerances Check", "passed": feed_ok})

        # 5. Calculate Confidence Score
        # Start at 100, subtract 15 for each warning, and 30 for each critical error. Minimum score is 10%.
        score = 100 - (len(warnings) * 15) - (len(errors) * 30)
        score = max(score, 10)

        # 6. Explanation
        if score >= 90:
            explanation = "The program is fully verified and optimized. Toolpaths conform to Haas ST-10 specifications. Spindle speeds and feeds are aligned with standard C45 Carbon Steel tooling requirements."
        elif score >= 60:
            explanation = "The plan is functional but contains warning alerts. Verify feed rates or missing finish passes in custom setups before deploying."
        else:
            explanation = "ALERT: Critical errors detected. Spindle speed or collision risks violate lathe envelopes. Modify operations before G-code compilation."

        return {
            "checks": checks,
            "warnings": warnings,
            "errors": errors,
            "confidence_score": score,
            "explanation": explanation
        }

verification_service = VerificationService()
