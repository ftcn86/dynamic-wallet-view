import { useState, useEffect } from 'react';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { getNodeData } from '@/services/piService';
import { Card } from '@/components/ui/card';

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
    <Card className="shadow-lg flex flex-col items-center justify-center min-h-[120px] p-4 text-center bg-red-50 border border-red-200">
      <span className="text-red-700 font-medium">{error}</span>
    </Card>
  );

  if (!nodeData) return (
    <Card className="shadow-lg flex flex-col items-center justify-center min-h-[120px] p-4 text-center">
      <span className="text-gray-500">No node data available.</span>
    </Card>
  );

  // ...existing node data rendering...
} 