'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { getPiSDKInstance } from '@/lib/pi-network';
import { notifyNativeFeaturesUnavailable, notifyPiBrowserUpdateRecommended } from '@/services/notificationService';

interface NativeFeature {
  name: string;
  description: string;
  available: boolean;
}

const FEATURE_DEFINITIONS = {
  'inline_media': {
    name: 'Inline Media',
    description: 'Support for displaying media content inline'
  },
  'request_permission': {
    name: 'Permission Requests',
    description: 'Ability to request device permissions'
  },
  'ad_network': {
    name: 'Ad Network',
    description: 'Support for displaying ads and monetization'
  }
};

export default function NativeFeaturesCard() {
  const [features, setFeatures] = useState<NativeFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const detectFeatures = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const sdk = getPiSDKInstance();
      const availableFeatures = await sdk.getNativeFeatures();
      
      const featureList: NativeFeature[] = Object.entries(FEATURE_DEFINITIONS).map(([key, def]) => ({
        name: def.name,
        description: def.description,
        available: availableFeatures.includes(key)
      }));
      
      setFeatures(featureList);
      console.log('✅ Native features detection completed');
      
      // Check for missing features and notify
      const missingFeatures = featureList.filter(f => !f.available).map(f => f.name);
      if (missingFeatures.length > 0) {
        notifyNativeFeaturesUnavailable(missingFeatures);
      }
    } catch (err) {
      console.error('❌ Native features detection failed:', err);
      setError('Failed to detect native features. Please ensure you are using the Pi Browser.');
      notifyPiBrowserUpdateRecommended();
      
      // Fallback: show all features as unavailable
      const featureList: NativeFeature[] = Object.entries(FEATURE_DEFINITIONS).map(([key, def]) => ({
        name: def.name,
        description: def.description,
        available: false
      }));
      setFeatures(featureList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    detectFeatures();
  }, []);

  const getFeatureIcon = (available: boolean) => {
    if (available) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getFeatureBadge = (available: boolean) => {
    if (available) {
      return <Badge variant="default" className="text-xs">Available</Badge>;
    } else {
      return <Badge variant="secondary" className="text-xs">Not Available</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>Pi Browser Features</span>
          <Button
            variant="outline"
            size="sm"
            onClick={detectFeatures}
            disabled={loading}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Detecting features...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border gap-2"
              >
                <div className="flex items-center gap-3">
                  {getFeatureIcon(feature.available)}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm">{feature.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {feature.description}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {getFeatureBadge(feature.available)}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Features are automatically detected from your Pi Browser version</p>
          <p>• Some features may require updating your Pi Browser</p>
          <p>• Not all features are available in all Pi Browser versions</p>
        </div>
      </CardContent>
    </Card>
  );
} 