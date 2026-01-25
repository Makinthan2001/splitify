/**
 * App constants
 */
export const APP_CONFIG = {
  APP_NAME: 'Splitify',
  VERSION: '1.0.0',
  SUPPORTED_CURRENCIES: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
  DEFAULT_CURRENCY: 'USD',
} as const;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.splitify.app',
  AUTH: '/auth',
  USERS: '/users',
  EXPENSES: '/expenses',
  GROUPS: '/groups',
} as const;

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  USER_PREFERENCES: 'userPreferences',
  THEME: 'theme',
} as const;

/**
 * Theme colors
 */
export const COLORS = {
  PRIMARY: '#DAA520',
  SECONDARY: '#5856D6',
  SUCCESS: '#34C759',
  WARNING: '#FF9500',
  ERROR: '#FF3B30',
  LIGHT_GRAY: '#F2F2F7',
  DARK_GRAY: '#8E8E93',
} as const;