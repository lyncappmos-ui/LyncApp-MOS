
import { CoreResponse } from '../types';
import { runtime } from './coreRuntime';

/**
 * PHASE 2: Safe Fetch Service
 * Abstracts fetch calls and ensures CoreResponse adherence with runtime safety.
 */
export const coreService = {
  /**
   * Generic safe fetch for any URL.
   * Returns a CoreResponse with the expected type or fallback.
   */
  async fetchSafe<T>(url: string, fallback: T, options?: RequestInit): Promise<CoreResponse<T>> {
    return runtime.executeSafe(async () => {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP_${response.status}: ${response.statusText}`);
      }
      return await response.json() as T;
    }, fallback);
  },

  /**
   * Internal wrapper for local module execution that needs safety.
   */
  async wrapLocal<T>(operation: () => Promise<T>, fallback: T): Promise<CoreResponse<T>> {
    return runtime.executeSafe(operation, fallback);
  }
};
