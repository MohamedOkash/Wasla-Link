import { EgyptianAddress } from './delivery.types';

export interface User {
  id?: string;
  uid: string;
  storeId?: string;
  name: string;
  role: 'splash' | 'login' | 'customer' | 'vendor' | 'driver' | 'admin';
  email: string;
  phone?: string;
  vehicleType?: string;
  rating?: number;
  favoriteStores?: string[];
  favoriteProducts?: string[];
  followedStores?: string[];
  savedAddresses?: EgyptianAddress[];
  points?: number;
  referralCode?: string;
  referredBy?: string | null;
  fcmToken?: string | null;
  isOnline?: boolean;
  currentOrderId?: string;
  preferences?: {
    notificationsEnabled?: boolean;
    chatNotifications?: boolean;
    supportNotifications?: boolean;
    offers?: boolean;
    marketing?: boolean;
    sound?: boolean;
    vibration?: boolean;
    quietHours?: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
}

