import React, { useEffect, useRef } from 'react';
import { DigitalRepresentation, Feature } from '../types/part';

interface BlueprintCanvasProps {
  digitalRepresentation: DigitalRepresentation;
  features: Feature[];
  selectedFeatureId: string | null;
  onSelectFeatureId: (id: string | null) => void;
}

export const BlueprintCanvas: React.FC<BlueprintCanvasProps> = ({
  digitalRepresentation,
  features,
  selectedFeatureId,
  onSelectFeatureId
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { geometry, overall_length, max_diameter } = digitalRepresentation;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear Canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0a0b0d';
    ctx.fillRect(0, 0, width, height);

    // Drawing Parameters
    const paddingZ = 40; // right padding
    const paddingX = 40;
    
    // Scale factor: map mm to pixels
    const maxZSpan = overall_length > 0 ? overall_length : 120;
    const maxXSpan = max_diameter > 0 ? max_diameter : 60;
    const scaleZ = (width - paddingZ * 2) / maxZSpan;
    const scaleX = (height - paddingX * 2) / maxXSpan;
    const scale = Math.min(scaleZ, scaleX);

    // Centerline is horizontal middle
    const centerY = height / 2;
    // Z0 is on the right
    const startX = width - paddingZ;

    // Coordinate conversion helpers
    // Z is negative (moves left)
    const getPixelZ = (z: number) => startX + z * scale;
    // X is radius, top half is centerY - radius * scale
    const getPixelY = (x: number) => centerY - x * scale;
    const getPixelYMirror = (x: number) => centerY + x * scale;

    // 1. Draw Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    const gridSpacing = 20 * scale;
    for (let x = 0; x < width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Draw Centerline (Axis of symmetry)
    ctx.strokeStyle = '#8a99ad';
    ctx.lineWidth = 1;
    ctx.setLineDash([12, 4, 3, 4]); // long dash-dot pattern
    ctx.beginPath();
    ctx.moveTo(10, centerY);
    ctx.lineTo(width - 10, centerY);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // 3. Highlight Stock outline
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)'; // light red
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(
      getPixelZ(-overall_length),
      centerY - (max_diameter / 2) * scale,
      overall_length * scale,
      max_diameter * scale
    );
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.02)';
    ctx.fillRect(
      getPixelZ(-overall_length),
      centerY - (max_diameter / 2) * scale,
      overall_length * scale,
      max_diameter * scale
    );

    // Helper to identify if a segment belongs to a classified feature
    const getSegmentFeatureColor = (seg: any) => {
      // Find matching feature by coordinates overlap
      const sz = Math.min(seg.start.z, seg.end.z);
      const ez = Math.max(seg.start.z, seg.end.z);
      const sx = Math.min(seg.start.x, seg.end.x);
      const ex = Math.max(seg.start.x, seg.end.x);

      const matchedFeature = features.find(f => {
        const fsz = Math.min(f.start_z, f.end_z);
        const fez = Math.max(f.start_z, f.end_z);
        const fsx = Math.min(f.start_x, f.end_x);
        const fex = Math.max(f.start_x, f.end_x);

        // Check proximity overlap
        const zOverlap = Math.abs(sz - fsz) < 0.1 && Math.abs(ez - fez) < 0.1;
        const xOverlap = Math.abs(sx - fsx) < 0.1 && Math.abs(ex - fex) < 0.1;
        return zOverlap && xOverlap;
      });

      if (matchedFeature) {
        if (selectedFeatureId === matchedFeature.id) {
          return { color: '#00f2fe', width: 4, feat: matchedFeature }; // Selected highlighted glow
        }
        
        switch (matchedFeature.feature_type) {
          case 'chamfer': return { color: '#fbbf24', width: 3, feat: matchedFeature }; // Yellow
          case 'groove': return { color: '#f97316', width: 3, feat: matchedFeature };  // Orange
          case 'thread': return { color: '#3b82f6', width: 3, feat: matchedFeature };  // Blue
          case 'step': return { color: '#d946ef', width: 3, feat: matchedFeature };    // Magenta
          default: return { color: '#22c55e', width: 2.5, feat: matchedFeature };
        }
      }
      
      return { color: '#00f2fe', width: 2, feat: null }; // Default cyan contour
    };

    // 4. Draw Turned Profile (Top & Bottom mirrored halves)
    geometry.forEach(seg => {
      const { color, width: strokeW } = getSegmentFeatureColor(seg);
      
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeW;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Top profile segment
      ctx.beginPath();
      ctx.moveTo(getPixelZ(seg.start.z), getPixelY(seg.start.x));
      ctx.lineTo(getPixelZ(seg.end.z), getPixelY(seg.end.x));
      ctx.stroke();

      // Mirrored bottom profile segment
      ctx.beginPath();
      ctx.moveTo(getPixelZ(seg.start.z), getPixelYMirror(seg.start.x));
      ctx.lineTo(getPixelZ(seg.end.z), getPixelYMirror(seg.end.x));
      ctx.stroke();
    });

    // 5. Fill shaded cross-section area to make it look solid
    ctx.fillStyle = 'rgba(0, 242, 254, 0.02)';
    ctx.beginPath();
    
    // Walk top path
    if (geometry.length > 0) {
      ctx.moveTo(getPixelZ(geometry[0].start.z), getPixelY(geometry[0].start.x));
      geometry.forEach(seg => {
        ctx.lineTo(getPixelZ(seg.end.z), getPixelY(seg.end.x));
      });
      // Walk bottom path in reverse
      for (let j = geometry.length - 1; j >= 0; j--) {
        const seg = geometry[j];
        ctx.lineTo(getPixelZ(seg.end.z), getPixelYMirror(seg.end.x));
      }
      ctx.lineTo(getPixelZ(geometry[0].start.z), getPixelYMirror(geometry[0].start.x));
      ctx.closePath();
      ctx.fill();
    }

  }, [digitalRepresentation, features, selectedFeatureId]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const paddingZ = 40;
    const centerY = rect.height / 2;
    const startX = rect.width - paddingZ;

    const scaleZ = (rect.width - paddingZ * 2) / overall_length;
    const scaleX = (rect.height - 40 * 2) / max_diameter;
    const scale = Math.min(scaleZ, scaleX);

    // Search closest feature
    let closestFeatureId: string | null = null;
    let minDistance = 15; // click sensitivity in pixels

    features.forEach(f => {
      // Midpoint coordinates of feature
      const midZ = (f.start_z + f.end_z) / 2;
      const midX = (f.start_x + f.end_x) / 2;

      // Top half pixel coordinates
      const pixelZ = startX + midZ * scale;
      const pixelY = centerY - midX * scale;

      // Bottom half pixel coordinates
      const pixelYMirror = centerY + midX * scale;

      const distTop = Math.hypot(clickX - pixelZ, clickY - pixelY);
      const distBottom = Math.hypot(clickX - pixelZ, clickY - pixelYMirror);

      const closestDist = Math.min(distTop, distBottom);

      if (closestDist < minDistance) {
        minDistance = closestDist;
        closestFeatureId = f.id;
      }
    });

    onSelectFeatureId(closestFeatureId);
  };

  return (
    <div className="w-full h-full relative group">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full min-h-[300px] md:min-h-[400px] rounded-2xl border border-brand-border cursor-pointer shadow-inner shadow-black/50"
      />
      <div className="absolute bottom-4 left-4 flex gap-3 text-[10px] uppercase font-bold text-brand-gray tracking-wider bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg border border-brand-border pointer-events-none">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-cyan" /> Contour</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Chamfer</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Groove</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Thread</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500" /> Step</span>
      </div>
    </div>
  );
};
export default BlueprintCanvas;
