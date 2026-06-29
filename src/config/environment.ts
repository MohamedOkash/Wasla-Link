export const ENV = {
  NODE_ENV: import.meta.env.MODE || 'development',
  IS_PROD: import.meta.env.PROD,
  IS_DEV: import.meta.env.DEV,
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0-beta',
  API_URL: import.meta.env.VITE_API_URL || '',
};

export const FEATURE_FLAGS = {
  ENABLE_SMS_AUTH: import.meta.env.VITE_ENABLE_SMS_AUTH === 'true' || false,
  ENABLE_PUSH_NOTIFICATIONS: import.meta.env.VITE_ENABLE_PUSH_NOTIFICATIONS === 'true' || false,
  MAINTENANCE_MODE: import.meta.env.VITE_MAINTENANCE_MODE === 'true' || false,
};

// Validate critical environment variables
export const validateEnvironment = () => {
  const missing: string[] = [];
  
  if (!import.meta.env.VITE_FIREBASE_API_KEY) missing.push('VITE_FIREBASE_API_KEY');
  if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) missing.push('VITE_FIREBASE_PROJECT_ID');

  if (missing.length > 0) {
    if (ENV.IS_PROD) {
      console.error(`[CRITICAL] Missing Production Config: ${missing.join(', ')}`);
    } else {
      console.warn(`[DEV WARNING] Missing Config: ${missing.join(', ')}`);
    }
  }
};
