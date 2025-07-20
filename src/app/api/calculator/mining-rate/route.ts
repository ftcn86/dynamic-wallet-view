import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/calculator/mining-rate
 * Calculate mining rate based on lockup percentage and duration
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const { lockupPercentage, lockupDuration, currentMiningRate = 0.1 } = await request.json();

    if (lockupPercentage === undefined || lockupDuration === undefined) {
      return NextResponse.json(
        { error: 'Lockup percentage and duration are required' },
        { status: 400 }
      );
    }

    if (lockupPercentage < 0 || lockupPercentage > 100) {
      return NextResponse.json(
        { error: 'Lockup percentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (lockupDuration < 1 || lockupDuration > 365) {
      return NextResponse.json(
        { error: 'Lockup duration must be between 1 and 365 days' },
        { status: 400 }
      );
    }

    // Pi Network mining rate calculation formula
    // This is a simplified version - in production, this would use the official Pi Network formula
    const baseRate = currentMiningRate;
    const lockupBonus = (lockupPercentage / 100) * (lockupDuration / 365) * 0.5;
    const teamBonus = 0.1; // Mock team bonus
    const nodeBonus = 0.05; // Mock node bonus (if applicable)
    
    const totalMiningRate = baseRate + lockupBonus + teamBonus + nodeBonus;

    // Calculate additional metrics
    const lockupAmount = (lockupPercentage / 100) * 1000; // Assuming 1000π total balance
    const dailyReward = totalMiningRate * 24; // 24 hours per day
    const monthlyReward = dailyReward * 30; // 30 days per month
    const yearlyReward = dailyReward * 365; // 365 days per year

    return NextResponse.json({
      success: true,
      calculation: {
        baseRate,
        lockupBonus,
        teamBonus,
        nodeBonus,
        totalMiningRate,
        lockupAmount,
        dailyReward,
        monthlyReward,
        yearlyReward,
        lockupPercentage,
        lockupDuration,
      },
      recommendations: {
        optimalLockupPercentage: lockupPercentage > 50 ? 'High lockup percentage provides good bonus' : 'Consider increasing lockup for better rewards',
        optimalDuration: lockupDuration > 180 ? 'Long-term lockup maximizes bonus' : 'Longer lockup periods provide better bonuses',
      },
    });
  } catch (error) {
    console.error('Failed to calculate mining rate:', error);
    return NextResponse.json(
      { error: 'Failed to calculate mining rate' },
      { status: 500 }
    );
  }
} 