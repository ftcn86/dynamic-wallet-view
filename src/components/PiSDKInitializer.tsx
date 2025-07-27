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
    
    // Simple SDK initialization following official Pi Network demo pattern
    const initializePiSDK = () => {
      initAttempts++;
      
      if (typeof window !== 'undefined' && (window as any).Pi) {
        try {
          console.log('🚀 Initializing Pi Network SDK...');
          
          // Check if Pi SDK is already initialized
          if ((window as any).Pi.initialized) {
            console.log('✅ Pi Network SDK already initialized');
            return;
          }
          
          // Simple initialization - let Pi SDK handle browser detection
          (window as any).Pi.init({ version: "2.0" });
          
          console.log('✅ Pi Network SDK initialized successfully');
        } catch (error) {
          console.error('❌ Failed to initialize Pi Network SDK:', error);
        }
      } else if (initAttempts < maxAttempts) {
        // Retry initialization if Pi SDK not yet loaded
        setTimeout(initializePiSDK, 100);
      } else {
        console.log('⚠️ Pi SDK not loaded after maximum attempts - this is normal outside Pi Browser');
      }
    };

    // Start initialization after a small delay to ensure DOM is ready
    setTimeout(initializePiSDK, 100);
  }, []);

  return null;
} 