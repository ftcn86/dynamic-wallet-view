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
    // Simple SDK initialization following official Pi Network demo pattern
    const initializePiSDK = () => {
      if (typeof window !== 'undefined' && (window as any).Pi) {
        try {
          console.log('🚀 Initializing Pi Network SDK...');
          
          // Simple initialization - let Pi SDK handle browser detection
          (window as any).Pi.init({ version: "2.0" });
          
          console.log('✅ Pi Network SDK initialized successfully');
        } catch (error) {
          console.error('❌ Failed to initialize Pi Network SDK:', error);
        }
      } else {
        // Retry initialization if Pi SDK not yet loaded
        setTimeout(initializePiSDK, 100);
      }
    };

    initializePiSDK();
  }, []);

  return null;
} 