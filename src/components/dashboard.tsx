'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Header } from './layout/header';
import { Sidebar } from './layout/sidebar';
import { FileList } from './files/file-list';
import { FileUpload } from './files/file-upload';
import { SearchBar } from './ui/search-bar';
import { FileFilter, FileMetadata, UploadProgress } from '@/types';
import { toast } from 'sonner';

export function Dashboard() {
  const { data: session, status } = useSession();
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FileFilter>('all');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    limit: 5 * 1024 * 1024 * 1024 // 5GB default
  });
  // Fetch storage info
  const fetchStorageInfo = async () => {
    try {
      const response = await fetch('/api/user/storage');
      if (response.ok) {
        const data = await response.json();
        setStorageInfo({
          used: data.storageUsed,
          limit: data.storageLimit
        });
      }
    } catch (error) {
      console.error('Error fetching storage info:', error);
    }
  };

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
      if (activeFilter === 'starred') {
        result = result.filter(file => file.isStarred);
      } else if (activeFilter === 'recent') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        result = result.filter(file => new Date(file.uploadedAt) >= sevenDaysAgo);
      } else if (activeFilter === 'trash') {
        result = result.filter(file => file.isDeleted);
      } else {
        const typeMap: Record<string, string[]> = {
          images: ['image'],
          videos: ['video'],
          pdfs: ['pdf'],
          docs: ['document'],
        };
        
        const allowedTypes = typeMap[activeFilter];
        if (allowedTypes) {
          result = result.filter(file => allowedTypes.includes(file.fileType));
        }
      }
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
      fetchStorageInfo();
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
        // Refresh file list and storage info
      await fetchFiles();
      await fetchStorageInfo();
      
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
      await fetchStorageInfo(); // Refresh storage info
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file');
    }
  };

  // Handle file rename
  const handleFileRename = async (fileId: string, newName: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/rename`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      });      if (!response.ok) {
        throw new Error('Failed to rename file');
      }

      setFiles(prev => prev.map(f => f._id === fileId ? { ...f, name: newName } : f));
      toast.success('File renamed successfully');
    } catch (error) {
      console.error('Rename error:', error);
      toast.error('Failed to rename file');
    }
  };

  // Handle file star toggle
  const handleFileToggleStar = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/star`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to toggle star');
      }

      const result = await response.json();
      setFiles(prev => prev.map(f => f._id === fileId ? { ...f, isStarred: result.isStarred } : f));
      toast.success(result.isStarred ? 'File starred' : 'File unstarred');
    } catch (error) {
      console.error('Star toggle error:', error);
      toast.error('Failed to update star status');
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
        onFilterChange={setActiveFilter}        fileStats={{
          total: files.filter(f => !f.isDeleted).length,
          images: files.filter(f => f.fileType === 'image' && !f.isDeleted).length,
          videos: files.filter(f => f.fileType === 'video' && !f.isDeleted).length,
          pdfs: files.filter(f => f.fileType === 'pdf' && !f.isDeleted).length,
          docs: files.filter(f => f.fileType === 'document' && !f.isDeleted).length,
          starred: files.filter(f => f.isStarred && !f.isDeleted).length,
          recent: files.filter(f => {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return new Date(f.uploadedAt) >= sevenDaysAgo && !f.isDeleted;
          }).length,
          trash: files.filter(f => f.isDeleted).length,
        }}
        storageInfo={storageInfo}
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
            )}            <FileList
              files={filteredFiles}
              isLoading={isLoading}
              onFileDelete={handleFileDelete}
              onFileRename={handleFileRename}
              onFileToggleStar={handleFileToggleStar}
              searchQuery={searchQuery}
            />
          </div>        </main>
      </div>
    </div>
  );
}
