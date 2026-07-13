import React, { useState, useEffect } from 'react';
import { AnalysisResult } from '../types/part';
import { BlueprintCanvas } from '../components/BlueprintCanvas';
import { FeaturesList } from '../components/FeaturesList';
import { ProcessPlanConsole } from '../components/ProcessPlanConsole';
import { api } from '../services/api';
import { ArrowLeft, ShieldCheck, FileText } from 'lucide-react';

interface ConsoleWorkspaceProps {
  drawingId: string;
  onBack: () => void;
}

export const ConsoleWorkspace: React.FC<ConsoleWorkspaceProps> = ({ drawingId, onBack }) => {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<'features' | 'plan'>('features');

  const loadAnalysisData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<AnalysisResult>(`/parts/${drawingId}`);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve analysis workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysisData();
  }, [drawingId]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin" />
        <p className="text-brand-gray text-xs tracking-widest font-bold">COMPILING GEOMETRY & RUNNING EXPERT ADVISOR...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-red-400 text-sm font-semibold">{error || 'Workspace data failed to load.'}</div>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-white/5 border border-brand-border text-xs text-white hover:border-brand-cyan transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { part, features, plan } = data;

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-brand-border pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-white/5 border border-brand-border text-brand-gray hover:text-white transition-all hover:scale-105"
            title="Back to drawings list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="space-y-0.5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-cyan" />
              {part.part_name}
            </h2>
            <p className="text-[10px] text-brand-gray uppercase tracking-widest leading-none">
              CAD Vectorized Workspace Console
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Plan Verified
          </div>
        </div>
      </div>

      {/* Main Workspace split panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Visual CAD profile Canvas (Col 1-7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel rounded-2xl p-6 border border-brand-border space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-cyan">2D Axisymmetric Part Outline</h3>
              <span className="text-[10px] text-brand-gray">Click edges on canvas to select features</span>
            </div>
            <div className="w-full aspect-[4/3] max-h-[420px]">
              <BlueprintCanvas
                digitalRepresentation={part.digital_representation}
                features={features}
                selectedFeatureId={selectedFeatureId}
                onSelectFeatureId={(id) => setSelectedFeatureId(id)}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed controls panel (Col 8-12) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-brand-border space-y-4">
            {/* Right panel tabs selector */}
            <div className="flex border-b border-brand-border">
              <button
                onClick={() => setRightTab('features')}
                className={`pb-3 text-xs font-semibold px-4 transition-all border-b-2 ${
                  rightTab === 'features'
                    ? 'text-brand-cyan border-brand-cyan'
                    : 'text-brand-gray border-transparent hover:text-white'
                }`}
              >
                Classified Features ({features.length})
              </button>
              <button
                onClick={() => setRightTab('plan')}
                className={`pb-3 text-xs font-semibold px-4 transition-all border-b-2 ${
                  rightTab === 'plan'
                    ? 'text-brand-cyan border-brand-cyan'
                    : 'text-brand-gray border-transparent hover:text-white'
                }`}
              >
                Machining Planner & G/M Code
              </button>
            </div>

            {/* Tab Contents */}
            {rightTab === 'features' ? (
              <FeaturesList
                features={features}
                selectedFeatureId={selectedFeatureId}
                onSelectFeatureId={(id) => setSelectedFeatureId(id)}
              />
            ) : (
              <ProcessPlanConsole plan={plan} />
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
export default ConsoleWorkspace;
