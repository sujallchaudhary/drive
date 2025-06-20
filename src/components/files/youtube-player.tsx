'use client';

import Image from 'next/image';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, ExternalLink, X } from 'lucide-react';

interface YouTubePlayerProps {
  videoId?: string;
  playlistId?: string;
  title: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface YouTubeEmbedProps {
  videoId?: string;
  playlistId?: string;
  title: string;
  className?: string;
}

export function YouTubeEmbed({ videoId, playlistId, title, className = '' }: YouTubeEmbedProps) {
  const getEmbedUrl = () => {
    const baseUrl = 'https://www.youtube.com/embed';
    const params = new URLSearchParams({
      autoplay: '0',
      rel: '0',
      modestbranding: '1',
      fs: '1',
      cc_load_policy: '0',
      iv_load_policy: '3',
      autohide: '0',
    });

    if (videoId) {
      return `${baseUrl}/${videoId}?${params.toString()}`;
    } else if (playlistId) {
      params.set('listType', 'playlist');
      params.set('list', playlistId);
      return `${baseUrl}?${params.toString()}`;
    }
    
    return '';
  };

  const embedUrl = getEmbedUrl();

  if (!embedUrl) {
    return (
      <div className={`bg-muted rounded-lg flex items-center justify-center p-8 ${className}`}>
        <p className="text-muted-foreground">Invalid YouTube URL</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <iframe
        src={embedUrl}
        title={title}
        className="w-full h-full rounded-lg"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

export function YouTubePlayer({ videoId, playlistId, title, isOpen, onOpenChange }: YouTubePlayerProps) {
  const getWatchUrl = () => {
    if (videoId) {
      return `https://www.youtube.com/watch?v=${videoId}`;
    } else if (playlistId) {
      return `https://www.youtube.com/playlist?list=${playlistId}`;
    }
    return '';
  };

  const openInYouTube = () => {
    const url = getWatchUrl();
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-red-500" />
              {title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={openInYouTube}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in YouTube
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="px-6 pb-6">
          <YouTubeEmbed
            videoId={videoId}
            playlistId={playlistId}
            title={title}
            className="aspect-video w-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Thumbnail component for file lists
export function YouTubeThumbnail({ 
  videoId, 
  playlistId, 
  title, 
  onClick,
  thumbnail
}: {
  videoId?: string;
  playlistId?: string;
  title: string;
  onClick: () => void;
  thumbnail?: string;
}) {
  const getThumbnailUrl = () => {
    // Use provided thumbnail first
    if (thumbnail) {
      return thumbnail;
    }
    
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    // Default playlist thumbnail
    return 'https://img.youtube.com/vi/default/maxresdefault.jpg';
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Fallback to medium resolution thumbnail if maxres fails
    const target = e.target as HTMLImageElement;
    if (videoId && target.src.includes('maxresdefault')) {
      target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    } else if (videoId && target.src.includes('hqdefault')) {
      target.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
  };

  return (
    <div 
      className="relative w-full h-full bg-muted rounded-lg overflow-hidden cursor-pointer group"
      onClick={onClick}
    >      <Image
        src={getThumbnailUrl()}
        alt={title}
        height={480}
        width={360}

        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        onError={handleImageError}
      />
      
      {/* Play overlay */}
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
        <div className="bg-red-600 hover:bg-red-700 rounded-full p-3 transform group-hover:scale-110 transition-transform duration-200">
          <Play className="h-6 w-6 text-white fill-white ml-1" />
        </div>
      </div>

      {/* Type indicator */}
      <div className="absolute top-2 right-2">
        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded font-medium">
          {playlistId ? 'PLAYLIST' : 'YOUTUBE'}
        </span>
      </div>
    </div>
  );
}

// Video thumbnail component for preview dialogs and larger displays
export function YouTubeVideoThumbnail({ 
  videoId, 
  playlistId, 
  title, 
  onClick,
  thumbnail,
  className = "aspect-video"
}: {
  videoId?: string;
  playlistId?: string;
  title: string;
  onClick: () => void;
  thumbnail?: string;
  className?: string;
}) {
  const getThumbnailUrl = () => {
    // Use provided thumbnail first
    if (thumbnail) {
      return thumbnail;
    }
    
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    // Default playlist thumbnail
    return 'https://img.youtube.com/vi/default/maxresdefault.jpg';
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Fallback to medium resolution thumbnail if maxres fails
    const target = e.target as HTMLImageElement;
    if (videoId && target.src.includes('maxresdefault')) {
      target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    } else if (videoId && target.src.includes('hqdefault')) {
      target.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
  };

  return (
    <div 
      className={`relative ${className} bg-muted rounded-lg overflow-hidden cursor-pointer group`}
      onClick={onClick}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getThumbnailUrl()}
        alt={title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        onError={handleImageError}
      />
      
      {/* Play overlay */}
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
        <div className="bg-red-600 hover:bg-red-700 rounded-full p-4 transform group-hover:scale-110 transition-transform duration-200">
          <Play className="h-8 w-8 text-white fill-white ml-1" />
        </div>
      </div>

      {/* Type indicator */}
      <div className="absolute top-2 right-2">
        <span className="bg-red-600 text-white text-sm px-3 py-1 rounded font-medium">
          {playlistId ? 'PLAYLIST' : 'YOUTUBE'}
        </span>
      </div>
    </div>
  );
}
