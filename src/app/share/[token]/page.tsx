'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Eye, FileText, Image as ImageIcon, Video, File as FileIcon } from 'lucide-react';
import { formatFileSize, formatRelativeDate } from '@/lib/file-utils';
import { toast } from 'sonner';

interface SharedFile {
  _id: string;
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  fileType: 'image' | 'video' | 'pdf' | 'document' | 'other';
  blobUrl: string;
  uploadedAt: string;
  description?: string;
}

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;
  
  const [file, setFile] = useState<SharedFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const response = await fetch(`/api/share/${token}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('File not found or no longer shared');
          } else {
            setError('Failed to load file');
          }
          return;
        }

        const data = await response.json();
        setFile(data.file);
      } catch (error) {
        console.error('Error fetching shared file:', error);
        setError('Failed to load file');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchFile();
    }
  }, [token]);
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <ImageIcon className="h-8 w-8 text-green-500" />;
      case 'video':
        return <Video className="h-8 w-8 text-purple-500" />;
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'document':
        return <FileIcon className="h-8 w-8 text-orange-500" />;
      default:
        return <FileIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  const handleDownload = () => {
    if (!file) return;
    
    const link = document.createElement('a');
    link.href = file.blobUrl;
    link.download = file.originalName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started');
  };

  const handleView = () => {
    if (!file) return;
    window.open(file.blobUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <FileIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">File Not Found</h3>
            <p className="text-muted-foreground">
              {error || 'The file you are looking for does not exist or is no longer shared.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">Shared File</h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {getFileIcon(file.fileType)}
              <div className="flex-1">
                <h2 className="text-xl font-semibold truncate">{file.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(file.size)} • Shared {formatRelativeDate(new Date(file.uploadedAt))}
                </p>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {file.description && (
              <div>
                <h3 className="text-sm font-medium mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{file.description}</p>
              </div>
            )}            {/* File Preview */}
            {file.fileType === 'image' && (
              <div className="rounded-lg border overflow-hidden relative h-96">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={file.blobUrl} 
                  alt={file.name}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {file.fileType === 'video' && (
              <div className="rounded-lg border overflow-hidden">
                <video 
                  src={file.blobUrl} 
                  controls
                  className="w-full max-h-96"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button onClick={handleView} className="flex-1">
                <Eye className="mr-2 h-4 w-4" />
                View File
              </Button>
              <Button onClick={handleDownload} variant="outline" className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              <p>This file was shared using Drive Clone</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
