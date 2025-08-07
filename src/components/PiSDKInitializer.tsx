"use client"

import { useEffect } from 'react';

/**
 * Pi SDK Initializer Component
 * 
 * Initializes the Pi Network SDK following the OFFICIAL Pi Network documentation.
 * Sandbox mode is only enabled when running on sandbox.minepi.com
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

          // Official Pi Network sandbox detection
          // Sandbox mode is ONLY enabled when running on sandbox.minepi.com
          const isSandbox = window.location.hostname === 'sandbox.minepi.com';
          
          console.log('🔧 Environment detected:', {
            isSandbox,
            hostname: window.location.hostname,
            fullUrl: window.location.href
          });
          
          // Initialize with correct sandbox setting
          (window as unknown as { Pi: { init: (opts: { version: string; sandbox: boolean }) => void } }).Pi.init({ 
            version: "2.0", 
            sandbox: isSandbox 
          });
          
          console.log(`✅ Pi Network SDK initialized successfully (${isSandbox ? 'sandbox' : 'production'} mode)`);
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