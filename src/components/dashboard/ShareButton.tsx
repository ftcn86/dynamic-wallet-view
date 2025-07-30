'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Share2, Check } from 'lucide-react';
import { getPiSDKInstance } from '@/lib/pi-network';
import { notifyAppShared, notifyShareFailed } from '@/services/notificationService';

interface ShareButtonProps {
  title?: string;
  message?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

export default function ShareButton({
  title = 'Dynamic Wallet View',
  message = 'Check out this amazing Pi Network dashboard!',
  variant = 'outline',
  size = 'default',
  className = '',
  children
}: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    setIsSharing(true);
    setShared(false);
    
    try {
      const sdk = getPiSDKInstance();
      // openShareDialog doesn't exist in the SDK, so we'll use a fallback
      // await sdk.openShareDialog(title, message);
      
      // Fallback: use browser's native share API if available
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: message,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${title}\n\n${message}`);
      }

      setShared(true);
      toast({
        title: "Shared successfully!",
        description: "Your content has been shared.",
      });
      notifyAppShared();
      
      // Reset shared state after 2 seconds
      setTimeout(() => setShared(false), 2000);
    } catch (error) {
      console.error('Share failed:', error);
      toast({
        title: "Share failed",
        description: "Unable to share. Please try again.",
        variant: "destructive",
      });
      notifyShareFailed();
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      disabled={isSharing}
      className={className}
    >
      {isSharing ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
      ) : shared ? (
        <Check className="h-4 w-4" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
      {children && <span className="ml-2">{children}</span>}
    </Button>
  );
} 