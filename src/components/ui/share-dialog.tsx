'use client';

import { useState } from 'react';
import { FileMetadata } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Copy, 
  Share, 
  Link, 
  ExternalLink,
  Check,
  Trash2,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

interface ShareDialogProps {
  file: FileMetadata | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShare: (fileId: string) => Promise<string>;
  onUnshare: (fileId: string) => Promise<void>;
}

export function ShareDialog({ 
  file, 
  open, 
  onOpenChange, 
  onShare, 
  onUnshare 
}: ShareDialogProps) {
  const [shareUrl, setShareUrl] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [isUnsharing, setIsUnsharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!file) return;
    
    try {
      setIsSharing(true);
      const url = await onShare(file._id);
      setShareUrl(url);
      toast.success('Share link generated');
    } catch (error) {
      console.error('Error sharing file:', error);
      toast.error('Failed to generate share link');
    } finally {
      setIsSharing(false);
    }
  };

  const handleUnshare = async () => {
    if (!file) return;
    
    try {
      setIsUnsharing(true);
      await onUnshare(file._id);
      setShareUrl('');
      toast.success('Share link removed');
    } catch (error) {
      console.error('Error unsharing file:', error);
      toast.error('Failed to remove share link');
    } finally {
      setIsUnsharing(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleOpenInNewTab = () => {
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  // Reset state when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setShareUrl('');
      setCopied(false);
    } else if (file?.isPublic && file.shareToken) {
      // Generate the share URL from the existing token
      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}/share/${file.shareToken}`);
    }
    onOpenChange(newOpen);
  };

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="h-5 w-5" />
            Share File
          </DialogTitle>          <DialogDescription>
            Share &quot;{file.name}&quot; with others by generating a public link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Share className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {file.mimeType} • {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>

          {/* Share Status */}
          {file.isPublic && shareUrl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Globe className="h-4 w-4" />
                <span>This file is publicly shared</span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="share-url">Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    id="share-url"
                    value={shareUrl}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleOpenInNewTab}
                    className="flex-shrink-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopyLink}
                  className="flex-1"
                  disabled={!shareUrl}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  onClick={handleUnshare}
                  disabled={isUnsharing}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isUnsharing ? 'Removing...' : 'Remove Share'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-center py-6">
                <Link className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-medium mb-2">Share this file</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate a public link that anyone can access
                </p>
                <Button
                  onClick={handleShare}
                  disabled={isSharing}
                  className="w-full"
                >
                  <Share className="mr-2 h-4 w-4" />
                  {isSharing ? 'Generating...' : 'Generate Share Link'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
