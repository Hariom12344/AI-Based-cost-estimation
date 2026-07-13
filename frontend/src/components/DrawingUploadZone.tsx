import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { Drawing } from '../types/drawing';
import { api } from '../services/api';

interface DrawingUploadZoneProps {
  onUploadSuccess: (drawing: Drawing) => void;
}

const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'pdf', 'dxf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const DrawingUploadZone: React.FC<DrawingUploadZoneProps> = ({ onUploadSuccess }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setError(null);
    setSuccessMsg(null);

    // 1. Verify Extension
    const ext = file.name.split('.').pop() || '';
    const cleanExt = ext.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(cleanExt)) {
      setError(`Unsupported file format. Please upload DXF, PDF, PNG, or JPG.`);
      return;
    }

    // 2. Verify Size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File is too large. Maximum allowed size is 10MB.`);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = api.getAccessToken();
      const response = await fetch('/api/v1/drawings/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        let errMsg = 'Failed to upload file';
        try {
          const errData = await response.json();
          errMsg = errData.detail || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const uploadedDrawing: Drawing = await response.json();
      setSuccessMsg(`"${file.name}" uploaded successfully!`);
      onUploadSuccess(uploadedDrawing);
    } catch (err: any) {
      setError(err.message || 'An error occurred during file upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Zone container */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`glass-panel rounded-2xl p-8 border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] text-center ${
          isDragActive
            ? 'border-brand-cyan bg-brand-cyan/5 scale-[1.01] shadow-lg shadow-cyan-500/10'
            : 'border-brand-border hover:border-brand-cyan/40 hover:bg-white/[0.01]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept=".dxf,.pdf,.png,.jpg,.jpeg"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-brand-cyan font-semibold tracking-wider animate-pulse">
              STREAMING FILE TO STORAGE...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 rounded-full bg-white/5 border border-brand-border text-brand-gray group-hover:text-white transition-colors">
              <Upload className="w-8 h-8 text-brand-cyan" />
            </div>
            <div>
              <p className="text-white font-semibold text-base mb-1">
                Drag & drop your drawing file here
              </p>
              <p className="text-brand-gray text-xs">
                or <span className="text-brand-cyan hover:underline font-medium">browse local files</span>
              </p>
            </div>
            
            <div className="flex gap-2 mt-4 text-[10px] uppercase font-bold text-brand-gray tracking-wider">
              <span className="px-2 py-0.5 rounded bg-white/5 border border-brand-border">DXF</span>
              <span className="px-2 py-0.5 rounded bg-white/5 border border-brand-border">PDF</span>
              <span className="px-2 py-0.5 rounded bg-white/5 border border-brand-border">PNG</span>
              <span className="px-2 py-0.5 rounded bg-white/5 border border-brand-border">JPG</span>
            </div>
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl text-xs border bg-red-500/10 border-red-500/20 text-red-400 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl text-xs border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
};
export default DrawingUploadZone;
