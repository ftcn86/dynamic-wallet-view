
"use client"

import en from '@/../locales/en.json';
import { useCallback } from 'react';
import type { LegalSection } from '@/data/schemas';

// Helper to get nested values from a JSON object using a dot-separated path.
function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce((acc, part) => acc && (acc as Record<string, unknown>)[part], obj);
}

/**
 * A simplified hook for fetching translations from the en.json file.
 * This serves as a single source of truth for all UI text.
 */
export function useTranslation() {

  const getRawTranslation = useCallback((key: string): unknown => {
    const value = getNestedValue(en, key);

    if (value === undefined) {
      console.error(`Translation key "${key}" not found in en.json.`);
      return key; // Return the key itself as a fallback.
    }
    return value;
  }, []);

  // Specifically for fetching arrays of LegalSection, providing type safety
  const getLegalSections = useCallback((key: string): LegalSection[] => {
    const rawValue = getRawTranslation(key);
    if (Array.isArray(rawValue) && rawValue.every(item => typeof item === 'object' && 'title' in item && 'content' in item)) {
      return rawValue as LegalSection[];
    }
    console.warn(`Translation key "${key}" did not return a valid LegalSection[] array. Returning empty array.`);
    return [];
  }, [getRawTranslation]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let translation = getRawTranslation(key);

    if (typeof translation !== 'string') {
      console.warn(`Translation for key "${key}" is not a string. Using key as fallback.`);
      translation = key; // Fallback to key itself
    }

    if (params) {
      Object.keys(params).forEach(paramKey => {
        const regex = new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g');
        translation = (translation as string).replace(regex, String(params[paramKey]));
      });
    }
    return translation as string;
  }, [getRawTranslation]);

  return { t, getRawTranslation, getLegalSections };
}
