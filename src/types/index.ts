export interface FileMetadata {
  _id: string;
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  fileType: 'image' | 'video' | 'pdf' | 'document' | 'other';
  blobUrl: string;
  blobName: string;
  userId: string;
  uploadedAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  tags?: string[];
  description?: string;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  password: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type FileFilter = 'all' | 'images' | 'videos' | 'pdfs' | 'docs';

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error' | 'cancelled';
  error?: string;
}

export interface SearchResult {
  files: FileMetadata[];
  totalCount: number;
  hasMore: boolean;
}
