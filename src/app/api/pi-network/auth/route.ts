import { NextRequest, NextResponse } from 'next/server';
import { getPiPlatformAPIClient } from '@/lib/pi-network';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Validating Pi Network access token...');
    console.log(`🔧 Environment: ${config.isDevelopment ? 'development' : 'production'}`);
    console.log(`🔧 Platform API URL: ${config.piNetwork.platformApiUrl}`);

    // Use Pi Platform API client to verify the token
    const piPlatformClient = getPiPlatformAPIClient();
    
    try {
      const userData = await piPlatformClient.verifyUser(accessToken);
      console.log('✅ Pi Network token validation successful');
      console.log('🔧 User data from Pi Platform:', userData);

      return NextResponse.json({
        success: true,
        user: userData,
        environment: {
          platformApiUrl: config.piNetwork.platformApiUrl,
        }
      });
    } catch (platformError) {
      console.error('❌ Pi Platform API validation failed:', platformError);
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('❌ Pi Network auth API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Pi Network API is available',
  });
} 