'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/data/schemas';
import { notifyWalletAddressViewed } from '@/services/notificationService';

interface WalletAddressCardProps {
  user: User;
}

export default function WalletAddressCard({ user }: WalletAddressCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyAddress = async () => {
    if (!user.walletAddress) return;
    
    try {
      await navigator.clipboard.writeText(user.walletAddress);
      setCopied(true);
      toast({
        title: "Wallet address copied!",
        description: "Your Pi Network wallet address has been copied to clipboard.",
      });
      notifyWalletAddressViewed();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy wallet address to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleViewOnExplorer = () => {
    if (!user.walletAddress) return;
    
    const explorerUrl = `https://explorer.minepi.com/address/${user.walletAddress}`;
    window.open(explorerUrl, '_blank');
  };

  if (!user.walletAddress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Wallet Address</span>
            <Badge variant="secondary">Not Available</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Wallet address not available. This may be due to insufficient permissions or the user not being authenticated with the wallet_address scope.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Wallet Address</span>
          <Badge variant="default">Pi Network</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Your Pi Network Wallet Address
          </label>
          <div className="flex gap-2">
            <Input
              value={user.walletAddress}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyAddress}
              disabled={copied}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewOnExplorer}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View on Explorer
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• This is your unique Pi Network wallet address</p>
          <p>• Use this address to receive Pi from other users</p>
          <p>• You can view transaction history on the Pi Explorer</p>
        </div>
      </CardContent>
    </Card>
  );
} 