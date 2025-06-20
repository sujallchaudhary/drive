'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Header } from './layout/header';
import { Sidebar } from './layout/sidebar';
import { FileList } from './files/file-list';
import { FileUpload } from './files/file-upload';
import { FilePreview } from './files/file-preview';
import { SearchBar } from './ui/search-bar';
import { FileFilter, FileMetadata, UploadProgress } from '@/types';
import { toast } from 'sonner';

export function Dashboard() {
  const { data: session, status } = useSession();
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FileFilter>('all');
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch files from API
  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/files');
      
      if (!response.ok) {
        if (response.status === 401) {
          signOut();
          return;
        }
        throw new Error('Failed to fetch files');
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and search files
  useEffect(() => {
    let result = files;

    // Apply filter
    if (activeFilter !== 'all') {
      const typeMap: Record<FileFilter, string[]> = {
        all: [],
        images: ['image'],
        videos: ['video'],
        pdfs: ['pdf'],
        docs: ['document'],
      };
      
      const allowedTypes = typeMap[activeFilter];
      result = result.filter(file => allowedTypes.includes(file.fileType));
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(file => 
        file.name.toLowerCase().includes(query) ||
        file.originalName.toLowerCase().includes(query) ||
        (file.description && file.description.toLowerCase().includes(query)) ||
        (file.tags && file.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    setFilteredFiles(result);
  }, [files, activeFilter, searchQuery]);

  // Load files on component mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchFiles();
    }
  }, [status]);

  // Handle file upload
  const handleFileUpload = async (uploadedFiles: File[]) => {
    const newUploadProgress: UploadProgress[] = uploadedFiles.map((file, index) => ({
      fileId: `temp-${Date.now()}-${index}`,
      fileName: file.name,
      progress: 0,
      status: 'uploading',
    }));

    setUploadProgress(prev => [...prev, ...newUploadProgress]);

    try {
      const uploadPromises = uploadedFiles.map(async (file, index) => {
        const formData = new FormData();
        formData.append('file', file);

        const progressId = `temp-${Date.now()}-${index}`;

        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          const result = await response.json();

          // Update progress to completed
          setUploadProgress(prev => 
            prev.map(p => 
              p.fileId === progressId 
                ? { ...p, progress: 100, status: 'completed' }
                : p
            )
          );

          return result.file;
        } catch (error) {
          // Update progress to error
          setUploadProgress(prev => 
            prev.map(p => 
              p.fileId === progressId 
                ? { ...p, status: 'error', error: 'Upload failed' }
                : p
            )
          );
          
          throw error;
        }
      });

      await Promise.all(uploadPromises);
      
      // Refresh file list
      await fetchFiles();
      
      toast.success(`${uploadedFiles.length} file(s) uploaded successfully!`);
      
      // Clear upload progress after a delay
      setTimeout(() => {
        setUploadProgress([]);
      }, 3000);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Some files failed to upload');
    }
  };

  // Handle file delete
  const handleFileDelete = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      setFiles(prev => prev.filter(f => f._id !== fileId));
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        fileStats={{
          total: files.length,
          images: files.filter(f => f.fileType === 'image').length,
          videos: files.filter(f => f.fileType === 'video').length,
          pdfs: files.filter(f => f.fileType === 'pdf').length,
          docs: files.filter(f => f.fileType === 'document').length,
        }}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          user={session?.user}
          onMenuClick={() => setSidebarOpen(true)}
          onSignOut={() => signOut()}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-foreground mb-2">
                  My Drive
                </h1>
                <p className="text-muted-foreground">
                  {filteredFiles.length} of {files.length} files
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-4">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search files..."
                />
                <FileUpload onUpload={handleFileUpload} />
              </div>
            </div>

            {/* Upload Progress */}
            {uploadProgress.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Uploading Files</h3>
                <div className="space-y-2">
                  {uploadProgress.map((progress) => (
                    <div key={progress.fileId} className="bg-card p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium truncate">
                          {progress.fileName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {progress.status === 'completed' ? 'Completed' : 
                           progress.status === 'error' ? 'Failed' : 
                           `${progress.progress}%`}
                        </span>
                      </div>
                      {progress.status === 'uploading' && (
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress.progress}%` }}
                          />
                        </div>
                      )}
                      {progress.status === 'error' && (
                        <p className="text-xs text-destructive">{progress.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <FileList
              files={filteredFiles}
              isLoading={isLoading}
              onFileSelect={setSelectedFile}
              onFileDelete={handleFileDelete}
              searchQuery={searchQuery}
            />
          </div>
        </main>
      </div>

      {selectedFile && (
        <FilePreview
          file={selectedFile}
          isOpen={!!selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
}
