import React, { useState } from 'react';
import { ManufacturingPlan } from '../types/part';
import { 
  Wrench, Copy, Check, Download, 
  AlertTriangle, ShieldAlert, CheckCircle2 
} from 'lucide-react';

interface ProcessPlanConsoleProps {
  plan: ManufacturingPlan;
}

export const ProcessPlanConsole: React.FC<ProcessPlanConsoleProps> = ({ plan }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'sequence' | 'gcode' | 'verification'>('sequence');

  const handleCopyGCode = () => {
    if (!plan.gcode_program) return;
    navigator.clipboard.writeText(plan.gcode_program);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadGCode = () => {
    if (!plan.gcode_program) return;
    const blob = new Blob([plan.gcode_program], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `program_1001.nc`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const getOpBadgeColor = (type: string) => {
    switch (type) {
      case 'facing': return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      case 'rough_turning': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'finish_turning': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'grooving': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case 'threading': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      default: return 'bg-white/5 text-brand-gray border border-white/5';
    }
  };

  const score = plan.verification_results?.confidence_score ?? 100;
  const getScoreColor = (s: number) => {
    if (s >= 90) return 'text-emerald-400 ring-emerald-500/20';
    if (s >= 60) return 'text-amber-400 ring-amber-500/20';
    return 'text-red-400 ring-red-500/20';
  };

  const totalTimeSeconds = plan.operations.reduce((acc, op) => acc + (op.estimated_time || 0), 0);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-brand-border bg-white/[0.01]">
          <span className="text-[10px] text-brand-gray uppercase tracking-wider block mb-1">Target Material</span>
          <span className="text-sm font-semibold text-white">{plan.material}</span>
        </div>
        <div className="p-4 rounded-xl border border-brand-border bg-white/[0.01]">
          <span className="text-[10px] text-brand-gray uppercase tracking-wider block mb-1">Selected Machine</span>
          <span className="text-sm font-semibold text-white">{plan.machine_tool}</span>
        </div>
        <div className="p-4 rounded-xl border border-brand-border bg-white/[0.01]">
          <span className="text-[10px] text-brand-gray uppercase tracking-wider block mb-1">Est. Cycle Time</span>
          <span className="text-sm font-semibold text-brand-cyan">{formatTime(totalTimeSeconds)}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-border">
        <button
          onClick={() => setActiveTab('sequence')}
          className={`pb-3 text-xs font-semibold px-4 transition-all border-b-2 ${
            activeTab === 'sequence'
              ? 'text-brand-cyan border-brand-cyan'
              : 'text-brand-gray border-transparent hover:text-white'
          }`}
        >
          Machining Sequence
        </button>
        <button
          onClick={() => setActiveTab('gcode')}
          className={`pb-3 text-xs font-semibold px-4 transition-all border-b-2 ${
            activeTab === 'gcode'
              ? 'text-brand-cyan border-brand-cyan'
              : 'text-brand-gray border-transparent hover:text-white'
          }`}
        >
          Generated G/M Code
        </button>
        <button
          onClick={() => setActiveTab('verification')}
          className={`pb-3 text-xs font-semibold px-4 transition-all border-b-2 ${
            activeTab === 'verification'
              ? 'text-brand-cyan border-brand-cyan'
              : 'text-brand-gray border-transparent hover:text-white'
          }`}
        >
          Safety Verification
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'sequence' && (
        <div className="space-y-4 max-h-[300px] md:max-h-[400px] overflow-y-auto pr-2">
          {plan.operations.map((op) => (
            <div key={op.sequence} className="p-4 rounded-xl border border-brand-border bg-white/[0.01] flex flex-col md:flex-row justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-5 h-5 rounded bg-brand-cyan/10 text-brand-cyan text-[10px] font-bold flex items-center justify-center border border-brand-cyan/20">
                    {op.sequence}
                  </span>
                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${getOpBadgeColor(op.operation)}`}>
                    {op.operation.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] font-medium text-white flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5 text-brand-cyan" />
                    {op.tool_code} ({op.tool_name})
                  </span>
                </div>
                <p className="text-xs text-brand-gray">{op.description}</p>
              </div>

              <div className="flex gap-4 text-[10px] text-brand-gray border-t md:border-t-0 md:border-l border-brand-border pt-2 md:pt-0 md:pl-4 justify-between md:justify-end flex-shrink-0">
                {op.cutting_speed > 0 && (
                  <>
                    <div className="text-center min-w-[45px]">
                      <span className="block text-[8px] uppercase tracking-wider text-brand-gray/60">Speed</span>
                      <span className="font-semibold text-white">{op.cutting_speed} <span className="text-[8px]">m/m</span></span>
                    </div>
                    <div className="text-center min-w-[45px]">
                      <span className="block text-[8px] uppercase tracking-wider text-brand-gray/60">Feed</span>
                      <span className="font-semibold text-white">{op.feed_rate} <span className="text-[8px]">mm/r</span></span>
                    </div>
                    <div className="text-center min-w-[45px]">
                      <span className="block text-[8px] uppercase tracking-wider text-brand-gray/60">RPM</span>
                      <span className="font-semibold text-brand-cyan">{op.rpm}</span>
                    </div>
                  </>
                )}
                <div className="text-center min-w-[45px]">
                  <span className="block text-[8px] uppercase tracking-wider text-brand-gray/60">Time</span>
                  <span className="font-semibold text-brand-cyan">{op.estimated_time || 0}s</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'gcode' && (
        <div className="space-y-3">
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCopyGCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-brand-border text-xs text-brand-gray hover:text-white transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={handleDownloadGCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20 text-xs text-brand-cyan hover:bg-brand-cyan/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download .NC
            </button>
          </div>
          
          <pre className="p-4 rounded-xl bg-black/40 border border-brand-border overflow-auto max-h-[300px] md:max-h-[400px] text-[11px] font-mono text-emerald-400 leading-relaxed shadow-inner">
            {plan.gcode_program || '; No G/M Code compiled'}
          </pre>
        </div>
      )}

      {activeTab === 'verification' && plan.verification_results && (
        <div className="space-y-6">
          {/* Dial and Explanation */}
          <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-xl border border-brand-border bg-white/[0.01]">
            {/* Score Ring */}
            <div className={`w-20 h-20 rounded-full ring-4 flex flex-col items-center justify-center flex-shrink-0 ${getScoreColor(score)}`}>
              <span className="text-xl font-black">{score}%</span>
              <span className="text-[8px] uppercase tracking-wider font-bold">Confidence</span>
            </div>
            
            <div className="space-y-1">
              <h4 className="font-semibold text-xs text-white">Expert System Safety Telemetry</h4>
              <p className="text-xs text-brand-gray leading-relaxed">{plan.verification_results.explanation}</p>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-cyan">Rule Checklist</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {plan.verification_results.checks.map((c, i) => (
                <div key={i} className="p-3 rounded-lg border border-brand-border bg-black/20 flex items-center justify-between text-xs">
                  <span className="text-brand-gray font-medium">{c.name}</span>
                  {c.passed ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Passed
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1 font-bold">
                      <AlertTriangle className="w-4 h-4 animate-bounce" /> Warning
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Warnings List */}
          {plan.verification_results.warnings.length > 0 && (
            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs space-y-1">
              <h5 className="font-bold flex items-center gap-1.5 mb-1"><AlertTriangle className="w-4 h-4" /> System warnings</h5>
              <ul className="list-disc list-inside space-y-1 text-brand-gray text-[11px]">
                {plan.verification_results.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          {/* Errors List */}
          {plan.verification_results.errors.length > 0 && (
            <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs space-y-1">
              <h5 className="font-bold flex items-center gap-1.5 mb-1"><ShieldAlert className="w-4 h-4" /> Safety Violation Alerts</h5>
              <ul className="list-disc list-inside space-y-1 text-brand-gray text-[11px]">
                {plan.verification_results.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default ProcessPlanConsole;
