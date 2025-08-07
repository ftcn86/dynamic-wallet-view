import { useState, useEffect } from 'react';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { getNodeData } from '@/services/piService';
import { Card, CardContent } from '@/components/ui/card';
import { InfoBanner } from '../shared/InfoBanner';
import { EmptyState } from '../shared/EmptyState';

export default function NodeStatCard() {
  const [nodeData, setNodeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getNodeData()
      .then(setNodeData)
      .catch(() => setError('Failed to load node data. Please try again.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return (
    <Card className="shadow-lg flex items-center justify-center min-h-[120px]">
      <LoadingSpinner size={24} />
    </Card>
  );

  if (error) return (
    <Card className="shadow-lg">
      <CardContent className="p-3 sm:p-4">
        <InfoBanner
          variant="destructive"
          title={error}
          onRetry={() => {
            setIsLoading(true);
            setError(null);
            getNodeData()
              .then(setNodeData)
              .catch(() => setError('Failed to load node data. Please try again.'))
              .finally(() => setIsLoading(false));
          }}
        />
      </CardContent>
    </Card>
  );

  if (!nodeData) return (
    <Card className="shadow-lg">
      <CardContent>
        <EmptyState title="No node data" description="We couldn't find node stats for this account." />
      </CardContent>
    </Card>
  );

  // ...existing node data rendering...
} 