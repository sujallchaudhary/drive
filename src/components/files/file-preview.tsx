'use client';

import { FileMetadata } from '@/types';
import { formatFileSize, formatRelativeDate } from '@/lib/file-utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  X, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  File as FileIcon,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface FilePreviewProps {
  file: FileMetadata;
  isOpen: boolean;
  onClose: () => void;
}

export function FilePreview({ file, isOpen, onClose }: FilePreviewProps) {
  const handleDownload = async () => {
    try {
      const link = document.createElement('a');
      link.href = file.blobUrl;
      link.download = file.originalName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);      toast.success('Download started');
    } catch {
      toast.error('Failed to download file');
    }
  };

  const handleOpenInNewTab = () => {
    window.open(file.blobUrl, '_blank');
  };

  const renderPreview = () => {
    switch (file.fileType) {
      case 'image':
        return (
          <div className="flex items-center justify-center bg-muted rounded-lg p-4">
            <Image
              src={file.blobUrl}
              alt={file.name}
              className="max-w-full max-h-96 object-contain rounded-lg"
            />
          </div>
        );

      case 'video':
        return (
          <div className="flex items-center justify-center bg-muted rounded-lg p-4">
            <video
              controls
              className="max-w-full max-h-96 rounded-lg"
              preload="metadata"
            >
              <source src={file.blobUrl} type={file.mimeType} />
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case 'pdf':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-center bg-muted rounded-lg p-8">
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto text-red-500 mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  PDF Preview
                </p>
                <Button onClick={handleOpenInNewTab} variant="outline">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in new tab
                </Button>
              </div>
            </div>
            <iframe
              src={`${file.blobUrl}#toolbar=0`}
              className="w-full h-96 border rounded-lg"
              title={file.name}
            />
          </div>
        );

      case 'document':
        return (
          <div className="flex items-center justify-center bg-muted rounded-lg p-8">
            <div className="text-center">
              <FileIcon className="h-16 w-16 mx-auto text-orange-500 mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Document preview not available
              </p>
              <div className="space-x-2">
                <Button onClick={handleDownload} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button onClick={handleOpenInNewTab} variant="outline">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in new tab
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center bg-muted rounded-lg p-8">
            <div className="text-center">
              <FileIcon className="h-16 w-16 mx-auto text-gray-500 mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Preview not available for this file type
              </p>
              <div className="space-x-2">
                <Button onClick={handleDownload} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button onClick={handleOpenInNewTab} variant="outline">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in new tab
                </Button>
              </div>
            </div>
          </div>
        );
    }
  };

  const getFileTypeIcon = () => {
    switch (file.fileType) {
      case 'image':
        return <ImageIcon className="h-4 w-4 text-green-500" />;
      case 'video':
        return <Video className="h-4 w-4 text-purple-500" />;
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'document':
        return <FileIcon className="h-4 w-4 text-orange-500" />;
      default:
        return <FileIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              {getFileTypeIcon()}
              <DialogTitle className="truncate">{file.name}</DialogTitle>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Type
              </p>
              <div className="flex items-center space-x-1 mt-1">
                {getFileTypeIcon()}
                <Badge variant="secondary" className="text-xs">
                  {file.fileType}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Size
              </p>
              <p className="text-sm font-medium mt-1">
                {formatFileSize(file.size)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Uploaded
              </p>
              <p className="text-sm font-medium mt-1">
                {formatRelativeDate(new Date(file.uploadedAt))}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                MIME Type
              </p>
              <p className="text-sm font-medium mt-1 truncate">
                {file.mimeType}
              </p>
            </div>
          </div>

          {/* File Preview */}
          <div>
            {renderPreview()}
          </div>

          {/* Additional Info */}
          {(file.description || file.tags?.length) && (
            <div className="space-y-3">
              {file.description && (
                <div>
                  <p className="text-sm font-medium mb-2">Description</p>
                  <p className="text-sm text-muted-foreground">
                    {file.description}
                  </p>
                </div>
              )}
              {file.tags && file.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {file.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
