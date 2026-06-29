/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_API_URL: string;
  readonly VITE_ENABLE_SMS_AUTH: string;
  readonly VITE_ENABLE_PUSH_NOTIFICATIONS: string;
  readonly VITE_MAINTENANCE_MODE: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
