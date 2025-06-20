'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Share, Check, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { FileMetadata } from '@/types';

interface ShareDialogProps {
  file: FileMetadata;
  trigger?: React.ReactNode;
}

export function ShareDialog({ file, trigger }: ShareDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateShareLink = async () => {
    if (shareUrl) return; // Already generated
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/files/${file._id}/share`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate share link');
      }

      const data = await response.json();
      setShareUrl(data.shareUrl);
      toast.success('Share link generated successfully');
    } catch (error) {
      console.error('Error generating share link:', error);
      toast.error('Failed to generate share link');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Share link copied to clipboard');
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const removeShare = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/files/${file._id}/share`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove share link');
      }

      setShareUrl(null);
      toast.success('Share link removed');
    } catch (error) {
      console.error('Error removing share link:', error);
      toast.error('Failed to remove share link');
    } finally {
      setIsLoading(false);
    }
  };

  const openShareLink = () => {
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !shareUrl) {
      generateShareLink();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
        )}
      </DialogTrigger>      <DialogContent className="sm:max-w-[425px] max-h-[80vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Share className="h-5 w-5" />
            Share &quot;{file.name}&quot;
          </DialogTitle>
          <DialogDescription>
            Anyone with this link can view and download this file.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col space-y-4 pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : shareUrl ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="share-url">Share Link</Label>
                <div className="flex space-x-2">
                  <Input
                    id="share-url"
                    value={shareUrl}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={copyToClipboard}
                    className="px-3"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={openShareLink}
                    className="px-3"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <p className="text-sm text-muted-foreground">
                  Link expires in 30 days
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={removeShare}
                  disabled={isLoading}
                >
                  <X className="mr-2 h-4 w-4" />
                  Remove Access
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Failed to generate share link</p>
              <Button onClick={generateShareLink} className="mt-2">
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
