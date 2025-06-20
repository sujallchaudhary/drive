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
  isStarred: boolean;
  tags?: string[];
  description?: string;
  sharedWith?: string[];
  isPublic?: boolean;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  password: string;
  avatar?: string;
  storageLimit: number;
  storageUsed: number;
  starredFiles: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type FileFilter = 'all' | 'images' | 'videos' | 'pdfs' | 'docs' | 'starred' | 'recent' | 'trash';

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
