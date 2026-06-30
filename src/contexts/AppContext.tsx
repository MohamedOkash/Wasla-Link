import React, { createContext, useState, useEffect, useContext } from 'react';
import { translations } from '../data/translations';
import { User } from '../types/user.types';
import { Store } from '../types/store.types';
import { Product } from '../types/product.types';
import { Order } from '../types/order.types';
import { Banner } from '../types/banner.types';
import { Coupon } from '../types/coupon.types';
import { EgyptianAddress } from '../types/delivery.types';
import { WalletTransaction, Settlement as WalletSettlement } from '../types/finance.types';
import { ReturnRequest } from '../types/return.types';
import { DriverMetrics } from '../types/analytics.types';
import { PointsHistoryEntry, Referral } from '../types/loyalty.types';
import { PlatformSettings } from '../types/financial';
import { DEFAULT_PLATFORM_SETTINGS } from '../services/deliveryFee.service';
import { fcmService } from '../services/fcm.service';
import { Preferences } from '@capacitor/preferences';
import { ToastItem, ToastType } from '../components/premium/toast/PremiumToast';

// Firebase Imports
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  where, 
  addDoc,
  deleteDoc,
  writeBatch,
  increment,
  getDocs
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { cacheService } from '../services/cache.service';
import { themes, ThemeName } from '../theme/themes';
import { userRepository } from "../services/shared/user.repository";
import { storeRepository } from "../services/vendor/repository";
import { platformSettingsRepository } from "../services/admin/repository";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imgUrl: string;
  shopId: string;
  shopName: string;
}

export interface Cart {
  items: CartItem[];
}

export interface CartConflictAlert {
  isOpen: boolean;
  product: any;
  shop: any;
  quantity: number;
  isAbsolute: boolean;
}

export interface LocationState {
  name: string;
  coords: { lat: number; lng: number; accuracy?: number } | null;
  isVerified: boolean;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  storeId: string;
  quantity: number;
  type: 'Purchase' | 'Sale' | 'Return' | 'Damage' | 'Adjustment' | 'Transfer';
  reason: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: { ar: string; en: string } | string;
  description: { ar: string; en: string } | string;
  type: 'order' | 'offer' | 'promotion' | 'store_update' | 'delivery' | 'system';
  storeId?: string;
  productId?: string;
  orderId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  orderId: string;
  storeId: string;
  driverId: string;
  ratingStore: number;
  ratingDriver: number;
  ratingProducts: number;
  comment?: string;
  createdAt: string;
}

export interface DriverDetail {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  rating: number;
  isOnline: boolean;
  status: 'approved' | 'suspended' | 'pending';
  availability?: 'available' | 'busy' | 'offline';
}

