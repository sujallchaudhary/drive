'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Youtube, Link, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface YouTubeUploadProps {
  onUpload: (youtubeData: YouTubeVideoData) => void;
}

interface YouTubeVideoData {
  type: 'youtube-video' | 'youtube-playlist';
  url: string;
  title: string;
  description?: string;
  thumbnail: string;
  duration?: string;
  videoId?: string;
  playlistId?: string;
}

export function YouTubeUpload({ onUpload }: YouTubeUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState('');
  const [videoData, setVideoData] = useState<YouTubeVideoData | null>(null);

  const extractVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };
  const extractPlaylistId = (url: string): string | null => {
    const regex = /[&?]list=([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };
  const isValidYouTubeUrl = (url: string): boolean => {
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/.test(url) && 
           (extractVideoId(url) !== null || extractPlaylistId(url) !== null);
  };
  const fetchVideoInfo = async (videoId: string): Promise<YouTubeVideoData | null> => {
    try {
      // Use YouTube oEmbed API for basic info
      const response = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch video information');
      }

      const data = await response.json();
      
      return {
        type: 'youtube-video',
        url: `https://www.youtube.com/watch?v=${videoId}`,
        title: data.title,
        description: data.author_name,
        thumbnail: data.thumbnail_url,
        videoId,
      };
    } catch (error) {
      console.error('Error fetching video info:', error);
      return null;
    }
  };

  const fetchPlaylistInfo = async (playlistId: string): Promise<YouTubeVideoData | null> => {
    try {
      // Try to get playlist information by fetching the first video from the playlist
      const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
      
      // Since YouTube doesn't have oEmbed for playlists, we'll use a different approach
      // We'll try to extract basic info from the playlist page
      const response = await fetch(`https://www.youtube.com/oembed?url=${playlistUrl}&format=json`);
      
      if (response.ok) {
        const data = await response.json();
        return {
          type: 'youtube-playlist',
          url: playlistUrl,
          title: data.title || 'YouTube Playlist',
          description: data.author_name || 'YouTube Playlist',
          thumbnail: data.thumbnail_url || 'https://img.youtube.com/vi/default/maxresdefault.jpg',
          playlistId,
        };
      }
      
      // Fallback: Try to get first video from playlist using RSS feed
      const rssResponse = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`);
      
      if (rssResponse.ok) {
        const xmlText = await rssResponse.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        const title = xmlDoc.querySelector('title')?.textContent;
        const firstEntry = xmlDoc.querySelector('entry');
        const firstVideoId = firstEntry?.querySelector('yt\\:videoId, videoId')?.textContent;
        
        return {
          type: 'youtube-playlist',
          url: playlistUrl,
          title: title || 'YouTube Playlist',
          description: 'YouTube Playlist',
          thumbnail: firstVideoId 
            ? `https://img.youtube.com/vi/${firstVideoId}/maxresdefault.jpg`
            : 'https://img.youtube.com/vi/default/maxresdefault.jpg',
          playlistId,
        };
      }
      
      // Ultimate fallback
      return {
        type: 'youtube-playlist',
        url: playlistUrl,
        title: 'YouTube Playlist',
        description: 'YouTube Playlist',
        thumbnail: 'https://img.youtube.com/vi/default/maxresdefault.jpg',
        playlistId,
      };
    } catch (error) {
      console.error('Error fetching playlist info:', error);
      // Return basic playlist info as fallback
      return {
        type: 'youtube-playlist',
        url: `https://www.youtube.com/playlist?list=${playlistId}`,
        title: 'YouTube Playlist',
        description: 'YouTube Playlist',
        thumbnail: 'https://img.youtube.com/vi/default/maxresdefault.jpg',
        playlistId,
      };
    }
  };

  const handleUrlSubmit = async () => {
    if (!url.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    if (!isValidYouTubeUrl(url)) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    setIsLoading(true);    try {
      const videoId = extractVideoId(url);
      const playlistId = extractPlaylistId(url);

      if (videoId) {
        const info = await fetchVideoInfo(videoId);
        if (info) {
          setVideoData(info);
        } else {
          toast.error('Failed to fetch video information');
        }
      } else if (playlistId) {
        const info = await fetchPlaylistInfo(playlistId);
        if (info) {
          setVideoData(info);
        } else {
          toast.error('Failed to fetch playlist information');
        }
      } else {
        toast.error('Could not extract video or playlist ID from URL');
      }
    } catch (error) {
      console.error('Error processing URL:', error);
      toast.error('Failed to process YouTube URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!videoData) {
      toast.error('No video data to save');
      return;
    }

    onUpload(videoData);
    setUrl('');
    setVideoData(null);
    setIsOpen(false);
    toast.success('YouTube video added successfully');
  };

  const handleClose = () => {
    setUrl('');
    setVideoData(null);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Youtube className="h-4 w-4" />
          Add YouTube Video
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] max-h-[80vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            Add YouTube Content
          </DialogTitle>
          <DialogDescription>
            Add YouTube videos or playlists to your drive. They will appear in your videos filter.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="youtube-url">YouTube URL</Label>
              <div className="flex space-x-2">
                <Input
                  id="youtube-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  className="flex-1"
                />
                <Button 
                  onClick={handleUrlSubmit} 
                  disabled={isLoading || !url.trim()}
                  size="sm"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Supports individual videos and playlists
              </p>
            </div>

            {/* Video Preview */}
            {videoData && (
              <div className="border rounded-lg p-4 space-y-3">                <div className="flex items-start space-x-3">
                  <Image 
                    src={videoData.thumbnail} 
                    alt={videoData.title}
                    width={96}
                    height={72}
                    className="object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{videoData.title}</h4>
                    {videoData.description && (
                      <p className="text-sm text-muted-foreground">{videoData.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-block px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded">
                        {videoData.type === 'youtube-video' ? 'Video' : 'Playlist'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        YouTube
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!videoData}
            >
              <Upload className="mr-2 h-4 w-4" />
              Add to Drive
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
