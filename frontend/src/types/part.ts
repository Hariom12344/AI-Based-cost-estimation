
export interface GeometryNode {
  z: number;
  x: number;
}

export interface GeometrySegment {
  sequence: number;
  type: 'line' | 'arc_cw' | 'arc_ccw';
  start: GeometryNode;
  end: GeometryNode;
  text: string | null;
}

export interface DigitalRepresentation {
  overall_length: number;
  max_diameter: number;
  geometry: GeometrySegment[];
  ocr_raw?: any[];
}

export interface Part {
  id: string;
  drawing_id: string;
  part_name: string;
  digital_representation: DigitalRepresentation;
  created_at: string;
}

export interface Feature {
  id: string;
  part_id: string;
  feature_type: 'step' | 'groove' | 'thread' | 'chamfer' | 'radius' | 'hole';
  start_z: number;
  start_x: number;
  end_z: number;
  end_x: number;
  parameters?: Record<string, any>;
}

export interface MachiningOperation {
  sequence: number;
  operation: 'facing' | 'rough_turning' | 'finish_turning' | 'grooving' | 'threading' | 'inspection';
  description: string;
  tool_code: string;
  tool_name: string;
  cutting_speed: number;
  feed_rate: number;
  depth_of_cut: number;
  rpm: number;
  coolant: boolean;
  estimated_time: number;
}

export interface VerificationCheck {
  name: string;
  passed: boolean;
}

export interface VerificationResults {
  checks: VerificationCheck[];
  warnings: string[];
  errors: string[];
  confidence_score: number;
  explanation: string;
}

export interface ManufacturingPlan {
  id: string;
  part_id: string;
  material: string;
  machine_tool: string;
  operations: MachiningOperation[];
  gcode_program: string | null;
  verification_results: VerificationResults | null;
  created_at: string;
}

export interface AnalysisResult {
  drawing_id: string;
  status: 'completed' | 'failed';
  part: Part;
  features: Feature[];
  plan: ManufacturingPlan;
}