interface AppContextType {
  lang: string;
  setLang: (l: string) => void;
  t: (key: string) => string;
  isRTL: boolean;
  role: string;
  setRole: (role: string) => void;
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  categories: any[];
  banners: Banner[];
  orders: Order[];
  cart: Cart;
  setCart: React.Dispatch<React.SetStateAction<Cart>>;
  cartConflictAlert: CartConflictAlert | null;
  setCartConflictAlert: React.Dispatch<React.SetStateAction<CartConflictAlert | null>>;
  addToCartGlobal: (product: any, shop: any, quantity?: number, isAbsolute?: boolean) => void;
  confirmClearCartAndAdd: () => void;
  cancelCartConflict: () => void;
  location: LocationState;
  setLocation: (loc: LocationState) => void;
  toasts: ToastItem[];
  showToast: (msg: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  goHome: () => void;
  favoriteStores: string[];
  toggleFavoriteStore: (id: string) => void;
  favoriteProducts: string[];
  toggleFavoriteProduct: (id: string) => void;
  stockMovements: StockMovement[];
  addStockMovement: (productId: string, quantity: number, type: StockMovement['type'], reason: string) => void;
  
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  toggleTheme: () => void;

  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;

  coupons: Coupon[];
  activeCoupon: Coupon | null;
  setActiveCoupon: (c: Coupon | null) => void;

  savedAddresses: EgyptianAddress[];
  addAddress: (addr: Omit<EgyptianAddress, 'id'>) => void;
  editAddress: (id: string, addr: Partial<EgyptianAddress>) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;

  returnRequests: ReturnRequest[];
  createReturnRequest: (req: Omit<ReturnRequest, 'id' | 'status' | 'timeline' | 'createdAt' | 'updatedAt'>) => void;
  updateReturnStatus: (id: string, status: ReturnRequest['status'], note?: string) => void;

  driverMetrics: Record<string, DriverMetrics>;

  followedStores: string[];
  toggleFollowStore: (storeId: string) => void;

  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;

  showSearch: boolean;
  setShowSearch: (show: boolean) => void;
  showMap: boolean;
  setShowMap: (show: boolean) => void;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;

  triggerOfferBroadcast: (storeId: string, offerText: string, productId?: string) => void;
  triggerOrderUpdateBroadcast: (orderId: string, status: string, orderData?: Order) => void;

  detectLocationGPS: (onSuccess?: (address: string) => void) => void;

  drivers: DriverDetail[];
  updateDriverStatus: (id: string, status: DriverDetail['status']) => void;
  toggleDriverOnline: (id: string) => void;

  updateOrderStatus: (orderId: string, status: Order['status'], driverId?: string, driverName?: string) => void;

  walletTransactions: WalletTransaction[];
  walletSettlements: WalletSettlement[];
  addSettlement: (amount: number, method: WalletSettlement['method'], details: string) => void;

  addReview: (orderId: string, storeId: string, driverId: string, ratingStore: number, ratingDriver: number, ratingProducts: number, comment?: string) => void;

  campaigns: any[];
  pointsHistory: PointsHistoryEntry[];
  referrals: Referral[];
  platformSettings: PlatformSettings | null;
  updatePlatformSettings: (settings: PlatformSettings) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState(() => localStorage.getItem('waslalink_lang') || 'ar');
  const [role, setRole] = useState('splash');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Real-time Firestore synchronised states
  const [categories, setCategoriesState] = useState<any[]>([]);
  const [banners, setBannersState] = useState<Banner[]>([]);
  const [orders, setOrdersState] = useState<Order[]>([]);
  const [coupons, setCouponsState] = useState<Coupon[]>([]);
  const [returnRequests, setReturnRequestsState] = useState<ReturnRequest[]>([]);
  const [notifications, setNotificationsState] = useState<Notification[]>([]);
  const [walletTransactions, setWalletTransactionsState] = useState<WalletTransaction[]>([]);
  const [walletSettlements, setWalletSettlementsState] = useState<WalletSettlement[]>([]);
  const [drivers, setDriversState] = useState<DriverDetail[]>([]);
  const [campaigns, setCampaignsState] = useState<any[]>([]);
  const [driverMetrics, setDriverMetricsState] = useState<Record<string, DriverMetrics>>({});
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsHistoryEntry[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

  // User sub-collections states mapped from currentUser profile
  const [favoriteStores, setFavoriteStores] = useState<string[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<string[]>([]);
  const [followedStores, setFollowedStores] = useState<string[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<EgyptianAddress[]>([]);

  const [cart, setCart] = useState<Cart>({ items: [] });
  const [isCartHydrated, setIsCartHydrated] = useState(false);
  const [cartConflictAlert, setCartConflictAlert] = useState<CartConflictAlert | null>(null);

  const [location, setLocation] = useState<LocationState>(() => {
    const saved = localStorage.getItem('waslalink_loc');
    return saved ? JSON.parse(saved) : { name: '', coords: null, isVerified: false };
  });
  
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [theme, setThemeState] = useState<ThemeName>(() => {
    return (localStorage.getItem('waslalink_theme') as ThemeName) || 'orange';
  });

  useEffect(() => {
    const applyThemeTokens = (themeName: ThemeName) => {
      const root = document.documentElement;
      const themeVars = themes[themeName];
      if (themeVars) {
        Object.entries(themeVars).forEach(([key, val]) => {
          root.style.setProperty(key, val);
        });
      }
    };
    applyThemeTokens(theme);
  }, [theme]);

  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);

  // Overlay control states
  const [showSearch, setShowSearch] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Search History Local State
  const [recentSearches, setRecentSearchesState] = useState<string[]>(() => {
    const saved = localStorage.getItem('waslalink_recent_searches');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('waslalink_recent_searches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  // Hydrate Cart from Preferences
  useEffect(() => {
    const hydrateCart = async () => {
      try {
        const { value } = await Preferences.get({ key: 'waslalink_cart' });
        if (value) {
          const parsed = JSON.parse(value);
          // Auto-migrate old carts
          if (parsed.items) {
             const migratedItems = parsed.items.map((i: any) => ({
               ...i,
               shopId: i.shopId || parsed.shopId || '',
               shopName: i.shopName || parsed.shopName || ''
             }));
             setCart({ items: migratedItems });
          }
        }
      } catch (err) {
        console.error('Failed to hydrate cart', err);
      } finally {
        setIsCartHydrated(true);
      }
    };
    hydrateCart();
  }, []);

  // Sync Cart to Preferences
  useEffect(() => {
    if (isCartHydrated) {
      Preferences.set({ key: 'waslalink_cart', value: JSON.stringify(cart) });
    }
  }, [cart, isCartHydrated]);

  // Cart Sync Flags
  const [remoteCartFetched, setRemoteCartFetched] = useState(false);

  // Sync Cart to Firestore on Login
  useEffect(() => {
    if (!currentUser?.uid || !isCartHydrated) return;
    
    const syncCartWithFirestore = async () => {
      try {
        await import('../services/shared/cart.repository').then(async m => {
          const cartSnap = await m.cartRepository.findById(currentUser.uid);
          
          if (cartSnap) {
            const remoteCart = cartSnap as Cart;
            // Auto-migrate old format
            const remoteItems = remoteCart.items || [];
            const migratedRemoteItems = remoteItems.map((i: any) => ({
               ...i,
               shopId: i.shopId || (remoteCart as any).shopId || '',
               shopName: i.shopName || (remoteCart as any).shopName || ''
            }));

            if (cart.items.length === 0 && migratedRemoteItems.length > 0) {
              setCart({ items: migratedRemoteItems });
            } else if (cart.items.length > 0) {
              // Merge could be implemented, but simple overwrite to remote for now
              await m.cartRepository.update(currentUser.uid, { items: cart.items, userId: currentUser.uid, updatedAt: new Date().toISOString() });
            }
          } else if (cart.items.length > 0) {
            await m.cartRepository.create(currentUser.uid, { items: cart.items, userId: currentUser.uid, updatedAt: new Date().toISOString() });
          }
        });
      } catch (err) {
        console.error("Cart sync error", err);
      } finally {
        setRemoteCartFetched(true);
      }
    };
    syncCartWithFirestore();
  }, [currentUser?.uid, isCartHydrated]);

  // Push Cart Updates to Firestore when logged in
  useEffect(() => {
    if (!currentUser?.uid || !isCartHydrated || !remoteCartFetched) return;
    const timeout = setTimeout(async () => {
      try {
        await import('../services/shared/cart.repository').then(async m => {
          if (cart.items.length === 0) {
            await m.cartRepository.delete(currentUser.uid);
          } else {
            await m.cartRepository.update(currentUser.uid, {
              items: cart.items,
              userId: currentUser.uid,
              updatedAt: new Date().toISOString()
            });
          }
        });
      } catch (err) {}
    }, 500);
    return () => clearTimeout(timeout);
  }, [cart, currentUser?.uid, isCartHydrated, remoteCartFetched]);

  const addRecentSearch = (queryStr: string) => {
    if (!queryStr.trim()) return;
    setRecentSearchesState(prev => {
      const filtered = prev.filter(q => q !== queryStr);
      return [queryStr, ...filtered].slice(0, 6);
    });
  };

  const clearRecentSearches = () => {
    setRecentSearchesState([]);
  };

  // Auth User Tracking & Real-time Profile Listener
  const [authUid, setAuthUid] = useState<string | null>(null);

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      if (role === 'splash' && !auth.currentUser) {
        setRole('login');
      }
    }, 2000);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setAuthUid(firebaseUser.uid);
      } else {
        setAuthUid(null);
        setCurrentUser(null);
        if (role !== 'splash') {
          setRole('login');
        }
      }
    });

    return () => {
      clearTimeout(splashTimer);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authUid) {
      setCurrentUser(null);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'users', authUid), (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data() as User;
        setCurrentUser(userData);
        setRole(userData.role);
      } else {
        console.warn('User profile document not found in Firestore.');
        setCurrentUser(null);
        setRole('login');
      }
    });

    return unsubscribe;
  }, [authUid]);

  // Sync profile-level states
  useEffect(() => {
    if (currentUser) {
      setFavoriteStores(currentUser.favoriteStores || []);
      setFavoriteProducts(currentUser.favoriteProducts || []);
      setFollowedStores(currentUser.followedStores || []);
      setSavedAddresses(currentUser.savedAddresses || []);
      if (!currentUser.fcmToken) {
        fcmService.requestPermissionAndRegisterToken(currentUser.uid)
          .catch(err => console.error('FCM registration error:', err));
      }
    } else {
      setFavoriteStores([]);
      setFavoriteProducts([]);
      setFollowedStores([]);
      setSavedAddresses([]);
    }
  }, [currentUser]);


  // --- Cached Public Collections (No Real-Time Listeners to Save Reads) ---
  useEffect(() => {
    let mounted = true;
    
    const fetchPublicData = async () => {
      try {
        // 24 Hours TTL
        cacheService.fetchWithCache('categories', async () => {
          const snap = await getDocs(collection(db, 'categories'));
          return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }, 24 * 60 * 60 * 1000).then(data => mounted && setCategoriesState(data));

        // 12 Hours TTL
        cacheService.fetchWithCache('banners', async () => {
          const snap = await getDocs(collection(db, 'banners'));
          return snap.docs.map(d => ({ id: isNaN(Number(d.id)) ? d.id : Number(d.id), ...d.data() } as any));
        }, 12 * 60 * 60 * 1000).then(data => mounted && setBannersState(data));

        // 12 Hours TTL
        cacheService.fetchWithCache('platformSettings', async () => {
          const snap = await getDoc(doc(db, 'platformSettings', 'default'));
          return snap.exists() ? { ...DEFAULT_PLATFORM_SETTINGS, ...snap.data() } as PlatformSettings : DEFAULT_PLATFORM_SETTINGS;
        }, 12 * 60 * 60 * 1000).then(data => mounted && setPlatformSettings(data));

        // 12 Hours TTL
        cacheService.fetchWithCache('campaigns', async () => {
          const snap = await getDocs(collection(db, 'campaigns'));
          return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }, 12 * 60 * 60 * 1000).then(data => mounted && setCampaignsState(data));

        // 12 Hours TTL
        cacheService.fetchWithCache('coupons', async () => {
          const snap = await getDocs(collection(db, 'coupons'));
          return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        }, 12 * 60 * 60 * 1000).then(data => mounted && setCouponsState(data));

      } catch (err) {
        console.error('Error fetching public cached data:', err);
      }
    };

    fetchPublicData();
    return () => { mounted = false; };
  }, []);

  // --- Real-time Listeners for role-dependent collections ---
  useEffect(() => {
    if (!auth.currentUser || !currentUser) {
      setOrdersState([]);
      setNotificationsState([]);
      setWalletTransactionsState([]);
      setWalletSettlementsState([]);
      setReturnRequestsState([]);
      setPointsHistory([]);
      setReferrals([]);
      return;
    }

    try {
      // Dynamic orders query based on role rules
      let qOrders;
      if (currentUser.role === 'customer') {
        qOrders = query(collection(db, 'orders'), where('customerId', '==', currentUser.uid));
      } else if (currentUser.role === 'vendor' && currentUser.storeId) {
        qOrders = query(collection(db, 'orders'), where('shopId', '==', currentUser.storeId));
      } else {
        qOrders = query(collection(db, 'orders'));
      }

      const unsubOrders = onSnapshot(qOrders, snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrdersState(list);
      }, err => console.error('Orders listener error:', err));

      // Notifications specific to active user
      const qNotifs = query(collection(db, 'notifications'), where('userId', '==', currentUser.uid));
      const unsubNotifs = onSnapshot(qNotifs, snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotificationsState(list);
      }, err => console.error('Notifications listener error:', err));

      // Return requests specific to user/vendor
      let qReturns;
      if (currentUser.role === 'customer') {
        qReturns = query(collection(db, 'returnRequests'), where('customerId', '==', currentUser.uid));
      } else if (currentUser.role === 'vendor' && currentUser.storeId) {
        qReturns = query(collection(db, 'returnRequests'), where('storeId', '==', currentUser.storeId));
      } else {
        qReturns = query(collection(db, 'returnRequests'));
      }

      const unsubReturns = onSnapshot(qReturns, snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReturnRequestsState(list);
      }, err => console.error('ReturnRequests listener error:', err));

      // Vendor specific financial collections
      let unsubTx = () => {};
      let unsubSet = () => {};
      if (currentUser.storeId) {
        const qTx = query(collection(db, 'walletTransactions'), where('storeId', '==', currentUser.storeId));
        unsubTx = onSnapshot(qTx, snap => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setWalletTransactionsState(list);
        }, err => console.error('WalletTransactions listener error:', err));

        const qSet = query(collection(db, 'walletSettlements'), where('storeId', '==', currentUser.storeId));
        unsubSet = onSnapshot(qSet, snap => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setWalletSettlementsState(list);
        }, err => console.error('WalletSettlements listener error:', err));
      }

      // Points history specific to user
      const qPoints = query(collection(db, 'pointsHistory'), where('userId', '==', currentUser.uid));
      const unsubPoints = onSnapshot(qPoints, snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPointsHistory(list);
      }, err => console.error('PointsHistory listener error:', err));

      // Referrals where user is inviter
      const qReferrals = query(collection(db, 'referrals'), where('referrerId', '==', currentUser.uid));
      const unsubReferrals = onSnapshot(qReferrals, snap => {
        setReferrals(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
      }, err => console.error('Referrals listener error:', err));

      // Admin or specific role restricted listeners
      let unsubMetrics = () => {};
      let unsubMovements = () => {};
      let unsubDrivers = () => {};

      if (currentUser.role === 'admin' || currentUser.role === 'driver') {
        const qMetrics = query(collection(db, 'driverMetrics'));
        unsubMetrics = onSnapshot(qMetrics, snap => {
          const record: Record<string, DriverMetrics> = {};
          snap.docs.forEach(d => { record[d.id] = d.data() as DriverMetrics; });
          setDriverMetricsState(record);
        }, err => console.error('DriverMetrics listener error:', err));
      }

      if (currentUser.role === 'admin' || currentUser.role === 'vendor') {
        const qMovements = currentUser.role === 'admin' 
          ? query(collection(db, 'stockMovements'))
          : query(collection(db, 'stockMovements'), where('storeId', '==', currentUser.storeId));
        unsubMovements = onSnapshot(qMovements, snap => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setStockMovements(list);
        }, err => console.error('StockMovements listener error:', err));
      }

      if (currentUser.role === 'admin') {
        const qDrivers = query(collection(db, 'users'), where('role', '==', 'driver'));
        unsubDrivers = onSnapshot(qDrivers, snap => {
          setDriversState(snap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name,
              phone: data.phone || '',
              vehicleType: data.vehicleType || 'سكوتر',
              rating: data.rating || 5.0,
              isOnline: data.isOnline !== undefined ? data.isOnline : true,
              status: data.status || 'approved'
            };
          }));
        }, err => console.error('Drivers listener error:', err));
      }

      return () => {
        unsubOrders();
        unsubNotifs();
        unsubReturns();
        unsubTx();
        unsubSet();
        unsubPoints();
        unsubReferrals();
        unsubMetrics();
        unsubMovements();
        unsubDrivers();
      };
    } catch (err) {
      console.error('Error setting up protected listeners:', err);
      return () => {};
    }
  }, [auth.currentUser, currentUser]);

  // --- ACTIONS & MUTATORS ---

  const goHome = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
    setRole('login');
    setCurrentUser(null);
  };

  const showToast = (msg: string, type: ToastType = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => {
      const updated = [...prev, { id, message: msg, type }];
      if (updated.length > 3) return updated.slice(updated.length - 3);
      return updated;
    });
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const t = (key: string): string => {
    const dict = translations[lang] || translations['ar'];
    return dict[key] || key;
  };

  const isRTL = lang === 'ar';

  const setLang = (l: string) => {
    setLangState(l);
    localStorage.setItem('waslalink_lang', l);
    window.location.reload();
  };

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    localStorage.setItem('waslalink_theme', t);
  };

  const toggleTheme = () => {
    if (theme === 'orange') setTheme('midnight');
    else if (theme === 'midnight') setTheme('purple-glass');
    else setTheme('orange');
  };

  const toggleFavoriteStore = async (storeId: string) => {
    if (!currentUser) return;
    const isFav = favoriteStores.includes(storeId);
    const updated = isFav 
      ? favoriteStores.filter(id => id !== storeId)
      : [...favoriteStores, storeId];
    
    try {
      await userRepository.update(currentUser.uid, { favoriteStores: updated });
      showToast(isFav ? 'تم الإزالة من المفضلة' : 'تم الإضافة للمفضلة');
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFavoriteProduct = async (productId: string) => {
    if (!currentUser) return;
    const isFav = favoriteProducts.includes(productId);
    const updated = isFav 
      ? favoriteProducts.filter(id => id !== productId)
      : [...favoriteProducts, productId];
    
    try {
      await userRepository.update(currentUser.uid, { favoriteProducts: updated });
      showToast(isFav ? 'تم الإزالة من المفضلة' : 'تم الإضافة للمفضلة');
    } catch (err) {
      console.error(err);
    }
  };

  const addToCartGlobal = (product: any, shop: any, quantity: number = 1, isAbsolute: boolean = false) => {
    setCart(prev => {
      const items = [...prev.items];
      const existingItem = items.find(item => item.id === product.id);
      if (existingItem) {
        existingItem.quantity = isAbsolute ? quantity : existingItem.quantity + quantity;
      } else {
        items.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity,
          imgUrl: product.imgUrl,
          shopId: shop.id,
          shopName: shop.name
        });
      }
      return { items };
    });
    showToast(isRTL ? `تمت إضافة ${product.name} للسلة` : `Added ${product.name} to cart`);
  };

  const confirmClearCartAndAdd = () => {
    // Deprecated for multi-vendor
    setCartConflictAlert(null);
  };

  const cancelCartConflict = () => {
    setCartConflictAlert(null);
  };

  const toggleFollowStore = async (storeId: string) => {
    if (!currentUser) return;
    const isFollowing = followedStores.includes(storeId);
    const updated = isFollowing 
      ? followedStores.filter(id => id !== storeId)
      : [...followedStores, storeId];
    
    try {
      await userRepository.update(currentUser.uid, { followedStores: updated });
      await storeRepository.update(storeId, { followersCount: increment(isFollowing ? -1 : 1) });
      showToast(isFollowing ? (lang === 'ar' ? 'تم إلغاء المتابعة' : 'Unfollowed store') : (lang === 'ar' ? 'تم متابعة المتجر' : 'Following store'));
    } catch (err) {
      console.error(err);
    }
  };

  const addAddress = async (addr: Omit<EgyptianAddress, 'id'>) => {
    if (!currentUser) return;
    const newAddr: EgyptianAddress = { ...addr, id: `addr_${Date.now()}` };
    const updated = newAddr.isDefault 
      ? savedAddresses.map(a => ({ ...a, isDefault: false })).concat(newAddr)
      : [...savedAddresses, newAddr];

    try {
      await userRepository.update(currentUser.uid, { savedAddresses: updated });
      showToast('تم إضافة العنوان بنجاح');
    } catch (err) {
      console.error(err);
    }
  };

  const editAddress = async (id: string, updatedFields: Partial<EgyptianAddress>) => {
    if (!currentUser) return;
    const updated = savedAddresses.map(addr => {
      if (addr.id === id) return { ...addr, ...updatedFields };
      if (updatedFields.isDefault) return { ...addr, isDefault: false };
      return addr;
    });

    try {
      await userRepository.update(currentUser.uid, { savedAddresses: updated });
      showToast('تم تعديل العنوان بنجاح');
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!currentUser) return;
    const updated = savedAddresses.filter(addr => addr.id !== id);
    try {
      await userRepository.update(currentUser.uid, { savedAddresses: updated });
      showToast('تم حذف العنوان');
    } catch (err) {
      console.error(err);
    }
  };

  const setDefaultAddress = async (id: string) => {
    if (!currentUser) return;
    const updated = savedAddresses.map(addr => ({ ...addr, isDefault: addr.id === id }));
    try {
      await userRepository.update(currentUser.uid, { savedAddresses: updated });
      const target = savedAddresses.find(a => a.id === id);
      if (target) {
        const details = `${target.governorate}، ${target.center}، ${target.village}، ${target.street}، عمارة ${target.building}`;
        const mappedCoords = target.gpsCoords
          ? { lat: target.gpsCoords.latitude, lng: target.gpsCoords.longitude, accuracy: target.gpsCoords.accuracy }
          : null;
        updateLocationPersistent({ name: details, coords: mappedCoords, isVerified: true });
      }
      showToast('تم تعيين كعنوان افتراضي للتوصيل');
    } catch (err) {
      console.error(err);
    }
  };

  const updateLocationPersistent = (loc: LocationState) => {
    setLocation(loc);
    localStorage.setItem('waslalink_loc', JSON.stringify(loc));
  };

  const addStockMovement = async (productId: string, quantity: number, type: StockMovement['type'], reason: string) => {
    const prodRef = doc(db, 'products', productId);
    const prodSnap = await getDoc(prodRef);
    if (!prodSnap.exists()) return;
    const prod = prodSnap.data() as Product;

    const newMovement: StockMovement = {
      id: `m_${Date.now()}`,
      productId,
      productName: prod.name,
      storeId: prod.storeId,
      quantity,
      type,
      reason,
      createdAt: new Date().toISOString()
    };

    const newStock = Math.max(0, (prod.currentStock || 0) + quantity);
    let availStatus = 'in_stock';
    if (newStock === 0) availStatus = 'out_of_stock';
    else if (newStock <= (prod.lowStockThreshold || 10)) availStatus = 'low_stock';

    try {
      await import('../services/shared/app.service').then(m => m.appService.addStockMovement(newMovement, prodRef.id, newStock, availStatus));
    } catch (err) {
      console.error(err);
    }
  };

  const createReturnRequest = async (req: Omit<ReturnRequest, 'id' | 'status' | 'timeline' | 'createdAt' | 'updatedAt'>) => {
    const id = `ret_${Date.now()}`;
    const newRequest: ReturnRequest = {
      ...req,
      id,
      status: 'submitted',
      timeline: [{ status: 'submitted', note: 'تم تقديم طلب المرتجع من العميل بانتظار مراجعة التاجر', createdAt: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await import('../services/shared/app.service').then(m => m.appService.submitReturnRequest(id, newRequest));
      showToast('تم تقديم طلب المرتجع بنجاح');
    } catch (err) {
      console.error(err);
    }
  };

  const updateReturnStatus = async (id: string, status: ReturnRequest['status'], note?: string) => {
    const reqRef = doc(db, 'returnRequests', id);
    try {
      const snap = await getDoc(reqRef);
      if (!snap.exists()) return;
      const reqData = snap.data() as ReturnRequest;
      const now = new Date().toISOString();
      const updatedTimeline = [...reqData.timeline, { status, note, createdAt: now }];

      const refundAmount = status === 'refunded' ? reqData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;
      await import('../services/shared/app.service').then(m => m.appService.confirmReturnRequest(id, reqData.orderId, { timeline: updatedTimeline, updatedAt: now, storeId: reqData.storeId }, status, refundAmount));

      showToast('تم تحديث حالة طلب المرتجع');
    } catch (err) {
      console.error(err);
    }
  };

  const addSettlement = async (amount: number, method: WalletSettlement['method'], details: string) => {
    if (!currentUser) return;
    const settleId = `set_${Date.now()}`;
    const newSet: WalletSettlement = {
      id: settleId,
      storeId: currentUser.storeId || 'g_1',
      amount,
      method,
      details,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    try {
      await import('../services/shared/app.service').then(m => m.appService.requestWalletSettlement(settleId, newSet));
      showToast(lang === 'ar' ? 'تم تقديم طلب السحب بنجاح' : 'Withdrawal request submitted');
    } catch (err) {
      console.error(err);
    }
  };

  const addReview = async (orderId: string, storeId: string, driverId: string, ratingStore: number, ratingDriver: number, ratingProducts: number, comment?: string) => {
    const reviewId = `rev_${Date.now()}`;
    const newReview: Review = {
      id: reviewId,
      orderId,
      storeId,
      driverId,
      ratingStore,
      ratingDriver,
      ratingProducts,
      comment,
      createdAt: new Date().toISOString()
    };

    try {
      await import('../services/shared/app.service').then(m => m.appService.submitReview(reviewId, newReview, orderId, ratingStore, ratingDriver, ratingProducts, comment));
      showToast(lang === 'ar' ? 'شكرًا لتقييمك!' : 'Thank you for your rating!');
    } catch (err) {
      console.error(err);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await import('../services/shared/app.service').then(m => m.appService.markNotificationRead(id));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await import('../services/shared/app.service').then(m => m.appService.markAllNotificationsRead(notifications.map(n => n.id)));
      showToast('تم تحديد الكل كمقروء');
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await import('../services/shared/app.service').then(m => m.appService.deleteNotification(id));
    } catch (err) {
      console.error(err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await import('../services/shared/app.service').then(m => m.appService.clearAllNotifications(notifications.map(n => n.id)));
      showToast('تم مسح جميع الإشعارات');
    } catch (err) {
      console.error(err);
    }
  };

  const updateDriverStatus = async (id: string, status: DriverDetail['status']) => {
    try {
      await userRepository.update(id, { status });
      showToast(lang === 'ar' ? 'تم تحديث حالة السائق' : 'Driver status updated');
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDriverOnline = async (id: string) => {
    const driver = drivers.find(d => d.id === id);
    if (!driver) return;
    try {
      await userRepository.update(id, { isOnline: !driver.isOnline });
    } catch (err) {
      console.error(err);
    }
  };

  const triggerOfferBroadcast = async (storeId: string, offerText: string, productId?: string) => {
    try {
      const storeRef = doc(db, 'stores', storeId);
      const storeDoc = await getDoc(storeRef);
      if (!storeDoc.exists()) return;
      const store = storeDoc.data();

      const campaignId = `camp_${Date.now()}`;
      await import('../services/shared/app.service').then(m => m.appService.addCampaign(campaignId, {
        id: campaignId,
        storeId,
        storeName: store.name || storeId,
        offerText,
        productId: productId || null,
        status: 'active',
        createdAt: new Date().toISOString()
      }));
      showToast(lang === 'ar' ? 'تم إرسال العرض للمتابعين' : 'Offer broadcasted to followers');
    } catch (err) {
      console.error(err);
    }
  };

  const triggerOrderUpdateBroadcast = async (orderId: string, status: string, orderData?: Order) => {
    let order = orderData;
    if (!order) {
      const snap = await getDoc(doc(db, 'orders', orderId));
      if (snap.exists()) order = snap.data() as Order;
    }
    if (!order) return;

    let titleAr = '';
    let titleEn = '';
    let descAr = '';
    let descEn = '';
    let shouldNotify = false;

    if (status === 'driver_assigned') {
      titleAr = `تم تعيين مندوب لطلبك ${orderId}`;
      titleEn = `Driver assigned to order ${orderId}`;
      descAr = `تم تعيين المندوب وجاري التوجه للمتجر.`;
      descEn = `A driver has been assigned and is heading to the store.`;
      shouldNotify = true;
    } else if (status === 'driver_accepted') {
      titleAr = `المندوب وافق على الطلب ${orderId}`;
      titleEn = `Driver accepted order ${orderId}`;
      descAr = `المندوب وافق على طلبك.`;
      descEn = `Driver accepted your order.`;
      shouldNotify = true;
    } else if (status === 'picked_up') {
      titleAr = `استلم المندوب طلبك ${orderId}`;
      titleEn = `Courier picked up order ${orderId}`;
      descAr = `قام المندوب باستلام طلبك من المتجر وهو في الطريق إليك.`;
      descEn = `Our delivery partner picked up your order from the store.`;
      shouldNotify = true;
    } else if (status === 'on_the_way') {
      titleAr = `طلبك ${orderId} اقترب منك 🚚`;
      titleEn = `Order ${orderId} is nearby 🚚`;
      descAr = `شحنتك قريبة جداً في الطريق إليك مع المندوب المعتمد.`;
      descEn = `Your shipment is nearby and on the way to your coordinates.`;
      shouldNotify = true;
    } else if (status === 'delivered') {
      titleAr = `تم تسليم طلبك ${orderId} بنجاح`;
      titleEn = `Order ${orderId} delivered successfully`;
      descAr = `شكراً لتسوقك من وصلة لينك! نتمنى أن تكون سعيداً بتجربتك.`;
      descEn = `Thank you for shopping at WaslaLink! We hope you enjoyed your service.`;
      shouldNotify = true;
    } else if (status === 'failed_assignment') {
      titleAr = `فشل تعيين مندوب لطلبك ${orderId}`;
      titleEn = `Failed to assign driver for ${orderId}`;
      descAr = `عذراً، لا يوجد مناديب متاحين حالياً.`;
      descEn = `Sorry, no drivers available at the moment.`;
      shouldNotify = true;
    }

    if (shouldNotify) {
      const notifId = `n_order_${Date.now()}`;
      const newNotif: Notification = {
        id: notifId,
        title: { ar: titleAr, en: titleEn },
        description: { ar: descAr, en: descEn },
        type: status === 'on_the_way' || status === 'picked_up' ? 'delivery' : 'order',
        storeId: order.shopId || undefined,
        orderId,
        isRead: false,
        createdAt: new Date().toISOString()
      };

      try {
        await import('../services/shared/app.service').then(m => m.appService.dispatchNotification(notifId, {
          ...newNotif,
          userId: order.customerId
        }));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const detectLocationGPS = (onSuccess?: (address: string) => void) => {
    if (!navigator.geolocation) {
      showToast(lang === 'ar' ? 'التحديد غير مدعوم في متصفحك' : 'Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=${lang}`)
          .then(res => res.json())
          .then(data => {
            const resolvedAddress = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            updateLocationPersistent({ name: resolvedAddress, coords: { lat: latitude, lng: longitude }, isVerified: true });
            showToast(lang === 'ar' ? 'تم تحديد موقعك التلقائي' : 'Location resolved successfully');
            if (onSuccess) onSuccess(resolvedAddress);
          })
          .catch(() => {
            const fallbackStr = lang === 'ar' ? `إحداثيات (${latitude.toFixed(4)}, ${longitude.toFixed(4)})` : `Coordinates (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
            updateLocationPersistent({ name: fallbackStr, coords: { lat: latitude, lng: longitude }, isVerified: true });
            showToast(lang === 'ar' ? 'تم حفظ إحداثيات GPS' : 'GPS Coordinates saved');
            if (onSuccess) onSuccess(fallbackStr);
          });
      },
      (err) => {
        showToast(lang === 'ar' ? 'تم رفض الوصول للموقع' : 'Location permission denied');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const updateOrderStatus = async (orderId: string, status: Order['status'], driverId?: string, driverName?: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) return;
      const order = orderSnap.data() as Order;
      await import('../services/shared/app.service').then(m => m.appService.updateOrderStatus(orderId, status, driverId, driverName, order, auth.currentUser?.uid));
      await triggerOrderUpdateBroadcast(orderId, status, order);
    } catch (err) {
      console.error(err);
    }
  };

  const updatePlatformSettings = async (newSettings: PlatformSettings) => {
    try {
      await platformSettingsRepository.create('default', newSettings);
      setPlatformSettings(newSettings);
      showToast(isRTL ? 'تم تحديث إعدادات المنصة بنجاح' : 'Platform configurations updated successfully');
    } catch (err) {
      console.error('Error updating platform settings:', err);
      showToast(isRTL ? 'فشل تحديث إعدادات المنصة' : 'Failed to update platform configurations');
    }
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t,
        isRTL,
        role,
        setRole,
        currentUser,
        setCurrentUser,
        categories,
        banners,
        orders,
        cart,
        setCart,
        cartConflictAlert,
        setCartConflictAlert,
        addToCartGlobal,
        confirmClearCartAndAdd,
        cancelCartConflict,
        location,
        setLocation: updateLocationPersistent,
        toasts,
        showToast,
        removeToast,
        goHome,
        favoriteStores,
        toggleFavoriteStore,
        favoriteProducts,
        toggleFavoriteProduct,
        stockMovements,
        addStockMovement,
        
        theme,
        setTheme,
        toggleTheme,

        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        clearAllNotifications,

        coupons,
        activeCoupon,
        setActiveCoupon,

        savedAddresses,
        addAddress,
        editAddress,
        deleteAddress,
        setDefaultAddress,

        returnRequests,
        createReturnRequest,
        updateReturnStatus,

        driverMetrics,

        followedStores,
        toggleFollowStore,

        recentSearches,
        addRecentSearch,
        clearRecentSearches,

        showSearch,
        setShowSearch,
        showMap,
        setShowMap,
        showNotifications,
        setShowNotifications,

        triggerOfferBroadcast,
        triggerOrderUpdateBroadcast,

        detectLocationGPS,

        drivers,
        updateDriverStatus,
        toggleDriverOnline,

        updateOrderStatus,

        walletTransactions,
        walletSettlements,
        addSettlement,

        addReview,

        campaigns,
        pointsHistory,
        referrals,
        platformSettings,
        updatePlatformSettings
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
export { AppContext };
