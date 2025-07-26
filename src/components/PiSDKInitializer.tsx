"use client";

import { useEffect } from 'react';

/**
 * PiSDKInitializer Component (Simplified - Following Official Demo Pattern)
 * 
 * This component handles the initialization of the Pi Network SDK.
 * It follows the exact same pattern as the official Pi Network demo.
 */

export function PiSDKInitializer() {
  useEffect(() => {
    // Initialize Pi Network SDK when component mounts
    const initializePiSDK = () => {
      if (typeof window !== 'undefined' && (window as any).Pi) {
        try {
          // Initialize Pi Network SDK (following official demo pattern)
          // Sandbox is only for testing outside Pi Browser
          const isPiBrowser = typeof window !== 'undefined' && (window as any).Pi;
          const runSDKInSandboxMode = !isPiBrowser && process.env.NEXT_PUBLIC_ENABLE_SANDBOX_SDK === 'true';
          
          console.log('🔧 SDK Initialization:', {
            isPiBrowser,
            runSDKInSandboxMode,
            hasPi: !!(window as any).Pi,
            hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A'
          });
          
          (window as any).Pi.init({ 
            version: "2.0",
            ...(runSDKInSandboxMode && { sandbox: true })
          });
          console.log('✅ Pi Network SDK initialized successfully');
          console.log('🔧 App ID:', process.env.NEXT_PUBLIC_PI_APP_ID || 'dynamic-wallet-view');
        } catch (error) {
          console.error('❌ Failed to initialize Pi Network SDK:', error);
        }
      } else {
        console.log('ℹ️ Pi Network SDK not available (running in regular browser)');
        console.log('💡 For development, the app will use mock authentication');
      }
    };

    // Try to initialize immediately
    initializePiSDK();

    // Also try after a short delay in case the script loads later
    const timeoutId = setTimeout(initializePiSDK, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // This component doesn't render anything
  return null;
} 