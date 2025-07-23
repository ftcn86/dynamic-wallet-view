"use client";

import { useEffect } from 'react';

/**
 * PiSDKInitializer Component
 * 
 * This component handles the initialization of the Pi Network SDK.
 * It runs on the client side and ensures the SDK is properly loaded and initialized.
 */
export function PiSDKInitializer() {
  useEffect(() => {
    // Initialize Pi Network SDK when component mounts
    const initializePiSDK = () => {
      if (typeof window !== 'undefined' && (window as any).Pi) {
        try {
          // Detect if we're in sandbox environment
          const isSandbox = window.location.hostname.includes('sandbox.minepi.com');
          
          // Initialize Pi SDK with environment specification
          (window as any).Pi.init({ 
            version: "2.0",
            appId: process.env.NEXT_PUBLIC_PI_APP_ID || 'dynamic-wallet-view',
            environment: isSandbox ? 'sandbox' : 'mainnet'
          });
          console.log('✅ Pi Network SDK initialized successfully');
          console.log('🌍 Environment:', isSandbox ? 'sandbox' : 'mainnet');
          

          
        } catch (error) {
          console.error('❌ Failed to initialize Pi Network SDK:', error);
        }
      } else {
        console.log('ℹ️ Pi Network SDK not available (running in regular browser)');
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