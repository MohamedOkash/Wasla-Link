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
import { DeliveryFeeConfig, DEFAULT_DELIVERY_FEE_CONFIG } from '../services/deliveryFee.service';
import { fcmService } from '../services/fcm.service';
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
  increment
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../services/firebase';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imgUrl: string;
}

export interface Cart {
  shopId: string | null;
  shopName: string;
  items: CartItem[];
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
  stores: Store[];
  setStores: React.Dispatch<React.SetStateAction<Store[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: any[];
  setCategories: React.Dispatch<React.SetStateAction<any[]>>;
  banners: Banner[];
  setBanners: React.Dispatch<React.SetStateAction<Banner[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  cart: Cart;
  setCart: React.Dispatch<React.SetStateAction<Cart>>;
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
  
  theme: 'orange' | 'midnight';
  setTheme: (t: 'orange' | 'midnight') => void;
  toggleTheme: () => void;

  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;

  coupons: Coupon[];
  setCoupons: React.Dispatch<React.SetStateAction<Coupon[]>>;
  activeCoupon: Coupon | null;
  setActiveCoupon: (c: Coupon | null) => void;

  savedAddresses: EgyptianAddress[];
  addAddress: (addr: Omit<EgyptianAddress, 'id'>) => void;
  editAddress: (id: string, addr: Partial<EgyptianAddress>) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;

  returnRequests: ReturnRequest[];
  setReturnRequests: React.Dispatch<React.SetStateAction<ReturnRequest[]>>;
  createReturnRequest: (req: Omit<ReturnRequest, 'id' | 'status' | 'timeline' | 'createdAt' | 'updatedAt'>) => void;
  updateReturnStatus: (id: string, status: ReturnRequest['status'], note?: string) => void;

  driverMetrics: Record<string, DriverMetrics>;
  setDriverMetrics: React.Dispatch<React.SetStateAction<Record<string, DriverMetrics>>>;

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
  setDrivers: React.Dispatch<React.SetStateAction<DriverDetail[]>>;
  updateDriverStatus: (id: string, status: DriverDetail['status']) => void;
  toggleDriverOnline: (id: string) => void;

  updateOrderStatus: (orderId: string, status: Order['status'], driverId?: string, driverName?: string) => void;

  walletTransactions: WalletTransaction[];
  walletSettlements: WalletSettlement[];
  addSettlement: (amount: number, method: WalletSettlement['method'], details: string) => void;

  reviews: Review[];
  addReview: (orderId: string, storeId: string, driverId: string, ratingStore: number, ratingDriver: number, ratingProducts: number, comment?: string) => void;

  campaigns: any[];
  setCampaigns: React.Dispatch<React.SetStateAction<any[]>>;
  pointsHistory: PointsHistoryEntry[];
  referrals: Referral[];
  deliveryFeeConfig: DeliveryFeeConfig | null;
  updateDeliveryFeeConfig: (config: DeliveryFeeConfig) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState(() => localStorage.getItem('waslalink_lang') || 'ar');
  const [role, setRole] = useState('splash');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Real-time Firestore synchronised states
  const [stores, setStoresState] = useState<Store[]>([]);
  const [products, setProductsState] = useState<Product[]>([]);
  const [categories, setCategoriesState] = useState<any[]>([]);
  const [banners, setBannersState] = useState<Banner[]>([]);
  const [orders, setOrdersState] = useState<Order[]>([]);
  const [coupons, setCouponsState] = useState<Coupon[]>([]);
  const [returnRequests, setReturnRequestsState] = useState<ReturnRequest[]>([]);
  const [notifications, setNotificationsState] = useState<Notification[]>([]);
  const [walletTransactions, setWalletTransactionsState] = useState<WalletTransaction[]>([]);
  const [walletSettlements, setWalletSettlementsState] = useState<WalletSettlement[]>([]);
  const [reviews, setReviewsState] = useState<Review[]>([]);
  const [drivers, setDriversState] = useState<DriverDetail[]>([]);
  const [campaigns, setCampaignsState] = useState<any[]>([]);
  const [driverMetrics, setDriverMetricsState] = useState<Record<string, DriverMetrics>>({});
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsHistoryEntry[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [deliveryFeeConfig, setDeliveryFeeConfig] = useState<DeliveryFeeConfig | null>(null);

  // User sub-collections states mapped from currentUser profile
  const [favoriteStores, setFavoriteStores] = useState<string[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<string[]>([]);
  const [followedStores, setFollowedStores] = useState<string[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<EgyptianAddress[]>([]);

  const [cart, setCart] = useState<Cart>(() => {
    try {
      const saved = localStorage.getItem('waslalink_cart');
      return saved ? JSON.parse(saved) : { shopId: null, shopName: '', items: [] };
    } catch {
      return { shopId: null, shopName: '', items: [] };
    }
  });
  const [location, setLocation] = useState<LocationState>(() => {
    const saved = localStorage.getItem('waslalink_loc');
    return saved ? JSON.parse(saved) : { name: '', coords: null, isVerified: false };
  });
  
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [theme, setThemeState] = useState<'orange' | 'midnight'>(() => {
    return (localStorage.getItem('waslalink_theme') as 'orange' | 'midnight') || 'orange';
  });

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

  // Sync Cart to LocalStorage
  useEffect(() => {
    localStorage.setItem('waslalink_cart', JSON.stringify(cart));
  }, [cart]);

  // Sync Cart to Firestore on Login/Logout
  useEffect(() => {
    if (!currentUser?.uid) return;
    
    const syncCartWithFirestore = async () => {
      try {
        const cartRef = doc(db, 'carts', currentUser.uid);
        const cartSnap = await getDoc(cartRef);
        
        if (cartSnap.exists()) {
          const remoteCart = cartSnap.data() as Cart;
          if (cart.items.length === 0 && remoteCart.items && remoteCart.items.length > 0) {
            setCart(remoteCart);
          } else if (cart.items.length > 0) {
            await setDoc(cartRef, { ...cart, userId: currentUser.uid, updatedAt: new Date().toISOString() }, { merge: true });
          }
        } else if (cart.items.length > 0) {
          await setDoc(cartRef, { ...cart, userId: currentUser.uid, updatedAt: new Date().toISOString() });
        }
      } catch (err) {
        console.error("Cart sync error", err);
      }
    };
    syncCartWithFirestore();
  }, [currentUser?.uid]);

  // Push Cart Updates to Firestore when logged in
  useEffect(() => {
    if (!currentUser?.uid) return;
    const timeout = setTimeout(async () => {
      try {
        if (cart.items.length === 0) {
          await deleteDoc(doc(db, 'carts', currentUser.uid));
        } else {
          await setDoc(doc(db, 'carts', currentUser.uid), {
            ...cart,
            userId: currentUser.uid,
            updatedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error("Error updating cart", err);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [cart, currentUser?.uid]);

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

  // Generic Firestore Sync Wrapper Generator (Client Writes -> Cloud Batch -> UI Updates via Snapshots)
  const createFirestoreSyncWrapper = <T extends { id: string | number }>(
    collectionName: string,
    currentState: T[]
  ) => {
    return async (value: React.SetStateAction<T[]>) => {
      let nextState: T[] = [];
      if (typeof value === 'function') {
        nextState = (value as Function)(currentState);
      } else {
        nextState = value;
      }

      const currentMap = new Map(currentState.map(item => [String(item.id), item]));
      const nextMap = new Map(nextState.map(item => [String(item.id), item]));

      const batch = writeBatch(db);
      let hasChanges = false;

      // Additions & Updates
      for (const item of nextState) {
        const idStr = String(item.id);
        const current = currentMap.get(idStr);
        if (!current || JSON.stringify(current) !== JSON.stringify(item)) {
          batch.set(doc(db, collectionName, idStr), item);
          hasChanges = true;
        }
      }

      // Deletions
      for (const item of currentState) {
        const idStr = String(item.id);
        if (!nextMap.has(idStr)) {
          batch.delete(doc(db, collectionName, idStr));
          hasChanges = true;
        }
      }

      if (hasChanges) {
        try {
          await batch.commit();
        } catch (err) {
          console.error(`Error committing batch sync for ${collectionName}:`, err);
        }
      }
    };
  };

  // Expose wrappers
  const setStores = createFirestoreSyncWrapper<Store>('stores', stores);
  const setProducts = createFirestoreSyncWrapper<Product>('products', products);
  const setCategories = createFirestoreSyncWrapper<any>('categories', categories);
  const setBanners = createFirestoreSyncWrapper<Banner>('banners', banners);
  const setOrders = createFirestoreSyncWrapper<Order>('orders', orders);
  const setCoupons = createFirestoreSyncWrapper<Coupon>('coupons', coupons);
  const setReturnRequests = createFirestoreSyncWrapper<ReturnRequest>('returnRequests', returnRequests);
  const setNotifications = createFirestoreSyncWrapper<Notification>('notifications', notifications);
  const setCampaigns = createFirestoreSyncWrapper<any>('campaigns', campaigns);

  const setDrivers = async (value: React.SetStateAction<DriverDetail[]>) => {
    let nextState: DriverDetail[] = [];
    if (typeof value === 'function') {
      nextState = (value as Function)(drivers);
    } else {
      nextState = value;
    }

    const currentMap = new Map(drivers.map(item => [item.id, item]));
    const batch = writeBatch(db);
    let hasChanges = false;

    for (const item of nextState) {
      const current = currentMap.get(item.id);
      if (!current || JSON.stringify(current) !== JSON.stringify(item)) {
        batch.set(doc(db, 'users', item.id), {
          role: 'driver',
          name: item.name,
          phone: item.phone,
          vehicleType: item.vehicleType,
          rating: item.rating,
          isOnline: item.isOnline,
          status: item.status
        }, { merge: true });
        hasChanges = true;
      }
    }

    if (hasChanges) {
      await batch.commit();
    }
  };

  const setDriverMetrics = async (value: React.SetStateAction<Record<string, DriverMetrics>>) => {
    let nextState: Record<string, DriverMetrics> = {};
    if (typeof value === 'function') {
      nextState = value(driverMetrics);
    } else {
      nextState = value;
    }

    const batch = writeBatch(db);
    let hasChanges = false;

    for (const [key, metrics] of Object.entries(nextState)) {
      const current = driverMetrics[key];
      if (!current || JSON.stringify(current) !== JSON.stringify(metrics)) {
        batch.set(doc(db, 'driverMetrics', key), metrics);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      await batch.commit();
    }
  };

  // --- Real-time Listeners for public marketplace collections ---
  useEffect(() => {
    try {
      const unsubCat = onSnapshot(collection(db, 'categories'), snap => {
        setCategoriesState(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, err => console.error('Categories listener error:', err));
      const unsubBanners = onSnapshot(collection(db, 'banners'), snap => {
        setBannersState(snap.docs.map(d => ({ id: isNaN(Number(d.id)) ? d.id : Number(d.id), ...d.data() } as any)));
      }, err => console.error('Banners listener error:', err));
      const unsubStores = onSnapshot(collection(db, 'stores'), snap => {
        setStoresState(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
      }, err => console.error('Stores listener error:', err));
      const unsubProducts = onSnapshot(collection(db, 'products'), snap => {
        setProductsState(snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            name: data.name || '',
            description: data.description || '',
            imageUrl: data.imageUrl || '',
            galleryImages: data.galleryImages || [],
            category: data.category || '',
            price: data.price || 0,
            stock: data.stock || 0,
            tags: data.tags || ''
          } as any;
        }));
      }, err => console.error('Products listener error:', err));
      const unsubCoupons = onSnapshot(collection(db, 'coupons'), snap => {
        setCouponsState(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
      }, err => console.error('Coupons listener error:', err));
      const unsubReviews = onSnapshot(collection(db, 'reviews'), snap => {
        setReviewsState(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
      }, err => console.error('Reviews listener error:', err));
      const unsubCampaigns = onSnapshot(collection(db, 'campaigns'), snap => {
        setCampaignsState(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, err => console.error('Campaigns listener error:', err));
      const unsubFees = onSnapshot(doc(db, 'config', 'deliveryFees'), snap => {
        if (snap.exists()) {
          setDeliveryFeeConfig(snap.data() as DeliveryFeeConfig);
        } else {
          setDeliveryFeeConfig(DEFAULT_DELIVERY_FEE_CONFIG);
        }
      }, err => console.error('DeliveryFees listener error:', err));

      return () => {
        unsubCat();
        unsubBanners();
        unsubStores();
        unsubProducts();
        unsubCoupons();
        unsubReviews();
        unsubCampaigns();
        unsubFees();
      };
    } catch (err) {
      console.error('Error setting up public listeners:', err);
      return () => {};
    }
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

  const setTheme = (t: 'orange' | 'midnight') => {
    setThemeState(t);
    localStorage.setItem('waslalink_theme', t);
  };

  const toggleTheme = () => {
    setTheme(theme === 'orange' ? 'midnight' : 'orange');
  };

  const toggleFavoriteStore = async (storeId: string) => {
    if (!currentUser) return;
    const isFav = favoriteStores.includes(storeId);
    const updated = isFav 
      ? favoriteStores.filter(id => id !== storeId)
      : [...favoriteStores, storeId];
    
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { favoriteStores: updated });
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
      await updateDoc(doc(db, 'users', currentUser.uid), { favoriteProducts: updated });
      showToast(isFav ? 'تم الإزالة من المفضلة' : 'تم الإضافة للمفضلة');
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFollowStore = async (storeId: string) => {
    if (!currentUser) return;
    const isFollowing = followedStores.includes(storeId);
    const updated = isFollowing 
      ? followedStores.filter(id => id !== storeId)
      : [...followedStores, storeId];
    
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { followedStores: updated });
      await updateDoc(doc(db, 'stores', storeId), { followersCount: increment(isFollowing ? -1 : 1) });
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
      await updateDoc(doc(db, 'users', currentUser.uid), { savedAddresses: updated });
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
      await updateDoc(doc(db, 'users', currentUser.uid), { savedAddresses: updated });
      showToast('تم تعديل العنوان بنجاح');
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!currentUser) return;
    const updated = savedAddresses.filter(addr => addr.id !== id);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { savedAddresses: updated });
      showToast('تم حذف العنوان');
    } catch (err) {
      console.error(err);
    }
  };

  const setDefaultAddress = async (id: string) => {
    if (!currentUser) return;
    const updated = savedAddresses.map(addr => ({ ...addr, isDefault: addr.id === id }));
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { savedAddresses: updated });
      const target = savedAddresses.find(a => a.id === id);
      if (target) {
        const details = `${target.governorate}، ${target.center}، ${target.village}، ${target.street}، عمارة ${target.building}`;
        updateLocationPersistent({ name: details, coords: target.gpsCoords || null, isVerified: true });
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
      const batch = writeBatch(db);
      batch.set(doc(db, 'stockMovements', newMovement.id), newMovement);
      batch.update(prodRef, { currentStock: newStock, availabilityStatus: availStatus });
      await batch.commit();
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
      await setDoc(doc(db, 'returnRequests', id), newRequest);
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

      const batch = writeBatch(db);
      batch.update(reqRef, { status, timeline: updatedTimeline, updatedAt: now });

      if (status === 'refunded') {
        const refundAmount = reqData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const txId = `tx_${Date.now()}`;
        batch.set(doc(db, 'walletTransactions', txId), {
          id: txId,
          storeId: reqData.storeId,
          amount: -refundAmount,
          type: 'refund',
          description: `مرتجع مبيعات طلب رقم ${reqData.orderId}`,
          createdAt: now,
          status: 'completed'
        });
      }
      await batch.commit();
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
      await setDoc(doc(db, 'walletSettlements', settleId), newSet);
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
      const batch = writeBatch(db);
      batch.set(doc(db, 'reviews', reviewId), newReview);
      batch.update(doc(db, 'orders', orderId), {
        ratingStore,
        ratingDriver,
        ratingProducts,
        ratingComment: comment
      });
      await batch.commit();
      showToast(lang === 'ar' ? 'شكرًا لتقييمك!' : 'Thank you for your rating!');
    } catch (err) {
      console.error(err);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { isRead: true });
      });
      await batch.commit();
      showToast('تم تحديد الكل كمقروء');
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      console.error(err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        batch.delete(doc(db, 'notifications', n.id));
      });
      await batch.commit();
      showToast('تم مسح جميع الإشعارات');
    } catch (err) {
      console.error(err);
    }
  };

  const updateDriverStatus = async (id: string, status: DriverDetail['status']) => {
    try {
      await updateDoc(doc(db, 'users', id), { status });
      showToast(lang === 'ar' ? 'تم تحديث حالة السائق' : 'Driver status updated');
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDriverOnline = async (id: string) => {
    const driver = drivers.find(d => d.id === id);
    if (!driver) return;
    try {
      await updateDoc(doc(db, 'users', id), { isOnline: !driver.isOnline });
    } catch (err) {
      console.error(err);
    }
  };

  const triggerOfferBroadcast = async (storeId: string, offerText: string, productId?: string) => {
    const store = stores.find(s => s.id === storeId);
    if (!store) return;

    try {
      const campaignId = `camp_${Date.now()}`;
      await setDoc(doc(db, 'campaigns', campaignId), {
        id: campaignId,
        storeId,
        storeName: store.name,
        offerText,
        productId: productId || null,
        status: 'active',
        createdAt: new Date().toISOString()
      });
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

    if (status === 'accepted') {
      titleAr = `تم قبول طلبك ${orderId}`;
      titleEn = `Order ${orderId} accepted`;
      descAr = `تم قبول طلبك من متجر ${order.shopName} وجاري تحضيره.`;
      descEn = `Your order at ${order.shopName} was accepted and is being prepared.`;
    } else if (status === 'preparing') {
      titleAr = `طلبك ${orderId} قيد التحضير`;
      titleEn = `Order ${orderId} is being prepared`;
      descAr = `يقوم متجر ${order.shopName} بتحضير وتعبئة سلتك الآن.`;
      descEn = `${order.shopName} is preparing and packaging your items now.`;
    } else if (status === 'readyForPickup') {
      titleAr = `طلبك ${orderId} جاهز للاستلام 📦`;
      titleEn = `Order ${orderId} is ready for pickup 📦`;
      descAr = `شحنتك معبأة وجاهزة بالكامل وبانتظار مندوب التوصيل.`;
      descEn = `Your package is ready and waiting for delivery courier to pick up.`;
    } else if (status === 'pickedUp') {
      titleAr = `استلم المندوب طلبك ${orderId}`;
      titleEn = `Courier picked up order ${orderId}`;
      descAr = `قام مندوب التوصيل باستلام الشحنة من المتجر.`;
      descEn = `Our delivery partner picked up your order from the store.`;
    } else if (status === 'onTheWay') {
      titleAr = `طلبك ${orderId} خرج للتوصيل 🛵`;
      titleEn = `Order ${orderId} is out for delivery 🛵`;
      descAr = `شحنتك في الطريق إليك مع مندوب التوصيل المعتمد.`;
      descEn = `Your shipment is on the way to your coordinates with our delivery agent.`;
    } else if (status === 'delivered') {
      titleAr = `تم تسليم طلبك ${orderId} بنجاح`;
      titleEn = `Order ${orderId} delivered successfully`;
      descAr = `شكراً لتسوقك من وصلة لينك! نتمنى أن تكون سعيداً بتجربتك.`;
      descEn = `Thank you for shopping at WaslaLink! We hope you enjoyed your service.`;
    } else if (status === 'cancelled') {
      titleAr = `تم إلغاء طلبك ${orderId}`;
      titleEn = `Order ${orderId} cancelled`;
      descAr = `تم إلغاء طلبك بالكامل. يمكنك مراجعة المتجر للتفاصيل.`;
      descEn = `Your order was fully cancelled. You can contact support for details.`;
    } else {
      titleAr = `تم تحديث حالة الطلب ${orderId}`;
      titleEn = `Order ${orderId} status updated`;
      descAr = `تحديث جديد للطلب من متجر ${order.shopName}.`;
      descEn = `New updates logged for your order by ${order.shopName}.`;
    }

    const notifId = `n_order_${Date.now()}`;
    const newNotif: Notification = {
      id: notifId,
      title: { ar: titleAr, en: titleEn },
      description: { ar: descAr, en: descEn },
      type: status === 'onTheWay' || status === 'pickedUp' ? 'delivery' : 'order',
      storeId: order.shopId || undefined,
      orderId,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'notifications', notifId), {
        ...newNotif,
        userId: order.customerId
      });
    } catch (err) {
      console.error(err);
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

      const batch = writeBatch(db);
      const updateData: any = { status };
      if (driverId) {
        updateData.driverId = driverId;
        updateData.driverName = driverName || '';
      }
      batch.update(orderRef, updateData);

      if (status === 'preparing') {
        for (const item of order.items) {
          const prodRef = doc(db, 'products', item.id);
          const prodSnap = await getDoc(prodRef);
          if (prodSnap.exists()) {
            const p = prodSnap.data();
            const currentStock = Math.max(0, (p.currentStock || 0) - item.quantity);
            const reservedStock = (p.reservedStock || 0) + item.quantity;
            let availStatus = 'in_stock';
            if (currentStock === 0) availStatus = 'out_of_stock';
            else if (currentStock <= (p.lowStockThreshold || 10)) availStatus = 'low_stock';
            batch.update(prodRef, { currentStock, reservedStock, availabilityStatus: availStatus });
          }
        }
      } else if (status === 'pickedUp') {
        for (const item of order.items) {
          const prodRef = doc(db, 'products', item.id);
          const prodSnap = await getDoc(prodRef);
          if (prodSnap.exists()) {
            const p = prodSnap.data();
            const reservedStock = Math.max(0, (p.reservedStock || 0) - item.quantity);
            batch.update(prodRef, { reservedStock });
            
            const movementId = `m_sale_${Date.now()}_${item.id}`;
            batch.set(doc(db, 'stockMovements', movementId), {
              id: movementId,
              productId: item.id,
              productName: item.name,
              storeId: order.shopId,
              quantity: -item.quantity,
              type: 'Sale',
              reason: `مبيعات للطلب ${orderId}`,
              createdAt: new Date().toISOString()
            });
          }
        }
      } else if (status === 'cancelled') {
        for (const item of order.items) {
          const prodRef = doc(db, 'products', item.id);
          const prodSnap = await getDoc(prodRef);
          if (prodSnap.exists()) {
            const p = prodSnap.data();
            const isReserved = (p.reservedStock || 0) >= item.quantity;
            const reservedStock = isReserved ? (p.reservedStock || 0) - item.quantity : (p.reservedStock || 0);
            const currentStock = isReserved ? (p.currentStock || 0) : (p.currentStock || 0) + item.quantity;
            let availStatus = 'in_stock';
            if (currentStock === 0) availStatus = 'out_of_stock';
            else if (currentStock <= (p.lowStockThreshold || 10)) availStatus = 'low_stock';
            batch.update(prodRef, { currentStock, reservedStock, availabilityStatus: availStatus });
          }
        }
      } else if (status === 'delivered') {
        const txId1 = `tx_${Date.now()}`;
        const saleTx: WalletTransaction = {
          id: txId1,
          storeId: order.shopId,
          amount: order.subtotal,
          type: 'sale',
          description: `مبيعات مكتملة للطلب ${orderId}`,
          createdAt: new Date().toISOString(),
          status: 'completed'
        };
        const txId2 = `tx_fee_${Date.now()}`;
        const deliveryTx: WalletTransaction = {
          id: txId2,
          storeId: order.shopId,
          amount: order.deliveryFee,
          type: 'delivery_fee',
          description: `رسوم توصيل للطلب ${orderId}`,
          createdAt: new Date().toISOString(),
          status: 'completed'
        };
        batch.set(doc(db, 'walletTransactions', txId1), saleTx);
        batch.set(doc(db, 'walletTransactions', txId2), deliveryTx);

        // Loyalty Engine points award (1 EGP spent = 1 Point)
        if (order.customerId) {
          const pointsEarned = Math.floor(order.subtotal || 0);
          if (pointsEarned > 0) {
            const pointsHistoryId = `${orderId}_${order.customerId}_earn`;
            const pointsSnap = await getDoc(doc(db, 'pointsHistory', pointsHistoryId));
            if (!pointsSnap.exists()) {
              batch.set(doc(db, 'pointsHistory', pointsHistoryId), {
                id: pointsHistoryId,
                userId: order.customerId,
                orderId: orderId,
                points: pointsEarned,
                type: 'earn',
                createdAt: new Date().toISOString()
              });
              batch.update(doc(db, 'users', order.customerId), {
                points: increment(pointsEarned)
              });
            }
          }
        }
      }

      await batch.commit();
      await triggerOrderUpdateBroadcast(orderId, status, order);
    } catch (err) {
      console.error(err);
    }
  };

  const updateDeliveryFeeConfig = async (newConfig: DeliveryFeeConfig) => {
    try {
      await setDoc(doc(db, 'config', 'deliveryFees'), newConfig);
      setDeliveryFeeConfig(newConfig);
      showToast(isRTL ? 'تم تحديث إعدادات التوصيل بنجاح' : 'Delivery configuration updated successfully');
    } catch (err) {
      console.error('Error updating delivery fee config:', err);
      showToast(isRTL ? 'فشل تحديث إعدادات التوصيل' : 'Failed to update delivery configuration');
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
        stores,
        setStores,
        products,
        setProducts,
        categories,
        setCategories,
        banners,
        setBanners,
        orders,
        setOrders,
        cart,
        setCart,
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
        setNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        clearAllNotifications,

        coupons,
        setCoupons,
        activeCoupon,
        setActiveCoupon,

        savedAddresses,
        addAddress,
        editAddress,
        deleteAddress,
        setDefaultAddress,

        returnRequests,
        setReturnRequests,
        createReturnRequest,
        updateReturnStatus,

        driverMetrics,
        setDriverMetrics,

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
        setDrivers,
        updateDriverStatus,
        toggleDriverOnline,

        updateOrderStatus,

        walletTransactions,
        walletSettlements,
        addSettlement,

        reviews,
        addReview,

        campaigns,
        setCampaigns,
        pointsHistory,
        referrals,
        deliveryFeeConfig,
        updateDeliveryFeeConfig
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
