'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Header } from './layout/header';
import { Sidebar } from './layout/sidebar';
import { FileList } from './files/file-list';
import { FileUploadSecure } from './files/file-upload-secure';
import { YouTubeUpload } from './files/youtube-upload';
import { SearchBar } from './ui/search-bar';
import { FileFilter, FileMetadata } from '@/types';
import { toast } from 'sonner';

export function Dashboard() {
  const { data: session, status } = useSession();  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [trashFiles, setTrashFiles] = useState<FileMetadata[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FileFilter>('all');
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
  // Fetch trash files from API
  const fetchTrashFiles = async () => {
    try {
      const response = await fetch('/api/files/trash');
      
      if (!response.ok) {
        if (response.status === 401) {
          signOut();
          return;
        }
        throw new Error('Failed to fetch trash files');
      }

      const data = await response.json();
      setTrashFiles(data.files || []);
    } catch (error) {
      console.error('Error fetching trash files:', error);
      toast.error('Failed to load trash files');
    }
  };  // Filter and search files
  useEffect(() => {
    let result: FileMetadata[];

    // Use trash files when filter is trash, otherwise use regular files
    if (activeFilter === 'trash') {
      result = trashFiles;
    } else {
      result = files;
      
      // Apply filter for non-trash files
      if (activeFilter !== 'all') {
        if (activeFilter === 'starred') {
          result = result.filter(file => file.isStarred);
        } else if (activeFilter === 'recent') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          result = result.filter(file => new Date(file.uploadedAt) >= sevenDaysAgo);
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
    }    setFilteredFiles(result);
  }, [files, trashFiles, activeFilter, searchQuery]);  // Load files on component mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchFiles();
      fetchTrashFiles();
      fetchStorageInfo();
    }
  }, [status]);  // Handle file upload - now just refreshes the file list since upload is handled in component
  const handleFileUpload = async () => {
    // Just refresh the file list and storage info since upload is already complete
    await fetchFiles();
    await fetchStorageInfo();
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

  // Handle file restore (from trash)
  const handleFileRestore = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/restore`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to restore file');
      }

      toast.success('File restored successfully');
      
      // Refresh both regular files and trash files
      await Promise.all([fetchFiles(), fetchTrashFiles(), fetchStorageInfo()]);
    } catch (error) {
      console.error('Error restoring file:', error);
      toast.error('Failed to restore file');
    }
  };

  // Handle permanent delete
  const handleFilePermanentDelete = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/permanent-delete`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to permanently delete file');
      }

      toast.success('File permanently deleted');
      
      // Refresh trash files and storage info
      await Promise.all([fetchTrashFiles(), fetchStorageInfo()]);
    } catch (error) {
      console.error('Error permanently deleting file:', error);
      toast.error('Failed to permanently delete file');
    }
  };
  // Handle YouTube video upload
  const handleYouTubeUpload = async (youtubeData: {
    type: 'youtube-video' | 'youtube-playlist';
    url: string;
    title: string;
    description?: string;
    thumbnail: string;
    videoId?: string;
    playlistId?: string;
  }) => {
    try {
      const response = await fetch('/api/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(youtubeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add YouTube video');
      }

      const data = await response.json();
      
      // Add the new YouTube video to the files list
      setFiles(prev => [data.file, ...prev]);
      
      toast.success('YouTube video added successfully');
    } catch (error) {
      console.error('Error adding YouTube video:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add YouTube video');
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
          trash: trashFiles.length,
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
                  My Drive - {activeFilter.charAt(0).toUpperCase()+activeFilter.slice(1)}
                </h1>
                <p className="text-muted-foreground">
                  {filteredFiles.length} of {files.length} files
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-4">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search files..."                />
                <div className="flex gap-2">
                  <FileUploadSecure onUpload={handleFileUpload} />
                  <YouTubeUpload onUpload={handleYouTubeUpload} />
                </div>
              </div>
            </div>
            
            <FileList
              files={filteredFiles}
              isLoading={isLoading}
              onFileDelete={handleFileDelete}
              onFileRename={handleFileRename}
              onFileToggleStar={handleFileToggleStar}
              onFileRestore={handleFileRestore}
              onFilePermanentDelete={handleFilePermanentDelete}
              searchQuery={searchQuery}
              showTrashActions={activeFilter === 'trash'}
            />
          </div>        </main>
      </div>
    </div>
  );
}
