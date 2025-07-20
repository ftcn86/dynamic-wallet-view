import { NextRequest, NextResponse } from 'next/server';
import type { NodeData } from '@/data/schemas';

// Mock node data (in production, this would come from the database)
const mockNodeData: NodeData = {
  nodeId: 'node_001',
  status: 'online',
  lastSeen: new Date().toISOString(),
  nodeSoftwareVersion: '1.2.3',
  latestSoftwareVersion: '1.2.4',
  country: 'United States',
  countryFlag: '🇺🇸',
  uptimePercentage: 98.5,
  performanceScore: 95.2,
  blocksProcessed: 15420,
  performanceHistory: [
    { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), score: 92.1 },
    { date: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(), score: 93.5 },
    { date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(), score: 94.2 },
    { date: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString(), score: 95.8 },
    { date: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString(), score: 96.1 },
    { date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), score: 95.4 },
    { date: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString(), score: 94.9 },
    { date: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(), score: 95.7 },
    { date: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(), score: 96.3 },
    { date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), score: 95.9 },
    { date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), score: 96.5 },
    { date: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(), score: 95.2 },
    { date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(), score: 94.8 },
    { date: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(), score: 95.6 },
    { date: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(), score: 96.2 },
    { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), score: 95.8 },
    { date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), score: 96.4 },
    { date: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(), score: 95.1 },
    { date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), score: 94.7 },
    { date: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(), score: 95.3 },
    { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), score: 96.0 },
    { date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), score: 95.7 },
    { date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), score: 96.1 },
    { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), score: 95.4 },
    { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), score: 94.9 },
    { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), score: 95.6 },
    { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), score: 96.2 },
    { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), score: 95.8 },
    { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), score: 96.4 },
    { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), score: 95.2 },
    { date: new Date().toISOString(), score: 95.2 },
  ],
};

/**
 * GET /api/node/performance
 * Get node performance data for node operators
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    // In a real implementation, this would:
    // 1. Check if the user is a node operator
    // 2. Fetch their specific node data from the database
    // 3. Return the node performance data

    // For now, we'll return mock data
    return NextResponse.json({
      success: true,
      nodeData: mockNodeData,
    });
  } catch (error) {
    console.error('Failed to fetch node performance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch node performance' },
      { status: 500 }
    );
  }
} 