export type DrawingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type DrawingExtension = 'png' | 'jpg' | 'jpeg' | 'pdf' | 'dxf';

export interface Drawing {
  id: string;
  original_filename: string;
  file_type: DrawingExtension;
  status: DrawingStatus;
  created_at: string;
  updated_at: string;
}
