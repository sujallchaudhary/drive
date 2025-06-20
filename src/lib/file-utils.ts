import { FileMetadata, FileFilter } from '@/types';

/**
 * Determine file type category based on MIME type
 */
export function getFileType(mimeType: string): 'image' | 'video' | 'pdf' | 'document' | 'other' {
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  
  if (mimeType.startsWith('video/')) {
    return 'video';
  }
  
  if (mimeType === 'application/pdf') {
    return 'pdf';
  }
  
  // Document types
  const documentTypes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/rtf',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation',
  ];
  
  if (documentTypes.includes(mimeType)) {
    return 'document';
  }
  
  return 'other';
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format date in relative format
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  // For older dates, show the actual date
  return date.toLocaleDateString();
}

/**
 * Filter files based on category
 */
export function filterFilesByType(files: FileMetadata[], filter: FileFilter): FileMetadata[] {
  if (filter === 'all') {
    return files;
  }
  
  if (filter === 'starred') {
    return files.filter(file => file.isStarred);
  }
  
  if (filter === 'recent') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return files.filter(file => new Date(file.uploadedAt) >= sevenDaysAgo);
  }
  
  if (filter === 'trash') {
    return files.filter(file => file.isDeleted);
  }
  
  const typeMap: Record<string, string[]> = {
    images: ['image'],
    videos: ['video'],
    pdfs: ['pdf'],
    docs: ['document'],
  };
  
  const allowedTypes = typeMap[filter];
  if (!allowedTypes) {
    return files;
  }
  
  return files.filter(file => allowedTypes.includes(file.fileType));
}

/**
 * Search files by name and description
 */
export function searchFiles(files: FileMetadata[], query: string): FileMetadata[] {
  if (!query.trim()) {
    return files;
  }
  
  const searchTerm = query.toLowerCase();
  
  return files.filter(file => 
    file.name.toLowerCase().includes(searchTerm) ||
    file.originalName.toLowerCase().includes(searchTerm) ||
    (file.description && file.description.toLowerCase().includes(searchTerm)) ||
    (file.tags && file.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
  );
}

/**
 * Get file icon based on file type
 */
export function getFileIcon(fileType: string): string {
  const iconMap: Record<string, string> = {
    image: '🖼️',
    video: '🎥',
    pdf: '📄',
    document: '📄',
    other: '📁',
  };
  
  return iconMap[fileType] || iconMap.other;
}

/**
 * Check if file type can be previewed
 */
export function canPreviewFile(fileType: string, mimeType: string): boolean {
  // Images can be previewed
  if (fileType === 'image') {
    return true;
  }
  
  // Videos can be previewed
  if (fileType === 'video') {
    return true;
  }
  
  // PDFs can be previewed
  if (fileType === 'pdf') {
    return true;
  }
  
  // Some document types can be previewed
  const previewableDocTypes = [
    'text/plain',
    'text/csv',
    'application/json',
  ];
  
  return previewableDocTypes.includes(mimeType);
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove or replace unsafe characters
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Generate a unique filename
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
  
  return `${sanitizeFilename(nameWithoutExt)}_${timestamp}_${random}.${extension}`;
}
