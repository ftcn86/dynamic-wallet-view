
import { MOCK_API_MIN_LATENCY, MOCK_API_MAX_LATENCY, MOCK_API_FAILURE_CHANCE } from '@/lib/constants';

export interface MockApiCallOptions<T> {
  data: T;
  minLatency?: number;
  maxLatency?: number;
  failureChance?: number;
}

export function mockApiCall<T>({
  data,
  minLatency = MOCK_API_MIN_LATENCY,
  maxLatency = MOCK_API_MAX_LATENCY,
  failureChance = MOCK_API_FAILURE_CHANCE,
}: MockApiCallOptions<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    if (data === null || data === undefined) {
      // Added this check to ensure data is not null/undefined
      return reject(new Error('Mock API call received null or undefined data.'));
    }

    const latency = Math.random() * (maxLatency - minLatency) + minLatency;
    setTimeout(() => {
      if (Math.random() < failureChance) {
        reject(new Error('Simulated API Failure'));
      } else {
        try {
          // Ensure JSON operations do not crash the call
          const deepCopiedData = JSON.parse(JSON.stringify(data));
          resolve(deepCopiedData);
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          reject(new Error(`Failed to process mock data (JSON operation failed): ${errorMessage}`));
        }
      }
    }, latency);
  });
}
