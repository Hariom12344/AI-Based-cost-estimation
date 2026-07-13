import React from 'react';
import { Feature } from '../types/part';
import { Layers, ChevronRight } from 'lucide-react';

interface FeaturesListProps {
  features: Feature[];
  selectedFeatureId: string | null;
  onSelectFeatureId: (id: string | null) => void;
}

export const FeaturesList: React.FC<FeaturesListProps> = ({
  features,
  selectedFeatureId,
  onSelectFeatureId
}) => {
  const getFeatureIcon = () => {
    return Layers;
  };

  const getFeatureLabel = (type: string) => {
    switch (type) {
      case 'chamfer': return 'Chamfer Cut';
      case 'groove': return 'Groove Recess';
      case 'thread': return 'External Thread';
      case 'step': return 'Diameter Step';
      case 'radius': return 'Fillet/Radius';
      case 'hole': return 'Bored Hole';
      default: return 'Machined Feature';
    }
  };

  const getFeatureBadgeColor = (type: string) => {
    switch (type) {
      case 'chamfer': return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
      case 'groove': return 'text-orange-400 border-orange-500/20 bg-orange-500/5';
      case 'thread': return 'text-blue-400 border-blue-500/20 bg-blue-500/5';
      case 'step': return 'text-fuchsia-400 border-fuchsia-500/20 bg-fuchsia-500/5';
      default: return 'text-brand-cyan border-brand-cyan/20 bg-brand-cyan/5';
    }
  };

  return (
    <div className="space-y-4 max-h-[350px] md:max-h-[480px] overflow-y-auto pr-2">
      {features.length === 0 ? (
        <div className="text-center py-8 text-brand-gray text-xs border border-dashed border-brand-border rounded-xl">
          No classified features detected. Ingest a blueprint drawing.
        </div>
      ) : (
        features.map((f, idx) => {
          const isSelected = selectedFeatureId === f.id;
          const Icon = getFeatureIcon();
          
          return (
            <div
              key={f.id}
              onClick={() => onSelectFeatureId(isSelected ? null : f.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'border-brand-cyan bg-brand-cyan/15 shadow-md shadow-cyan-500/5 scale-[1.01]'
                  : 'border-brand-border bg-white/[0.01] hover:border-brand-cyan/40 hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg border ${getFeatureBadgeColor(f.feature_type)}`}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="space-y-1">
                  <h4 className="font-semibold text-xs text-white">
                    {idx + 1}. {getFeatureLabel(f.feature_type)}
                  </h4>
                  <p className="text-[10px] text-brand-gray">
                    Z: {f.start_z} to {f.end_z} mm | Ø: {f.start_x * 2} to {f.end_x * 2} mm
                  </p>
                  
                  {f.parameters && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Object.entries(f.parameters).map(([key, val]) => (
                        <span key={key} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-brand-border text-brand-gray capitalize">
                          {key.replace('_', ' ')}: {val}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <ChevronRight className={`w-4 h-4 transition-all ${
                isSelected ? 'text-brand-cyan rotate-90' : 'text-brand-gray/40'
              }`} />
            </div>
          );
        })
      )}
    </div>
  );
};
export default FeaturesList;
