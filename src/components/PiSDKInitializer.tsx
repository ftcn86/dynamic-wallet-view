"use client"

import { useEffect } from 'react';

/**
 * Pi SDK Initializer Component
 * 
 * Initializes the Pi Network SDK following the OFFICIAL Pi Network documentation.
 * Sandbox mode is enabled when:
 * 1. Current window is on sandbox.minepi.com, OR
 * 2. App is embedded in Pi Network sandbox (detected via referrer or parent)
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

          // Enhanced sandbox detection for Pi Network
          const currentHostname = window.location.hostname;
          const referrer = document.referrer;
          
          // Check multiple conditions for sandbox detection:
          // 1. Direct access to sandbox.minepi.com
          // 2. Embedded in Pi Network sandbox (referrer contains sandbox.minepi.com)
          // 3. Parent window is on sandbox.minepi.com (if accessible)
          const isDirectSandbox = currentHostname === 'sandbox.minepi.com';
          const isEmbeddedSandbox = referrer.includes('sandbox.minepi.com');
          const isParentSandbox = (() => {
            try {
              // Try to access parent window (may fail due to CORS)
              return window.parent && window.parent !== window && 
                     window.parent.location.hostname === 'sandbox.minepi.com';
            } catch {
              return false; // CORS blocked access
            }
          })();
          
          const isSandbox = isDirectSandbox || isEmbeddedSandbox || isParentSandbox;
          
          console.log('🔧 Environment detected:', {
            isSandbox,
            currentHostname,
            referrer,
            isDirectSandbox,
            isEmbeddedSandbox,
            isParentSandbox,
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