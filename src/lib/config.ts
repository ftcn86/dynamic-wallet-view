/**
 * Application Configuration
 * 
 * This file manages all environment-specific configuration including:
 * - Pi Network API settings
 * - Environment detection
 * - Feature flags
 * - API endpoints
 */

export interface AppConfig {
  // Environment
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  piEnvironment: 'testnet' | 'mainnet';
  
  // Pi Network Configuration
  piNetwork: {
    appId: string;
    apiKey: string;
    platformApiUrl: string;
  };
  
  // API Configuration
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  
  // Feature Flags
  features: {
    realPayments: boolean;
    realAuthentication: boolean;
    analytics: boolean;
    notifications: boolean;
  };
  
  // App Settings
  app: {
    name: string;
    version: string;
    description: string;
    supportEmail: string;
  };
}

/**
 * Get environment variable with fallback
 */
function getEnvVar(key: string, fallback: string = ''): string {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || fallback;
  }
  return fallback;
}

/**
 * Detect Pi Network environment
 */
function getPiEnvironment(): 'testnet' | 'mainnet' {
  if (typeof window === 'undefined') return 'mainnet';
  
  const currentHostname = window.location.hostname;
  const referrer = document.referrer;
  
  // Enhanced sandbox detection for Pi Network
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
  
  if (isSandbox || currentHostname.includes('testnet.minepi.com')) {
    return 'testnet';
  } else {
    return 'mainnet';
  }
}

/**
 * Get Pi Platform API URL based on environment
 */
function getPiPlatformApiUrl(): string {
  // Use environment variable if provided, otherwise use default URL
  const customUrl = getEnvVar('NEXT_PUBLIC_PI_PLATFORM_API_URL', '');
  if (customUrl) return customUrl;
  
  // Get current environment
  const environment = getPiEnvironment();
  
  // Return appropriate URL based on environment
  if (environment === 'testnet') {
    return 'https://api.testnet.minepi.com';
  } else {
    return 'https://api.minepi.com';
  }
}

/**
 * Get API base URL for Vercel deployment
 */
function getApiBaseUrl(): string {
  // In production (Vercel), use the same domain
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const host = window.location.host;
    return `${protocol}//${host}`;
  }
  
  // Fallback to environment variable or localhost for development
  return getEnvVar('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:3000');
}

/**
 * Application configuration
 */
export const config: AppConfig = {
  // Environment detection
  isDevelopment: getEnvVar('NODE_ENV') === 'development',
  isProduction: getEnvVar('NODE_ENV') === 'production',
  isTest: getEnvVar('NODE_ENV') === 'test',
  piEnvironment: getPiEnvironment(),
  
  // Pi Network configuration
  piNetwork: {
    appId: getEnvVar('NEXT_PUBLIC_PI_APP_ID', 'dynamic-wallet-view'),
    apiKey: getEnvVar('PI_API_KEY', ''), // Server-side only, not exposed to client
    platformApiUrl: getPiPlatformApiUrl(),
  },
  
  // API configuration
  api: {
    baseUrl: getApiBaseUrl(),
    timeout: parseInt(getEnvVar('NEXT_PUBLIC_API_TIMEOUT', '10000')),
    retries: parseInt(getEnvVar('NEXT_PUBLIC_API_RETRIES', '3')),
  },
  
  // Feature flags - Pi SDK handles browser detection internally
  features: {
    realPayments: getEnvVar('NEXT_PUBLIC_ENABLE_REAL_PAYMENTS', 'true') === 'true',
    realAuthentication: getEnvVar('NEXT_PUBLIC_ENABLE_REAL_AUTH', 'true') === 'true',
    analytics: getEnvVar('NEXT_PUBLIC_ENABLE_ANALYTICS', 'false') === 'true',
    notifications: getEnvVar('NEXT_PUBLIC_ENABLE_NOTIFICATIONS', 'true') === 'true',
  },
  
  // App settings
  app: {
    name: 'Dynamic Wallet View',
    version: '1.0.0',
    description: 'A comprehensive dashboard for Pi Network users',
    supportEmail: 'support@dynamicwalletview.com',
  },
};

// Debug logging for environment detection
if (typeof window !== 'undefined') {
  console.log('🔧 [CONFIG] Environment detection:', {
    isDevelopment: config.isDevelopment,
    isProduction: config.isProduction,
    piEnvironment: config.piEnvironment,
    platformApiUrl: config.piNetwork.platformApiUrl,
    currentHostname: window.location.hostname,
    referrer: document.referrer
  });
}

/**
 * Get Pi Network configuration for current environment
 */
export function getPiNetworkConfig() {
  return {
    appId: config.piNetwork.appId,
    apiKey: config.piNetwork.apiKey,
    platformApiUrl: config.piNetwork.platformApiUrl,
  };
}

/**
 * Check if real Pi Network features should be enabled
 */
export function shouldUseRealPiNetwork(): boolean {
  return config.features.realAuthentication;
}

/**
 * Get API endpoint URL
 */
export function getApiUrl(endpoint: string): string {
  return `${config.api.baseUrl}/api${endpoint}`;
}

/**
 * Get environment-specific settings
 */
export function getEnvironmentSettings() {
  return {
    isDevelopment: config.isDevelopment,
    isProduction: config.isProduction,
    piEnvironment: config.piEnvironment,
    features: config.features,
    piNetwork: {
      appId: config.piNetwork.appId,
      platformApiUrl: config.piNetwork.platformApiUrl,
    },
    api: {
      baseUrl: config.api.baseUrl,
      timeout: config.api.timeout,
    },
  };
}

/**
 * Validate configuration
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required environment variables
  if (!config.piNetwork.appId) {
    errors.push('NEXT_PUBLIC_PI_APP_ID is required');
  }
  
  if (config.isProduction && !config.piNetwork.apiKey) {
    errors.push('PI_API_KEY is required in production (server-side only)');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Log configuration (development only)
 */
export function logConfig(): void {
  if (config.isDevelopment) {
    console.log('🔧 App Configuration:', {
      environment: getEnvVar('NODE_ENV'),
      piNetwork: {
        appId: config.piNetwork.appId,
        platformApiUrl: config.piNetwork.platformApiUrl,
        apiKey: config.piNetwork.apiKey ? '[HIDDEN]' : '[NOT SET]',
      },
      features: config.features,
      api: {
        baseUrl: config.api.baseUrl,
        timeout: config.api.timeout,
      },
    });
  }
}

// Log configuration on import (development only)
if (config.isDevelopment) {
  logConfig();
} 