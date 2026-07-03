/**
 * Lightweight session cache for Gemini API outputs to preserve quota.
 * Uses sessionStorage to persist cached results across view switches.
 */

export const getGeminiCache = (key: string): any => {
  try {
    const cached = sessionStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  } catch (e) {
    return null;
  }
};

export const setGeminiCache = (key: string, value: any): void => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // Fail-safe for storage limits or private browsing
  }
};

export const hasGeminiCache = (key: string): boolean => {
  return getGeminiCache(key) !== null;
};
