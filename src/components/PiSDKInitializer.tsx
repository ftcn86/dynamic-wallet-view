"use client"

import { useEffect } from 'react';

/**
 * Pi SDK Initializer Component
 * 
 * Initializes the Pi Network SDK following the official demo pattern.
 * The Pi SDK handles browser detection internally, so we don't need 
 * complex environment detection logic.
 */
export default function PiSDKInitializer() {
  useEffect(() => {
    let initAttempts = 0;
    const maxAttempts = 50; // Try for 5 seconds (50 * 100ms)
    
    const initializePiSDK = () => {
      initAttempts++;
      
      if (typeof window !== 'undefined' && (window as unknown as { Pi?: unknown }).Pi) {
        try {
          console.log('🚀 Initializing Pi Network SDK...');
          
          if ((window as unknown as { Pi?: { initialized?: boolean } }).Pi?.initialized) {
            console.log('✅ Pi Network SDK already initialized');
            return;
          }
          // Add sandbox: true for testnet
          (window as unknown as { Pi: { init: (opts: { version: string; sandbox: boolean }) => void } }).Pi.init({ version: "2.0", sandbox: true });
          
          console.log('✅ Pi Network SDK initialized successfully (sandbox mode)');
        } catch (error) {
          console.error('❌ Failed to initialize Pi Network SDK:', error);
        }
      } else if (initAttempts < maxAttempts) {
        setTimeout(initializePiSDK, 100);
      } else {
        console.log('⚠️ Pi SDK not loaded after maximum attempts - this is normal outside Pi Browser');
      }
    };

    setTimeout(initializePiSDK, 100);
  }, []);

  return null;
} 