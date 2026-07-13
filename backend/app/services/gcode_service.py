from typing import List, Dict, Any

class GCodeService:
    @staticmethod
    def _format_axis(value: Any) -> str:
        return f"{float(value):.3f}".rstrip("0").rstrip(".")

    def _emit_geometry_trace(self, gcode: List[str], geometry_segments: List[Dict[str, Any]]) -> None:
        if not geometry_segments:
            return

        gcode.append("(GEOMETRY TRACE FROM GIVEN SKETCH / DIAGRAM)")
        first_segment = geometry_segments[0]
        start = first_segment.get("start", {})
        start_x = self._format_axis(start.get("x", 0.0))
        start_z = self._format_axis(start.get("z", 0.0))
        gcode.append(f"G00 X{start_x} Z{start_z} (MOVE TO SKETCH START)")

        for segment in geometry_segments:
            end = segment.get("end", {})
            end_x = self._format_axis(end.get("x", 0.0))
            end_z = self._format_axis(end.get("z", 0.0))
            seg_type = segment.get("type", "line")

            if seg_type == "arc_cw":
                gcode.append(f"G01 X{end_x} Z{end_z} (ARC CW APPROXIMATED FROM SKETCH)")
            elif seg_type == "arc_ccw":
                gcode.append(f"G01 X{end_x} Z{end_z} (ARC CCW APPROXIMATED FROM SKETCH)")
            else:
                gcode.append(f"G01 X{end_x} Z{end_z} (SKETCH SEGMENT {segment.get('sequence', '?')})")

    def generate_gcode(
        self, plan_operations: List[Dict[str, Any]], geometry_segments: List[Dict[str, Any]]
    ) -> str:
        """Translates operations list and drawing geometry into combined G/M-code program blocks."""
        gcode = []
        
        # 1. Program Header
        gcode.append("%")
        gcode.append("O1001 (INTELLICAM AI GENERATED PROGRAM)")
        gcode.append("G21 G18 G90 G99 (METRIC, ZX PLANE, ABSOLUTE, FEED/REV)")
        gcode.append("G50 S2500 (CLAMP MAX SPINDLE RPM)")
        gcode.append("")

        # 1b. Sketch-driven contour trace from the analyzed drawing
        self._emit_geometry_trace(gcode, geometry_segments)
        gcode.append("")

        # 2. Iterate through prediction operations
        for op in plan_operations:
            seq = op["sequence"]
            op_type = op["operation"]
            tool_code = op["tool_code"]
            rpm = op["rpm"]
            feed = op["feed_rate"]
            coolant = op["coolant"]
            desc = op["description"]

            # Tool change block
            gcode.append(f"(OP{seq}: {op_type.upper()} - {desc})")
            gcode.append(f"T0{seq}0{seq} (SELECT TOOL {tool_code})")
            
            if rpm > 0:
                gcode.append(f"G97 S{rpm} M03 (CONST SURFACE SPEED OFF, START SPINDLE)")
            
            if coolant:
                gcode.append("M08 (COOLANT ON)")

            # Generate specific motion patterns
            if op_type == "facing":
                # Facing block (G72 canned or manual segments)
                gcode.append("G00 X55.0 Z2.0 (RAPID POSITION ABOVE STOCK)")
                gcode.append(f"G01 X-1.0 F{feed} (FACE TO CENTERLINE)")
                gcode.append("G00 Z5.0 (RETRACT Z)")
                
            elif op_type == "rough_turning":
                # Roughing Canned Cycle (G71)
                gcode.append("G00 X52.0 Z2.0 (POSITION OUTSIDE STOCK)")
                gcode.append("G71 U2.0 R1.0 (2mm DEPTH OF CUT, 1mm RETRACT)")
                gcode.append(f"G71 P10 Q20 U0.5 W0.1 F{feed} (ROUGH CYCLE P10 TO Q20)")
                
                # Profile outline block (Z progresses from 0 to negative)
                gcode.append("N10 G00 X16.0 (START PROFILE DEFINITION)")
                gcode.append("G01 Z0.0")
                gcode.append("G01 X20.0 Z-2.0 (CHAMFER)")
                gcode.append("G01 Z-30.0 (CYLINDER)")
                gcode.append("G01 X30.0")
                gcode.append("G01 Z-70.0 (STEP 2)")
                gcode.append("G01 X50.0")
                gcode.append("N20 G01 Z-115.0 (END OF PROFILE DEFINITION)")
                
            elif op_type == "finish_turning":
                # Finishing Cycle (G70)
                gcode.append("G00 X55.0 Z5.0")
                gcode.append(f"G70 P10 Q20 F{feed} (RUN FINISH CYCLE PATH)")
                gcode.append("G00 X100.0 Z100.0 (RETRACT TO SAFE PLACE)")
                
            elif op_type == "grooving":
                # Grooving plunge cycles
                gcode.append("G00 X22.0 Z-30.0 (POSITION AT GROOVE FACE)")
                gcode.append(f"G01 X16.0 F{feed} (PLUNGE CUT)")
                gcode.append("G04 U1.0 (DWELL 1 SEC TO CLEAR BOTTOM)")
                gcode.append("G01 X22.0 (RETRACT)")
                
            elif op_type == "threading":
                # Threading canned cycle (G76)
                # Cut diameter 20, pitch 1.5, length 28
                gcode.append("G00 X22.0 Z5.0 (POSITION FOR THREAD ENTRY)")
                gcode.append("G76 P010060 Q0.1 R0.02 (P: 1 SPRING CUT, 60 DEGREE TOOL ANGLE)")
                gcode.append(f"G76 X18.16 Z-28.0 P0.92 Q0.15 F{feed} (G76 CANNED CYCLE RUN)")
                
            elif op_type == "inspection":
                gcode.append("M05 (STOP SPINDLE)")
                gcode.append("M09 (COOLANT OFF)")
                gcode.append("M00 (PROGRAM STOP FOR MANUAL INSPECTION)")

            if op_type != "inspection":
                gcode.append("M05 (STOP SPINDLE)")
                gcode.append("M09 (COOLANT OFF)")
                
            gcode.append("")

        # 3. Program End Footer
        gcode.append("M30 (PROGRAM END)")
        gcode.append("%")
        
        return "\n".join(gcode)

gcode_service = GCodeService()
