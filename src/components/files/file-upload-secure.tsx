'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { formatFileSize } from '@/lib/file-utils';
import { toast } from 'sonner';

interface FileUploadSecureProps {
  onUpload: (files: File[]) => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export function FileUploadSecure({ onUpload }: FileUploadSecureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Check file size limit (2GB per file)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    const validFiles = acceptedFiles.filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum size is 2GB.`);
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 2 * 1024 * 1024 * 1024, // 2GB
  });

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  const uploadFileDirectly = async (file: File): Promise<void> => {
    try {
      // Step 1: Get SAS token for direct upload
      const tokenResponse = await fetch('/api/upload/sas-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        throw new Error(error.error || 'Failed to get upload token');
      }

      const { sasUrl, blobName, containerUrl } = await tokenResponse.json();

      // Step 2: Upload directly to Azure Blob Storage using XMLHttpRequest for better CORS support
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 90); // Reserve 10% for final steps
            setUploadingFiles(prev => prev.map(uf => 
              uf.file === file ? { ...uf, progress } : uf
            ));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.open('PUT', sasUrl);
        xhr.setRequestHeader('x-ms-blob-type', 'BlockBlob');
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      // Step 3: Register the file in our database
      const blobUrl = `${containerUrl}/${blobName}`;
      const registerResponse = await fetch('/api/upload/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          originalName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          blobName,
          blobUrl,
        }),
      });

      if (!registerResponse.ok) {
        const error = await registerResponse.json();
        throw new Error(error.error || 'Failed to register file');
      }

      const result = await registerResponse.json();
      return result.file;

    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setIsUploading(true);
    
    // Initialize uploading files state
    const initUploadingFiles = selectedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }));
    setUploadingFiles(initUploadingFiles);

    const uploadedFiles: File[] = [];
    
    // Upload files one by one to avoid overwhelming the server
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      try {
        // Update status to uploading
        setUploadingFiles(prev => prev.map((uf, index) => 
          index === i ? { ...uf, status: 'uploading', progress: 10 } : uf
        ));

        // Simulate progress updates during upload
        const progressInterval = setInterval(() => {
          setUploadingFiles(prev => prev.map((uf, index) => 
            index === i && uf.progress < 90 
              ? { ...uf, progress: uf.progress + 10 } 
              : uf
          ));
        }, 200);

        await uploadFileDirectly(file);
        
        clearInterval(progressInterval);
        
        // Mark as completed
        setUploadingFiles(prev => prev.map((uf, index) => 
          index === i ? { ...uf, status: 'completed', progress: 100 } : uf
        ));
        
        uploadedFiles.push(file);
        
      } catch (error) {
        // Mark as error
        setUploadingFiles(prev => prev.map((uf, index) => 
          index === i ? { 
            ...uf, 
            status: 'error', 
            progress: 0,
            error: error instanceof Error ? error.message : 'Upload failed'
          } : uf
        ));
        
        toast.error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    setIsUploading(false);
    
    if (uploadedFiles.length > 0) {
      onUpload(uploadedFiles);
      toast.success(`Successfully uploaded ${uploadedFiles.length} file(s)`);
      
      // Reset after successful uploads
      setTimeout(() => {
        setSelectedFiles([]);
        setUploadingFiles([]);
        setIsOpen(false);
      }, 2000);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFiles([]);
      setUploadingFiles([]);
      setIsOpen(false);
    }
  };

  const getStatusIcon = (status: UploadingFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const allCompleted = uploadingFiles.length > 0 && uploadingFiles.every(uf => uf.status === 'completed' || uf.status === 'error');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload Files
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Files are uploaded directly to secure cloud storage. Maximum file size is 2GB.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Dropzone - hide during upload */}
          {!isUploading && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors shrink-0
                ${isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-primary">Drop files here...</p>
              ) : (
                <div>
                  <p className="text-foreground font-medium mb-1">
                    Click to select files or drag and drop
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Secure direct upload. No size limits from server.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Selected Files (before upload) */}
          {!isUploading && selectedFiles.length > 0 && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <h4 className="font-medium mb-2 shrink-0">Selected Files ({selectedFiles.length})</h4>
              <div className="flex-1 overflow-y-auto pr-2 space-y-2 min-h-0">
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <File className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 p-0 shrink-0 ml-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploadingFiles.length > 0 && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <h4 className="font-medium mb-2 shrink-0">
                Upload Progress ({uploadingFiles.filter(uf => uf.status === 'completed').length}/{uploadingFiles.length})
              </h4>
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-0">
                {uploadingFiles.map((uploadingFile, index) => (
                  <div key={`uploading-${index}`} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(uploadingFile.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" title={uploadingFile.file.name}>
                          {uploadingFile.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(uploadingFile.file.size)}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {uploadingFile.status === 'completed' && 'Completed'}
                        {uploadingFile.status === 'uploading' && 'Uploading...'}
                        {uploadingFile.status === 'error' && 'Failed'}
                        {uploadingFile.status === 'pending' && 'Waiting...'}
                      </div>
                    </div>
                    
                    {uploadingFile.status === 'uploading' && (
                      <Progress value={uploadingFile.progress} className="h-2" />
                    )}
                    
                    {uploadingFile.status === 'error' && uploadingFile.error && (
                      <p className="text-xs text-red-500 mt-1">{uploadingFile.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 shrink-0 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isUploading}
            >
              {allCompleted ? 'Close' : 'Cancel'}
            </Button>
            {!isUploading && selectedFiles.length > 0 && (
              <Button 
                onClick={handleUpload} 
                disabled={selectedFiles.length === 0}
              >
                Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
