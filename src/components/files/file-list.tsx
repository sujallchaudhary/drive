'use client';

import { useState } from 'react';
import { FileMetadata } from '@/types';
import { formatFileSize, formatRelativeDate, getFileIcon } from '@/lib/file-utils';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MoreHorizontal, 
  Download, 
  Trash2, 
  Eye, 
  Share,
  Star,
  Edit3,
  Grid,
  List,
  Image as ImageIcon,
  Video,
  FileText,
  File
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface FileListProps {
  files: FileMetadata[];
  isLoading: boolean;
  onFileSelect: (file: FileMetadata) => void;
  onFileDelete: (fileId: string) => void;
  searchQuery: string;
}

type ViewMode = 'table' | 'grid';

export function FileList({ 
  files, 
  isLoading, 
  onFileSelect, 
  onFileDelete, 
  searchQuery 
}: FileListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <ImageIcon className="h-4 w-4 text-green-500" />;
      case 'video':
        return <Video className="h-4 w-4 text-purple-500" />;
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'document':
        return <File className="h-4 w-4 text-orange-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleDownload = async (file: FileMetadata) => {
    try {
      const link = document.createElement('a');
      link.href = file.blobUrl;
      link.download = file.originalName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');    } catch {
      toast.error('Failed to download file');
    }
  };

  const handleDelete = (file: FileMetadata) => {
    if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
      onFileDelete(file._id);
    }
  };

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">
          {part}
        </mark>
      ) : part
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="h-16 bg-muted rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <File className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          {searchQuery ? 'No files found' : 'No files uploaded yet'}
        </h3>
        <p className="text-muted-foreground">
          {searchQuery 
            ? `No files match your search for "${searchQuery}"`
            : 'Upload your first file to get started'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex justify-end">
        <div className="flex rounded-lg border border-border p-1">
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-8 w-8 p-0"
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* File List */}
      {viewMode === 'table' ? (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">Size</TableHead>
                <TableHead className="hidden lg:table-cell">Modified</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow 
                  key={file._id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onFileSelect(file)}
                >
                  <TableCell className="flex items-center space-x-3">
                    {getFileTypeIcon(file.fileType)}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {highlightSearchTerm(file.name, searchQuery)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate sm:hidden">
                        {formatFileSize(file.size)} • {formatRelativeDate(new Date(file.uploadedAt))}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="capitalize text-sm text-muted-foreground">
                      {file.fileType}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {formatRelativeDate(new Date(file.uploadedAt))}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onFileSelect(file);
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(file);
                        }}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled>
                          <Star className="mr-2 h-4 w-4" />
                          Add to starred
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>
                          <Share className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>
                          <Edit3 className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(file);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {files.map((file) => (
            <Card 
              key={file._id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onFileSelect(file)}
            >
              <CardContent className="p-4">
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-3">
                  {file.fileType === 'image' ? (
                    <Image
                      src={file.blobUrl}
                      alt={file.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-4xl">
                      {getFileIcon(file.fileType)}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-medium truncate text-sm">
                    {highlightSearchTerm(file.name, searchQuery)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeDate(new Date(file.uploadedAt))}
                  </p>
                </div>
                <div className="flex justify-end mt-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onFileSelect(file);
                      }}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(file);
                      }}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
