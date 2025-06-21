'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FileFilter } from '@/types';
import { 
  Files, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  File,
  X,
  HardDrive,
  Trash2,
  Star,
  Clock,
  Upload
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilter: FileFilter;
  onFilterChange: (filter: FileFilter) => void;
  onUpload?: () => void;
  fileStats: {
    total: number;
    images: number;
    videos: number;
    pdfs: number;
    docs: number;
    starred: number;
    recent: number;
    trash: number;
  };
  storageInfo: {
    used: number;
    limit: number;
  };
}

const filterItems = [
  {
    id: 'all' as FileFilter,
    label: 'All Files',
    icon: Files,
    color: 'text-blue-500',
  },
  {
    id: 'images' as FileFilter,
    label: 'Images',
    icon: ImageIcon,
    color: 'text-green-500',
  },
  {
    id: 'videos' as FileFilter,
    label: 'Videos',
    icon: Video,
    color: 'text-purple-500',
  },
  {
    id: 'pdfs' as FileFilter,
    label: 'PDFs',
    icon: FileText,
    color: 'text-red-500',
  },
  {
    id: 'docs' as FileFilter,
    label: 'Documents',
    icon: File,
    color: 'text-orange-500',
  },
];

const quickAccessItems = [
  {
    id: 'starred' as FileFilter,
    label: 'Starred',
    icon: Star,
    color: 'text-yellow-500',
  },
  {
    id: 'recent' as FileFilter,
    label: 'Recent',
    icon: Clock,
    color: 'text-blue-500',
  },
  {
    id: 'trash' as FileFilter,
    label: 'Trash',
    icon: Trash2,
    color: 'text-red-500',
  },
];

export function Sidebar({ 
  isOpen, 
  onClose, 
  activeFilter, 
  onFilterChange, 
  onUpload,
  fileStats,
  storageInfo
}: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleFilterChange = (filter: FileFilter) => {
    onFilterChange(filter);
    // Close sidebar on mobile after selection
    if (isMobile) {
      onClose();
    }
  };const getFileCount = (filter: FileFilter) => {
    switch (filter) {
      case 'all': return fileStats.total;
      case 'images': return fileStats.images;
      case 'videos': return fileStats.videos;
      case 'pdfs': return fileStats.pdfs;
      case 'docs': return fileStats.docs;
      case 'starred': return fileStats.starred;
      case 'recent': return fileStats.recent;
      case 'trash': return fileStats.trash;
      default: return 0;
    }
  };

  const formatStorageSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb < 1 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${gb.toFixed(1)} GB`;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}      {/* Sidebar */}
      <div
        className={cn(
          'sidebar-container fixed left-0 top-0 z-50 h-full w-64 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 lg:z-0 bg-background lg:border-r lg:border-border',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border lg:hidden">
          <h2 className="text-lg font-semibold">Menu</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>        <div className="p-4 space-y-1">
          <div className="mb-6">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Image
                src="/logo.png"
                alt="Sdrive Logo"
                width={120}
                height={40}
                className="object-contain"
              />
            </div>
            
            {/* Upload Button */}
            {onUpload && (
              <div className="mb-4">
                <Button
                  onClick={() => {
                    onUpload();
                    if (isMobile) {
                      onClose();
                    }
                  }}
                  className="w-full justify-start h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Upload className="mr-3 h-4 w-4" />
                  <span className="flex-1 text-left">Upload Files</span>
                </Button>
              </div>
            )}
            <h3 className="mb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Browse Files
            </h3>
            <nav className="space-y-1">
              {filterItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeFilter === item.id;
                const count = getFileCount(item.id);

                return (                  <Button
                    key={item.id}
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start h-10 px-4',
                      isActive && 'bg-secondary/80'
                    )}
                    onClick={() => handleFilterChange(item.id)}
                  >
                    <Icon className={cn('mr-3 h-4 w-4', item.color)} />
                    <span className="flex-1 text-left">{item.label}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {count}
                    </span>
                  </Button>
                );
              })}
            </nav>
          </div>          <div className="border-t border-border pt-4">
            <h3 className="mb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Quick Access
            </h3>
            <nav className="space-y-1">
              {quickAccessItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeFilter === item.id;
                const count = getFileCount(item.id);

                return (                  <Button
                    key={item.id}
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start h-10 px-4',
                      isActive && 'bg-secondary text-secondary-foreground'
                    )}
                    onClick={() => handleFilterChange(item.id)}
                  >
                    <Icon className={cn('mr-3 h-4 w-4', item.color)} />
                    <span className="flex-1 text-left">{item.label}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {count}
                    </span>
                  </Button>
                );
              })}            </nav>
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="mb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Storage
            </h3>
            <div className="px-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <HardDrive className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Storage</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {fileStats.total} files
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${Math.round((storageInfo.used / storageInfo.limit) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatStorageSize(storageInfo.used)} of {formatStorageSize(storageInfo.limit)} used
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
