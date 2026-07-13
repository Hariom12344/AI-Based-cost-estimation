import React, { useState, useEffect } from 'react';
import { Drawing } from '../types/drawing';
import { DrawingUploadZone } from '../components/DrawingUploadZone';
import { ConsoleWorkspace } from './ConsoleWorkspace';
import { api } from '../services/api';
import { 
  FileText, Download, Trash2, CheckCircle2, AlertTriangle, 
  Clock, Cpu, ExternalLink
} from 'lucide-react';

export const DrawingsDashboard: React.FC = () => {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const fetchDrawings = async () => {
    try {
      setLoading(true);
      const data = await api.get<Drawing[]>('/drawings/');
      setDrawings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve drawings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrawings();
  }, []);

  const handleUploadSuccess = (newDrawing: Drawing) => {
    setDrawings((prev) => [newDrawing, ...prev]);
  };

  const handleRunAnalysis = async (drawingId: string) => {
    setAnalyzingId(drawingId);
    try {
      await api.post(`/parts/${drawingId}/analyze`);
      // Immediately navigate to the workspace console upon success
      setSelectedDrawingId(drawingId);
    } catch (err: any) {
      alert(err.message || 'Analysis failed. Ensure CAD/drawing details are valid.');
      fetchDrawings(); // Reload to update status to Failed
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleDownload = async (drawing: Drawing) => {
    try {
      const token = api.getAccessToken();
      const response = await fetch(`/api/v1/drawings/${drawing.id}/file`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('File download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', drawing.original_filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to download drawing.');
    }
  };

  const handleDelete = async (drawingId: string) => {
    if (!confirm('Are you sure you want to delete this drawing? This cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/drawings/${drawingId}`);
      setDrawings((prev) => prev.filter((d) => d.id !== drawingId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete drawing.');
    }
  };

  const getStatusBadge = (status: string, dId: string) => {
    if (analyzingId === dId) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 animate-pulse">
          <Clock className="w-3.5 h-3.5 animate-spin" />
          Analyzing...
        </span>
      );
    }

    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            Pending CV
          </span>
        );
    }
  };

  // Switch to planning console overlay if drawing is selected
  if (selectedDrawingId) {
    return <ConsoleWorkspace drawingId={selectedDrawingId} onBack={() => { setSelectedDrawingId(null); fetchDrawings(); }} />;
  }

  const blockedModules = [
    { id: 3, name: 'Computer Vision Parser', desc: 'Preprocess drawings, find outlines & extract dimensions.', active: true },
    { id: 4, name: 'Feature Classifier', desc: 'Auto-identify CNC turned elements like steps, grooves, threads.', active: true },
    { id: 5, name: 'Manufacturing Intelligence', desc: 'Automatically map cutting speed, tool inserts, and lathe plans.', active: true }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="glass-panel rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-brand-cyan/5 blur-[80px] pointer-events-none" />
        
        <div className="space-y-2 text-center md:text-left z-10">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Manufacturing Drawing Console
          </h2>
          <p className="text-brand-gray text-sm max-w-xl">
            Upload engineering blueprints in vector (DXF) or raster (PDF, PNG, JPG) formats.
            IntelliCAM AI will map geometry files to compile sequence plans.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="px-4 py-3 rounded-2xl bg-white/5 border border-brand-border text-center min-w-[100px]">
            <span className="text-[10px] text-brand-gray uppercase tracking-wider block">UPLOADS</span>
            <span className="text-lg font-bold text-brand-cyan">{drawings.length} FILES</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Container - Col 1 & 2 */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-brand-border space-y-4">
            <h3 className="text-base font-bold uppercase tracking-wider text-brand-cyan">Ingest Drawing Blueprint</h3>
            <DrawingUploadZone onUploadSuccess={handleUploadSuccess} />
          </div>

          {/* Drawings Table list */}
          <div className="glass-panel rounded-2xl p-6 border border-brand-border space-y-4">
            <h3 className="text-base font-bold uppercase tracking-wider text-brand-cyan">Loaded Blueprints</h3>
            
            {loading && drawings.length === 0 ? (
              <div className="text-center py-8 text-brand-gray animate-pulse">Querying drawings from DB...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-400 text-xs">{error}</div>
            ) : drawings.length === 0 ? (
              <div className="text-center py-12 text-brand-gray text-xs border border-dashed border-brand-border rounded-xl">
                No drawing files have been uploaded yet. Ingest a blueprint to begin.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-brand-border text-brand-gray uppercase font-semibold">
                      <th className="pb-3 pl-2">Drawing Name</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Ingested On</th>
                      <th className="pb-3">AI Status</th>
                      <th className="pb-3 pr-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drawings.map((d) => (
                      <tr key={d.id} className="border-b border-brand-border/40 hover:bg-white/[0.01] transition-all">
                        <td className="py-4 pl-2 font-medium text-white flex items-center gap-2 max-w-[180px] truncate">
                          <FileText className="w-4 h-4 text-brand-cyan flex-shrink-0" />
                          <span title={d.original_filename}>{d.original_filename}</span>
                        </td>
                        <td className="py-4 font-semibold uppercase text-brand-gray">{d.file_type}</td>
                        <td className="py-4 text-brand-gray">
                          {new Date(d.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4">{getStatusBadge(d.status, d.id)}</td>
                        <td className="py-4 pr-2 text-right space-x-2">
                          {/* Toggle analysis / view buttons */}
                          {d.status === 'completed' ? (
                            <button
                              onClick={() => setSelectedDrawingId(d.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 hover:bg-emerald-500/20 transition-all font-semibold"
                              title="Open workspace console"
                            >
                              <ExternalLink className="w-3 h-3" /> View Plan
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRunAnalysis(d.id)}
                              disabled={analyzingId !== null}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20 text-[10px] text-brand-cyan hover:bg-brand-cyan/20 transition-all font-semibold disabled:opacity-50"
                              title="Run CV Edge extraction & tool sequencing"
                            >
                              <Cpu className="w-3 h-3" /> Run AI Plan
                            </button>
                          )}

                          <button
                            onClick={() => handleDownload(d)}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg bg-white/5 border border-brand-border text-brand-gray hover:text-white hover:border-brand-cyan transition-all"
                            title="Download raw file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(d.id)}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                            title="Delete blueprint"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Roadmap - Col 3 */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-brand-border space-y-6">
            <div>
              <h3 className="text-base font-bold uppercase tracking-wider text-brand-cyan">Functional Engines</h3>
              <p className="text-[11px] text-brand-gray">Modules 1 to 10 are now active and fully operational.</p>
            </div>
            
            <div className="space-y-4">
              {blockedModules.map((m) => (
                <div key={m.id} className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02] space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase">
                      Module {m.id}
                    </span>
                    <span className="text-[9px] font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Operational
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm text-white/95">{m.name}</h4>
                    <p className="text-[11px] text-brand-gray leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DrawingsDashboard;
