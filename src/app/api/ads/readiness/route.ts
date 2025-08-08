import { NextRequest, NextResponse } from 'next/server';

/**
 * Ad Readiness API Endpoint
 * 
 * This endpoint checks if the Pi Network Ad Network is available
 * and ready to serve ads.
 */

export async function GET(request: NextRequest) {
  try {
    // Check if Pi Browser features are available
    const userAgent = request.headers.get('user-agent') || '';
    const isPiBrowser = userAgent.includes('PiBrowser') || userAgent.includes('minepi.com');
    
    // Minimal readiness: only allow in Pi Browser; no mock enablement in production
    const adReadiness = {
      canWatch: isPiBrowser,
      network: 'pi_network',
      features: {
        rewarded_ads: isPiBrowser,
        interstitial_ads: false,
        banner_ads: false,
      },
      message: isPiBrowser 
        ? 'Pi Network Ad Network is available' 
        : 'Pi Network Ad Network requires Pi Browser',
    };

    return NextResponse.json({
      success: true,
      data: adReadiness,
    });
  } catch (error) {
    console.error('Ad readiness check error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check ad readiness',
        data: {
          available: false,
          network: 'unknown',
          features: {
            rewarded_ads: false,
            interstitial_ads: false,
            banner_ads: false,
          },
          message: 'Ad network status unknown',
        }
      },
      { status: 500 }
    );
  }
} 