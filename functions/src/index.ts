import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// ----------------------------------------------------
// UTILS & CONFIGURATION CORES
// ----------------------------------------------------

interface PlatformSettings {
  commissionPercent: number;
  driverBonusPercent: number;
  freeDeliveryEnabled: boolean;
  baseDeliveryFee: number;
  pricePerKm: number;
  minimumDeliveryFee: number;
  maximumDeliveryFee: number;
  peakHourMultiplier: number;
  nightMultiplier: number;
  holidayMultiplier: number;
  rainMultiplier: number;
  remoteAreaMultiplier: number;
  freeDeliveryThreshold: number;
  roadFactor: number;
  averageSpeed: number;
  nearbyStoreRadius: number;
  nearbyExtraFee: number;
  farStoreExtraFee: number;
  maximumDeliveryRadius: number;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  commissionPercent: 10,
  driverBonusPercent: 0,
  freeDeliveryEnabled: false,
  baseDeliveryFee: 10,
  pricePerKm: 3,
  minimumDeliveryFee: 10,
  maximumDeliveryFee: 100,
  peakHourMultiplier: 5,
  nightMultiplier: 5,
  holidayMultiplier: 10,
  rainMultiplier: 15,
  remoteAreaMultiplier: 10,
  freeDeliveryThreshold: 250,
  roadFactor: 1.35,
  averageSpeed: 30,
  nearbyStoreRadius: 1,
  nearbyExtraFee: 0,
  farStoreExtraFee: 10,
  maximumDeliveryRadius: 15,
};

async function getPlatformSettings(): Promise<PlatformSettings> {
  const docSnap = await db.collection('platformSettings').doc('default').get();
  if (docSnap.exists) {
    return { ...DEFAULT_SETTINGS, ...docSnap.data() } as PlatformSettings;
  }
  return DEFAULT_SETTINGS;
}

async function getAdminSettings(): Promise<any> {
  const docSnap = await db.collection('adminSettings').doc('driver').get();
  const defaultSettings = {
    maxQueueSize: 3,
    dispatchRadius: 10, // km
    acceptTimeout: 30, // seconds
    locationInterval: 30, // seconds
    codLimit: 2000, // EGP
    withdrawalLimit: 1000, // EGP
    maxActiveOrders: 3,
    otpExpiration: 900, // 15 mins
    lateDeliveryThreshold: 45, // mins
    impossibleSpeedLimit: 120 // km/h
  };
  if (docSnap.exists) {
    return { ...defaultSettings, ...docSnap.data() };
  }
  return defaultSettings;
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function assignBestDriver(transaction: any, orderId: string, orderData: any, rejectedBy: string[]) {
  const settings = await getAdminSettings();
  
  const driversQuery = db.collection('drivers')
    .where('status', '==', 'approved');
  
  const driversSnap = await driversQuery.get();
  if (driversSnap.empty) {
    return null;
  }

  const storeCoords = orderData.location?.coords || null;
  const eligibleDrivers: any[] = [];

  for (const docSnap of driversSnap.docs) {
    const driverId = docSnap.id;
    if (rejectedBy && rejectedBy.includes(driverId)) {
      continue;
    }

    const dData = docSnap.data();
    // Ignore every state except available (Part 5)
    const availability = (dData.availability || '').toUpperCase();
    if (availability !== 'AVAILABLE') {
      continue;
    }

    const activeOrdersSnap = await db.collection('orders')
      .where('driverId', '==', driverId)
      .where('status', 'in', ['accepted', 'picked_up', 'on_the_way', 'delivering'])
      .get();
    
    const workload = activeOrdersSnap.size;
    if (workload >= settings.maxQueueSize) {
      continue;
    }

    let distance = 9999;
    const locRef = db.collection('driverLocations').doc(driverId);
    const locSnap = await transaction.get(locRef);
    if (locSnap.exists) {
      const locData = locSnap.data()!;
      if (locData.lat && locData.lng && storeCoords && storeCoords.lat && storeCoords.lng) {
        distance = calculateDistanceKm(locData.lat, locData.lng, storeCoords.lat, storeCoords.lng);
      }
    }

    if (distance > settings.dispatchRadius) {
      continue;
    }

    eligibleDrivers.push({
      id: driverId,
      name: dData.name,
      rating: dData.rating || 5.0,
      activeOrders: workload,
      distance
    });
  }

  if (eligibleDrivers.length === 0) {
    return null;
  }

  // Prioritize higher-rated drivers first (Part 2), then distance, then workload
  eligibleDrivers.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (a.distance !== b.distance) return a.distance - b.distance;
    return a.activeOrders - b.activeOrders;
  });

  return eligibleDrivers[0];
}

async function writeAuditLog(transaction: admin.firestore.Transaction, log: {
  action: string;
  collection: string;
  documentId: string;
  actor: string;
  oldValue: any;
  newValue: any;
  metadata?: any;
}) {
  const logRef = db.collection('securityLogs').doc();
  transaction.set(logRef, {
    ...log,
    id: logRef.id,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// ----------------------------------------------------
// PHASE M: CUSTOM CLAIMS
// ----------------------------------------------------

export const setUserRole = functions.https.onCall(async (data, context) => {
  if (!context.auth || (context.auth.token.role !== 'admin' && context.auth.token.admin !== true)) {
    throw new functions.https.HttpsError('permission-denied', 'Only administrators can assign user roles.');
  }

  const { uid, role } = data;
  if (!uid || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'Parameters "uid" and "role" are required.');
  }

  const allowedRoles = ['admin', 'vendor', 'driver', 'customer', 'superadmin'];
  if (!allowedRoles.includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', `Invalid role. Allowed: ${allowedRoles.join(', ')}`);
  }

  await admin.auth().setCustomUserClaims(uid, { role, [role]: true });

  const userRef = db.collection('users').doc(uid);
  await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const oldVal = userSnap.exists ? userSnap.data() : null;
    transaction.set(userRef, { role }, { merge: true });

    await writeAuditLog(transaction, {
      action: 'SET_USER_ROLE',
      collection: 'users',
      documentId: uid,
      actor: context.auth?.uid || 'system_admin',
      oldValue: oldVal,
      newValue: { role },
      metadata: { targetUid: uid }
    });
  });

  return { success: true, message: `Role "${role}" successfully assigned to user ${uid}` };
});

// ----------------------------------------------------
// PHASE F: COUPONS ENGINE
// ----------------------------------------------------

function calculateCouponDiscount(
  coupon: any,
  subtotal: number,
  deliveryFee: number,
  cartItems: any[]
): number {
  if (coupon.discountType === 'free_delivery') {
    return deliveryFee;
  }
  if (coupon.discountType === 'fixed') {
    return Math.min(coupon.discountValue, subtotal);
  }
  if (coupon.discountType === 'buy_x_get_y') {
    if (!coupon.getXProductIds || !coupon.getQty || !cartItems) return 0;
    const yItemsInCart = cartItems.filter(item => coupon.getXProductIds.includes(item.id));
    let remainingGetQty = coupon.getQty;
    let discount = 0;
    const sortedYItems = [...yItemsInCart].sort((a, b) => a.price - b.price);
    for (const item of sortedYItems) {
      const qtyToDiscount = Math.min(item.quantity, remainingGetQty);
      discount += qtyToDiscount * item.price;
      remainingGetQty -= qtyToDiscount;
      if (remainingGetQty <= 0) break;
    }
    return discount;
  }
  
  const calculated = subtotal * (coupon.discountValue / 100);
  if (coupon.maxDiscount !== undefined) {
    return Math.min(calculated, coupon.maxDiscount);
  }
  return calculated;
}

// ----------------------------------------------------
// PHASE C & D: CHECKOUT ENGINE & PRICING
// ----------------------------------------------------

export const calculateOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const { cartItems, couponId, pointsToRedeem = 0, address } = data;
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0 || !address) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing parameters.');
  }

  const productIds = cartItems.map(item => item.id);
  const productSnaps = await Promise.all(
    productIds.map(id => db.collection('products').doc(id).get())
  );
  
  const itemsByStore: Record<string, any[]> = {};
  let totalSubtotal = 0;
  for (const item of cartItems) {
    const pSnap = productSnaps.find(snap => snap.id === item.id);
    if (!pSnap || !pSnap.exists) {
      throw new functions.https.HttpsError('not-found', `Product with ID ${item.id} not found.`);
    }
    const productData = pSnap.data()!;
    const storeId = productData.storeId;
    if (!storeId) continue;

    let unitPrice = productData.price;
    if (productData.isOffer && productData.offerType) {
      const val = productData.offerValue || 0;
      if (productData.offerType === 'percentage') {
        unitPrice = productData.price - (productData.price * (val / 100));
      } else if (productData.offerType === 'fixed') {
        unitPrice = Math.max(0, productData.price - val);
      }
    }
    totalSubtotal += unitPrice * item.quantity;

    if (!itemsByStore[storeId]) itemsByStore[storeId] = [];
    itemsByStore[storeId].push({ item, unitPrice });
  }

  const settings = await getPlatformSettings();
  const storeIds = Object.keys(itemsByStore);
  const storeSnaps = await Promise.all(storeIds.map(id => db.collection('stores').doc(id).get()));

  let totalDeliveryFee = 0;
  for (let idx = 0; idx < storeIds.length; idx++) {
    const storeSnap = storeSnaps[idx];
    if (!storeSnap.exists) continue;
    const storeData = storeSnap.data()!;
    
    let fee = storeData.fee || settings.baseDeliveryFee;
    if (storeData.deliveryFees && storeData.deliveryFees[address.village] !== undefined) {
      fee = storeData.deliveryFees[address.village];
    }
    if (idx > 0) {
      fee = settings.nearbyExtraFee !== undefined ? settings.nearbyExtraFee : 5;
    }
    totalDeliveryFee += fee;
  }

  if (settings.freeDeliveryEnabled || (settings.freeDeliveryThreshold > 0 && totalSubtotal >= settings.freeDeliveryThreshold)) {
    totalDeliveryFee = 0;
  }

  let discount = 0;
  let activeCoupon = null;
  if (couponId) {
    const couponSnap = await db.collection('coupons').doc(couponId).get();
    if (couponSnap.exists) {
      const c = couponSnap.data()!;
      const now = new Date();
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      const isValid = c.isActive && now >= start && now <= end && (!c.usageLimit || c.usedCount < c.usageLimit) && totalSubtotal >= c.minOrder;
      
      if (isValid) {
        activeCoupon = { id: couponSnap.id, ...c };
        discount = calculateCouponDiscount(c, totalSubtotal, totalDeliveryFee, cartItems);
      }
    }
  }

  let pointsDiscount = 0;
  if (pointsToRedeem > 0) {
    const userSnap = await db.collection('users').doc(context.auth.uid).get();
    if (userSnap.exists) {
      const userPoints = userSnap.data()?.points || 0;
      const actualRedemption = Math.min(userPoints, pointsToRedeem);
      pointsDiscount = (actualRedemption / 100) * 5;
    }
  }

  const grandTotal = Math.max(0, totalSubtotal - discount - pointsDiscount) + totalDeliveryFee;

  return {
    subtotal: totalSubtotal,
    deliveryFee: totalDeliveryFee,
    discount: discount + pointsDiscount,
    pointsDiscount,
    grandTotal,
    activeCoupon
  };
});

export const createOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const customerId = context.auth.uid;
  const { cartItems, couponId, pointsToRedeem = 0, address, paymentMethod, paymentReceipt = null } = data;

  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0 || !address || !paymentMethod) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing details.');
  }

  const orderGroupId = db.collection('orderGroups').doc().id;

  await db.runTransaction(async (transaction) => {
    const userRef = db.collection('users').doc(customerId);
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'User profile not found.');
    }
    const userData = userSnap.data()!;
    const customerOrderNumber = (userData.totalOrders || 0) + 1;

    const productRefs = cartItems.map(item => db.collection('products').doc(item.id));
    const productSnaps = await Promise.all(productRefs.map(ref => transaction.get(ref)));

    const itemsByStore: Record<string, any[]> = {};
    for (let i = 0; i < cartItems.length; i++) {
      const item = cartItems[i];
      const pSnap = productSnaps[i];
      if (!pSnap.exists) {
        throw new functions.https.HttpsError('not-found', `Product ${item.id} not found.`);
      }
      const pData = pSnap.data()!;
      const storeId = pData.storeId;
      if (!storeId) {
        throw new functions.https.HttpsError('failed-precondition', `Product ${item.id} is missing storeId.`);
      }

      const availableStock = pData.currentStock || 0;
      if (availableStock < item.quantity) {
        throw new functions.https.HttpsError('resource-exhausted', `Product "${pData.name}" has insufficient stock.`);
      }

      let unitPrice = pData.price;
      if (pData.isOffer && pData.offerType) {
        const val = pData.offerValue || 0;
        if (pData.offerType === 'percentage') {
          unitPrice = pData.price - (pData.price * (val / 100));
        } else if (pData.offerType === 'fixed') {
          unitPrice = Math.max(0, pData.price - val);
        }
      }

      if (!itemsByStore[storeId]) {
        itemsByStore[storeId] = [];
      }
      itemsByStore[storeId].push({
        item,
        pData,
        pRef: productRefs[i],
        unitPrice
      });
    }

    const settings = await getPlatformSettings();

    let totalSubtotal = 0;
    const storeCalculations: Record<string, { subtotal: number; deliveryFee: number; storeRef: admin.firestore.DocumentReference; storeData: any }> = {};

    const storeIds = Object.keys(itemsByStore);
    const storeRefs = storeIds.map(id => db.collection('stores').doc(id));
    const storeSnaps = await Promise.all(storeRefs.map(ref => transaction.get(ref)));

    for (let idx = 0; idx < storeIds.length; idx++) {
      const storeId = storeIds[idx];
      const storeSnap = storeSnaps[idx];
      if (!storeSnap.exists) {
        throw new functions.https.HttpsError('not-found', `Store ${storeId} not found.`);
      }
      const storeData = storeSnap.data()!;
      
      const storeItems = itemsByStore[storeId];
      const storeSubtotal = storeItems.reduce((sum, entry) => sum + entry.unitPrice * entry.item.quantity, 0);
      totalSubtotal += storeSubtotal;

      let fee = storeData.fee || settings.baseDeliveryFee;
      if (storeData.deliveryFees && storeData.deliveryFees[address.village] !== undefined) {
        fee = storeData.deliveryFees[address.village];
      }
      if (idx > 0) {
        fee = settings.nearbyExtraFee !== undefined ? settings.nearbyExtraFee : 5;
      }
      
      storeCalculations[storeId] = {
        subtotal: storeSubtotal,
        deliveryFee: fee,
        storeRef: storeRefs[idx],
        storeData
      };
    }

    let totalDeliveryFee = Object.values(storeCalculations).reduce((sum, calc) => sum + calc.deliveryFee, 0);
    if (settings.freeDeliveryEnabled || (settings.freeDeliveryThreshold > 0 && totalSubtotal >= settings.freeDeliveryThreshold)) {
      totalDeliveryFee = 0;
      for (const storeId of storeIds) {
        storeCalculations[storeId].deliveryFee = 0;
      }
    }

    let totalDiscount = 0;
    if (couponId) {
      const couponRef = db.collection('coupons').doc(couponId);
      const couponSnap = await transaction.get(couponRef);
      if (couponSnap.exists) {
        const c = couponSnap.data()!;
        const now = new Date();
        const start = new Date(c.startDate);
        const end = new Date(c.endDate);
        if (c.isActive && now >= start && now <= end && (!c.usageLimit || (c.usedCount || 0) < c.usageLimit) && totalSubtotal >= c.minOrder) {
          totalDiscount = calculateCouponDiscount(c, totalSubtotal, totalDeliveryFee, cartItems);
          transaction.update(couponRef, { usedCount: (c.usedCount || 0) + 1 });
        }
      }
    }

    let pointsDiscount = 0;
    const currentPoints = userData.points || 0;
    if (pointsToRedeem > 0 && currentPoints >= pointsToRedeem) {
      pointsDiscount = (pointsToRedeem / 100) * 5;
      transaction.update(userRef, { points: currentPoints - pointsToRedeem });

      const pointHistRef = db.collection('pointsHistory').doc(`${orderGroupId}_redeem`);
      transaction.set(pointHistRef, {
        id: pointHistRef.id,
        userId: customerId,
        orderId: orderGroupId,
        points: pointsToRedeem,
        type: 'redeem',
        createdAt: new Date().toISOString()
      });
    }

    const totalCombinedDiscount = totalDiscount + pointsDiscount;
    const grandTotal = Math.max(0, totalSubtotal - totalCombinedDiscount) + totalDeliveryFee;
    const initialStatus = paymentMethod === 'cash_on_delivery' ? 'new' : 'pendingVerification';

    const systemCounterRef = db.collection('system').doc('counters');
    const counterSnap = await transaction.get(systemCounterRef);
    let globalOrderNumber = 1;
    if (counterSnap.exists) {
      globalOrderNumber = (counterSnap.data()?.globalOrders || 0) + 1;
      transaction.update(systemCounterRef, { globalOrders: globalOrderNumber });
    } else {
      transaction.set(systemCounterRef, { globalOrders: 1 });
    }

    const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();

    const childOrderIds: string[] = [];
    for (const storeId of storeIds) {
      const calc = storeCalculations[storeId];
      const storeItems = itemsByStore[storeId];

      const storeDiscountShare = totalSubtotal > 0 ? (calc.subtotal / totalSubtotal) * totalCombinedDiscount : 0;
      const storeTotal = Math.max(0, calc.subtotal + calc.deliveryFee - storeDiscountShare);

      const childOrderId = db.collection('orders').doc().id;
      childOrderIds.push(childOrderId);

      const storeOrderNumber = (calc.storeData.totalOrders || 0) + 1;
      transaction.update(calc.storeRef, { totalOrders: storeOrderNumber });

      const orderItemsList = storeItems.map(entry => {
        transaction.update(entry.pRef, {
          currentStock: (entry.pData.currentStock || 0) - entry.item.quantity,
          reservedStock: (entry.pData.reservedStock || 0) + entry.item.quantity
        });

        return {
          id: entry.item.id,
          name: entry.pData.name,
          price: entry.unitPrice,
          quantity: entry.item.quantity,
          imgUrl: entry.pData.imgUrl || null
        };
      });

      let orderStatus = initialStatus;
      let assignedDriverId = null;
      let driverName = null;

      if (initialStatus === 'new') {
        const bestDriver = await assignBestDriver(transaction, childOrderId, {
          location: {
            coords: address.gpsCoords || null
          }
        }, []);
        
        if (bestDriver) {
          orderStatus = 'driver_assigned';
          assignedDriverId = bestDriver.id;
          driverName = bestDriver.name;

          const driverRef = db.collection('drivers').doc(bestDriver.id);
          transaction.update(driverRef, {
            availability: 'busy',
            currentOrderId: childOrderId
          });
        }
      }

      const childOrderRef = db.collection('orders').doc(childOrderId);
      transaction.set(childOrderRef, {
        id: childOrderId,
        groupId: orderGroupId,
        shopId: storeId,
        shopName: calc.storeData.name,
        vendorId: calc.storeData.vendorId || '',
        customerId,
        customerName: userData.name || 'عميل تجريبي',
        items: orderItemsList,
        subtotal: calc.subtotal,
        deliveryFee: calc.deliveryFee,
        discount: storeDiscountShare,
        total: storeTotal,
        location: {
          name: `${address.governorate}، ${address.center}، ${address.village}، ${address.street}`,
          coords: address.gpsCoords || null,
          isVerified: true
        },
        status: orderStatus,
        assignedDriverId,
        driverId: assignedDriverId,
        driverName,
        deliveryOtp,
        createdAt: new Date().toISOString(),
        storeOrderNumber,
        customerOrderNumber,
        globalOrderNumber,
        invoiceId: `S${storeOrderNumber}-C${customerOrderNumber}`
      });
    }

    const orderGroupRef = db.collection('orderGroups').doc(orderGroupId);
    transaction.set(orderGroupRef, {
      id: orderGroupId,
      customerId,
      customerName: userData.name || 'عميل تجريبي',
      subtotal: totalSubtotal,
      deliveryFee: totalDeliveryFee,
      discount: totalCombinedDiscount,
      pointsRedeemed: pointsToRedeem,
      pointsDiscount,
      total: grandTotal,
      paymentMethod,
      paymentReceipt,
      location: {
        name: `${address.governorate}، ${address.center}، ${address.village}، ${address.street}`,
        coords: address.gpsCoords || null,
        isVerified: true
      },
      status: initialStatus,
      deliveryOtp,
      createdAt: new Date().toISOString(),
      customerOrderNumber,
      globalOrderNumber,
      childOrderIds
    });

    transaction.update(userRef, { totalOrders: customerOrderNumber });

    await writeAuditLog(transaction, {
      action: 'PLACE_MULTI_ORDER',
      collection: 'orderGroups',
      documentId: orderGroupId,
      actor: customerId,
      oldValue: null,
      newValue: { orderGroupId, childOrderIds, total: grandTotal }
    });
  });

  return { success: true, orderGroupId };
});

// ----------------------------------------------------
// PHASE J: ORDER STATE MACHINE
// ----------------------------------------------------

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  'new': ['pending', 'cancelled', 'rejected'],
  'pendingVerification': ['new', 'cancelled', 'rejected'],
  'pending': ['accepted', 'cancelled', 'rejected'],
  'accepted': ['preparing', 'cancelled'],
  'preparing': ['ready', 'cancelled'],
  'ready': ['picked_up'],
  'picked_up': ['delivering'],
  'delivering': ['delivered', 'returned'],
  'delivered': ['completed'],
  'completed': [],
  'cancelled': [],
  'rejected': [],
  'returned': ['refunded'],
  'refunded': []
};

export const updateOrderStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const { orderId, nextStatus, driverId = null, driverName = null } = data;
  if (!orderId || !nextStatus) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing parameters.');
  }

  const actorId = context.auth.uid;
  const orderRef = db.collection('orders').doc(orderId);

  await db.runTransaction(async (transaction) => {
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Order not found.');
    }
    const orderData = orderSnap.data()!;
    const currentStatus = orderData.status || 'new';

    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new functions.https.HttpsError('failed-precondition', `Invalid state transition from ${currentStatus} to ${nextStatus}.`);
    }

    if (nextStatus === 'delivered') {
      const submittedOtp = data.otp;
      const actualOtp = orderData.deliveryOtp;
      if (actualOtp && submittedOtp !== actualOtp) {
        throw new functions.https.HttpsError('failed-precondition', 'Invalid verification OTP code. Delivery rejected.');
      }

      const signatureUrl = data.signatureUrl;
      const deliveryPhotoUrl = data.deliveryPhotoUrl;
      if (!signatureUrl || !deliveryPhotoUrl) {
        throw new functions.https.HttpsError('failed-precondition', 'Customer signature and delivery photo evidence are required.');
      }

      const customerCoords = orderData.location?.coords || null;
      if (customerCoords && customerCoords.lat && customerCoords.lng) {
        const activeDrvId = driverId || orderData.driverId || '';
        if (activeDrvId) {
          const locRef = db.collection('driverLocations').doc(activeDrvId);
          const locSnap = await transaction.get(locRef);
          if (locSnap.exists) {
            const locData = locSnap.data()!;
            if (locData.lat && locData.lng) {
              const distKm = calculateDistanceKm(locData.lat, locData.lng, customerCoords.lat, customerCoords.lng);
              if (distKm > 0.3) {
                const incidentRef = db.collection('fraudIncidents').doc();
                transaction.set(incidentRef, {
                  id: incidentRef.id,
                  driverId: activeDrvId,
                  type: 'fake_gps',
                  details: `Driver completed order at a distance of ${(distKm * 1000).toFixed(0)}m from the customer location.`,
                  timestamp: new Date().toISOString()
                });
                throw new functions.https.HttpsError('failed-precondition', 'GPS mismatch. You must be near the customer location to complete delivery.');
              }
            }
          }
        }
      }
    }

    const updates: any = {
      status: nextStatus,
      updatedAt: new Date().toISOString()
    };

    if (nextStatus === 'delivered') {
      updates.signatureUrl = data.signatureUrl || null;
      updates.deliveryPhotoUrl = data.deliveryPhotoUrl || null;
      updates.damagePhotoUrl = data.damagePhotoUrl || null;
      updates.deliveredAt = new Date().toISOString();
    }

    if (nextStatus === 'ready_for_delivery') {
      updates.driverId = null;
      updates.driverName = null;
      updates.assignedDriverId = null;
      const rejectedBy = orderData.rejectedBy || [];
      if (driverId && !rejectedBy.includes(driverId)) {
        rejectedBy.push(driverId);
        updates.rejectedBy = rejectedBy;
      }

      const bestDriver = await assignBestDriver(transaction, orderId, orderData, rejectedBy);
      if (bestDriver) {
        updates.status = 'driver_assigned';
        updates.assignedDriverId = bestDriver.id;
        updates.driverId = bestDriver.id;
        updates.driverName = bestDriver.name;

        const driverRef = db.collection('drivers').doc(bestDriver.id);
        transaction.update(driverRef, {
          availability: 'busy',
          currentOrderId: orderId
        });
      }
    } else if (driverId) {
      updates.driverId = driverId;
      updates.driverName = driverName || '';
    }

    transaction.update(orderRef, updates);

    const actorSnap = await transaction.get(db.collection('users').doc(actorId));
    const actorData = actorSnap.exists ? actorSnap.data() || {} : {};
    const actorRole = actorData.role || 'customer';
    const actorName = actorData.name || 'User';

    let gpsCoords = data.coords || null;
    if (!gpsCoords && actorRole === 'driver') {
      const locSnap = await transaction.get(db.collection('driverLocations').doc(actorId));
      if (locSnap.exists) {
        const loc = locSnap.data() || {};
        gpsCoords = { lat: loc.lat, lng: loc.lng };
      }
    }

    const eventRef = db.collection('orders').doc(orderId).collection('timeline').doc();
    transaction.set(eventRef, {
      id: eventRef.id,
      status: nextStatus,
      timestamp: new Date().toISOString(),
      actor: actorName,
      actorRole: actorRole,
      GPS: gpsCoords,
      notes: data.notes || `Status changed from ${currentStatus} to ${nextStatus}`,
      deviceInfo: data.deviceInfo || null,
      batteryLevel: data.batteryLevel || null
    });

    if (nextStatus === 'picked_up') {
      for (const item of orderData.items) {
        const prodRef = db.collection('products').doc(item.id);
        const prodSnap = await transaction.get(prodRef);
        if (prodSnap.exists) {
          const p = prodSnap.data()!;
          const reservedStock = Math.max(0, (p.reservedStock || 0) - item.quantity);
          transaction.update(prodRef, { reservedStock });

          const movementRef = db.collection('stockMovements').doc();
          transaction.set(movementRef, {
            id: movementRef.id,
            productId: item.id,
            productName: item.name,
            storeId: orderData.shopId,
            quantity: -item.quantity,
            type: 'Sale',
            reason: `Bill sale for order ${orderId}`,
            createdAt: new Date().toISOString()
          });
        }
      }

      const activeDriverId = driverId || orderData.driverId;
      if (activeDriverId) {
        const groupRef = db.collection('orderGroups').doc(orderData.groupId || '');
        const groupSnap = await transaction.get(groupRef);
        if (groupSnap.exists && groupSnap.data()?.paymentMethod === 'cash_on_delivery') {
          const driverWalletRef = db.collection('driverWallets').doc(activeDriverId);
          const dWalletSnap = await transaction.get(driverWalletRef);
          const oldPending = dWalletSnap.exists ? (dWalletSnap.data()?.cashPending || 0) : 0;
          transaction.set(driverWalletRef, {
            cashPending: oldPending + (orderData.total || 0),
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      }
    } else if (nextStatus === 'cancelled' || nextStatus === 'rejected') {
      for (const item of orderData.items) {
        const prodRef = db.collection('products').doc(item.id);
        const prodSnap = await transaction.get(prodRef);
        if (prodSnap.exists) {
          const p = prodSnap.data()!;
          const isReserved = (p.reservedStock || 0) >= item.quantity;
          const reservedStock = isReserved ? (p.reservedStock || 0) - item.quantity : (p.reservedStock || 0);
          const currentStock = isReserved ? (p.currentStock || 0) : (p.currentStock || 0) + item.quantity;
          let availStatus = 'in_stock';
          if (currentStock === 0) availStatus = 'out_of_stock';
          else if (currentStock <= (p.lowStockThreshold || 10)) availStatus = 'low_stock';

          transaction.update(prodRef, {
            currentStock,
            reservedStock,
            availabilityStatus: availStatus
          });
        }
      }
    } else if (nextStatus === 'delivered') {
      const vendorWalletRef = db.collection('vendorWallets').doc(orderData.vendorId || actorId);
      const vWalletSnap = await transaction.get(vendorWalletRef);
      const vBalance = vWalletSnap.exists ? (vWalletSnap.data()?.balance || 0) : 0;
      
      const salesEarnings = orderData.subtotal || 0;
      transaction.set(vendorWalletRef, {
        balance: vBalance + salesEarnings,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      const vTxRef = db.collection('vendorTransactions').doc();
      transaction.set(vTxRef, {
        id: vTxRef.id,
        vendorId: orderData.vendorId,
        amount: salesEarnings,
        type: 'sale',
        description: `Sales revenue for order ${orderId}`,
        createdAt: new Date().toISOString(),
        status: 'completed'
      });

      const activeDriverId = driverId || orderData.driverId;
      if (activeDriverId) {
        const driverWalletRef = db.collection('driverWallets').doc(activeDriverId);
        const dWalletSnap = await transaction.get(driverWalletRef);
        const dBalance = dWalletSnap.exists ? (dWalletSnap.data()?.balance || 0) : 0;

        let isCod = false;
        const groupRef = db.collection('orderGroups').doc(orderData.groupId || '');
        const groupSnap = await transaction.get(groupRef);
        if (groupSnap.exists && groupSnap.data()?.paymentMethod === 'cash_on_delivery') {
          isCod = true;
        }

        const oldCollected = dWalletSnap.exists ? (dWalletSnap.data()?.cashCollected || 0) : 0;
        const oldRemaining = dWalletSnap.exists ? (dWalletSnap.data()?.cashRemaining || 0) : 0;
        const oldPending = dWalletSnap.exists ? (dWalletSnap.data()?.cashPending || 0) : 0;
        const cashAmt = isCod ? (orderData.total || 0) : 0;

        const distance = orderData.assignmentDistance || 3;
        let driverFee = 15;
        if (distance > 12) driverFee = 50;
        else if (distance > 8) driverFee = 35;
        else if (distance > 5) driverFee = 25;
        else if (distance > 3) driverFee = 20;

        transaction.set(driverWalletRef, {
          balance: dBalance + driverFee,
          cashCollected: oldCollected + cashAmt,
          cashRemaining: oldRemaining + cashAmt,
          cashPending: Math.max(0, oldPending - cashAmt),
          updatedAt: new Date().toISOString()
        }, { merge: true });

        const dTxRef = db.collection('driverTransactions').doc();
        transaction.set(dTxRef, {
          id: dTxRef.id,
          driverId: activeDriverId,
          amount: driverFee,
          type: 'delivery_fee',
          description: `Delivery fee for order ${orderId}`,
          createdAt: new Date().toISOString(),
          status: 'completed'
        });

        if (isCod) {
          const codTxRef = db.collection('driverTransactions').doc();
          transaction.set(codTxRef, {
            id: codTxRef.id,
            driverId: activeDriverId,
            amount: cashAmt,
            type: 'cod_collection',
            description: `Cash collected for COD order ${orderId}`,
            createdAt: new Date().toISOString(),
            status: 'completed'
          });
        }

        const driverRef = db.collection('drivers').doc(activeDriverId);
        const driverSnap = await transaction.get(driverRef);
        if (driverSnap.exists) {
          const dData = driverSnap.data()!;
          transaction.update(driverRef, {
            completedOrders: (dData.completedOrders || 0) + 1,
            totalDeliveries: (dData.totalDeliveries || 0) + 1,
            totalEarnings: (dData.totalEarnings || 0) + driverFee,
            availability: 'available',
            currentOrderId: null
          });
        }
      }

      if (orderData.customerId) {
        const customerPointsRef = db.collection('users').doc(orderData.customerId);
        const cPointsSnap = await transaction.get(customerPointsRef);
        if (cPointsSnap.exists) {
          const pointsEarned = Math.floor(salesEarnings);
          if (pointsEarned > 0) {
            const currentPoints = cPointsSnap.data()?.points || 0;
            transaction.update(customerPointsRef, { points: currentPoints + pointsEarned });

            const ptEarnRef = db.collection('pointsHistory').doc(`${orderId}_earn`);
            transaction.set(ptEarnRef, {
              id: ptEarnRef.id,
              userId: orderData.customerId,
              orderId,
              points: pointsEarned,
              type: 'earn',
              createdAt: new Date().toISOString()
            });
          }
        }
      }
    }

    await writeAuditLog(transaction, {
      action: 'UPDATE_ORDER_STATUS',
      collection: 'orders',
      documentId: orderId,
      actor: actorId,
      oldValue: { status: currentStatus },
      newValue: { status: nextStatus }
    });
  });

  return { success: true, nextStatus };
});

// ----------------------------------------------------
// SECURE INVENTORY MANAGEMENT (ADD/ADJUST STOCK)
// ----------------------------------------------------

export const updateProductStock = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const { productId, quantityChange, type = 'adjustment', reason = 'Manual Adjustment' } = data;
  if (!productId || quantityChange === undefined) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing fields.');
  }

  const actorId = context.auth.uid;
  const productRef = db.collection('products').doc(productId);

  await db.runTransaction(async (transaction) => {
    const prodSnap = await transaction.get(productRef);
    if (!prodSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Product not found.');
    }
    const pData = prodSnap.data()!;
    
    // Authorization check: User must be store vendor or admin
    const storeSnap = await db.collection('stores').doc(pData.storeId).get();
    if (!storeSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Store not found.');
    }
    const isOwner = storeSnap.data()?.vendorId === actorId;
    const isAdminUser = context.auth?.token?.role === 'admin' || context.auth?.token?.admin === true;
    if (!isOwner && !isAdminUser) {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized to manage this inventory.');
    }

    const currentStock = pData.currentStock || 0;
    const newStock = Math.max(0, currentStock + quantityChange);
    let availStatus = 'in_stock';
    if (newStock === 0) availStatus = 'out_of_stock';
    else if (newStock <= (pData.lowStockThreshold || 10)) availStatus = 'low_stock';

    transaction.update(productRef, {
      currentStock: newStock,
      availabilityStatus: availStatus
    });

    const movementRef = db.collection('stockMovements').doc();
    transaction.set(movementRef, {
      id: movementRef.id,
      productId,
      productName: pData.name,
      storeId: pData.storeId,
      quantity: quantityChange,
      type,
      reason,
      createdAt: new Date().toISOString()
    });

    await writeAuditLog(transaction, {
      action: 'STOCK_ADJUSTMENT',
      collection: 'products',
      documentId: productId,
      actor: actorId,
      oldValue: { currentStock },
      newValue: { currentStock: newStock }
    });
  });

  return { success: true };
});

// ----------------------------------------------------
// FIRESTORE TRIGGERS
// ----------------------------------------------------

// 1. Recalculate average rating of products, stores, drivers, and users when a review is created
export const onReviewCreated = functions.firestore
  .document('reviews/{reviewId}')
  .onCreate(async (snap) => {
    const reviewData = snap.data();
    if (!reviewData) return;

    const productId = reviewData.productId;
    const type = reviewData.type || '';
    const toId = reviewData.toId || '';

    // A. Product aggregation if productId is present
    if (productId) {
      const productRef = db.collection('products').doc(productId);
      await db.runTransaction(async (transaction) => {
        const reviewsSnap = await db.collection('reviews').where('productId', '==', productId).get();
        const ratingsList = reviewsSnap.docs.map(doc => doc.data().rating as number);
        const ratingsCount = ratingsList.length;
        const averageRating = parseFloat((ratingsList.reduce((sum, r) => sum + r, 0) / ratingsCount).toFixed(1));

        transaction.update(productRef, {
          averageRating,
          ratingsCount
        });
      });
    }

    // B. Entity aggregation (stores, drivers, users) based on review type (Part 2)
    if (toId && type) {
      let targetCollection = '';
      if (type === 'customer_to_store') {
        targetCollection = 'stores';
      } else if (type === 'customer_to_driver' || type === 'vendor_to_driver') {
        targetCollection = 'drivers';
      } else if (type === 'driver_to_customer') {
        targetCollection = 'users';
      }

      if (targetCollection) {
        const targetRef = db.collection(targetCollection).doc(toId);
        await db.runTransaction(async (transaction) => {
          const reviewsSnap = await db.collection('reviews')
            .where('toId', '==', toId)
            .where('type', '==', type)
            .get();
          const ratingsList = reviewsSnap.docs.map(doc => doc.data().rating as number);
          const ratingsCount = ratingsList.length;
          const averageRating = parseFloat((ratingsList.reduce((sum, r) => sum + r, 0) / ratingsCount).toFixed(2));

          transaction.update(targetRef, {
            averageRating,
            ratingCount: ratingsCount,
            rating: averageRating
          });

          // Also sync driver rating back to users collection
          if (targetCollection === 'drivers') {
            const userRef = db.collection('users').doc(toId);
            const userSnap = await transaction.get(userRef);
            if (userSnap.exists) {
              transaction.update(userRef, {
                rating: averageRating,
                averageRating,
                ratingCount: ratingsCount
              });
            }
          }
        });
      }
    }
  });

// 2. Automate wallet transaction when return request is marked refunded
export const onReturnRequestUpdated = functions.firestore
  .document('returnRequests/{reqId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check transition to refunded
    if (before.status !== 'refunded' && after.status === 'refunded') {
      const refundAmount = after.amount || 0;
      const storeId = after.storeId;
      const orderId = after.orderId || 'Unknown';

      if (refundAmount > 0 && storeId) {
        await db.runTransaction(async (transaction) => {
          const storeSnap = await db.collection('stores').doc(storeId).get();
          if (!storeSnap.exists) return;
          const vendorId = storeSnap.data()?.vendorId;
          if (!vendorId) return;

          const walletRef = db.collection('vendorWallets').doc(vendorId);
          const walletSnap = await transaction.get(walletRef);
          const currentBal = walletSnap.exists ? (walletSnap.data()?.balance || 0) : 0;

          // Deduct from vendor wallet
          transaction.set(walletRef, {
            balance: Math.max(0, currentBal - refundAmount),
            updatedAt: new Date().toISOString()
          }, { merge: true });

          // Log transaction
          const txRef = db.collection('walletTransactions').doc();
          transaction.set(txRef, {
            id: txRef.id,
            storeId,
            userId: vendorId,
            amount: -refundAmount,
            type: 'refund',
            description: `Refund for sales return order ${orderId}`,
            createdAt: new Date().toISOString(),
            status: 'completed'
          });

          await writeAuditLog(transaction, {
            action: 'RETURN_REFUND_WALLET_DEDUCTION',
            collection: 'vendorWallets',
            documentId: vendorId,
            actor: 'system_trigger',
            oldValue: { balance: currentBal },
            newValue: { balance: Math.max(0, currentBal - refundAmount) }
          });
        });
      }
    }
  });


export const approveDriver = functions.https.onCall(async (data, context) => {
  if (!context.auth || (context.auth.token.role !== 'admin' && context.auth.token.admin !== true)) {
    throw new functions.https.HttpsError('permission-denied', 'Only administrators can approve drivers.');
  }

  const { driverId, vehicleType } = data;
  if (!driverId || !vehicleType) {
    throw new functions.https.HttpsError('invalid-argument', 'Parameters "driverId" and "vehicleType" are required.');
  }

  await admin.auth().setCustomUserClaims(driverId, { role: 'driver', driver: true });

  await db.runTransaction(async (transaction) => {
    const userRef = db.collection('users').doc(driverId);
    const driverRef = db.collection('drivers').doc(driverId);

    const userSnap = await transaction.get(userRef);
    const driverSnap = await transaction.get(driverRef);

    const oldUser = userSnap.exists ? userSnap.data() : null;
    const oldDriver = driverSnap.exists ? driverSnap.data() : null;

    transaction.set(userRef, { role: 'driver', vehicleType }, { merge: true });
    transaction.set(driverRef, {
      status: 'approved',
      isApproved: true,
      isActive: true,
      availability: 'offline',
      updatedAt: new Date().toISOString()
    }, { merge: true });

    const dWalletRef = db.collection('driverWallets').doc(driverId);
    const dWalletSnap = await transaction.get(dWalletRef);
    if (!dWalletSnap.exists) {
      transaction.set(dWalletRef, {
        balance: 0,
        pendingBalance: 0,
        paidBalance: 0,
        updatedAt: new Date().toISOString()
      });
    }

    await writeAuditLog(transaction, {
      action: 'APPROVE_DRIVER',
      collection: 'drivers',
      documentId: driverId,
      actor: context.auth?.uid || 'admin',
      oldValue: { user: oldUser, driver: oldDriver },
      newValue: { status: 'approved', role: 'driver', vehicleType }
    });
  });

  return { success: true };
});

export const requestWalletSettlement = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const { amount } = data;
  if (!amount || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Amount must be positive.');
  }

  const uid = context.auth.uid;
  const userSnap = await db.collection('users').doc(uid).get();
  if (!userSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'User not found.');
  }

  const userData = userSnap.data()!;
  const role = userData.role || context.auth.token.role || 'customer';

  if (role !== 'driver' && role !== 'vendor') {
    throw new functions.https.HttpsError('permission-denied', 'Only drivers and vendors can request settlements.');
  }

  const walletCol = role === 'driver' ? 'driverWallets' : 'vendorWallets';
  const walletRef = db.collection(walletCol).doc(uid);

  await db.runTransaction(async (transaction) => {
    const walletSnap = await transaction.get(walletRef);
    if (!walletSnap.exists) {
      throw new functions.https.HttpsError('failed-precondition', 'Wallet not found.');
    }

    const wData = walletSnap.data()!;
    const balance = wData.balance || 0;
    const pendingBalance = wData.pendingBalance || 0;

    if (amount > balance) {
      throw new functions.https.HttpsError('failed-precondition', 'Insufficient balance in wallet.');
    }

    transaction.update(walletRef, {
      balance: balance - amount,
      pendingBalance: pendingBalance + amount,
      updatedAt: new Date().toISOString()
    });

    const requestRef = db.collection('settlementRequests').doc();
    transaction.set(requestRef, {
      id: requestRef.id,
      userId: uid,
      userType: role,
      amount,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      details: data.details || {}
    });

    await writeAuditLog(transaction, {
      action: 'REQUEST_SETTLEMENT',
      collection: 'settlementRequests',
      documentId: requestRef.id,
      actor: uid,
      oldValue: { balance, pendingBalance },
      newValue: { balance: balance - amount, pendingBalance: pendingBalance + amount }
    });
  });

  return { success: true };
});

export const processSettlement = functions.https.onCall(async (data, context) => {
  if (!context.auth || (context.auth.token.role !== 'admin' && context.auth.token.admin !== true)) {
    throw new functions.https.HttpsError('permission-denied', 'Only administrators can process settlements.');
  }

  const { requestId, action } = data;
  if (!requestId || !action) {
    throw new functions.https.HttpsError('invalid-argument', 'Parameters "requestId" and "action" are required.');
  }

  const requestRef = db.collection('settlementRequests').doc(requestId);

  await db.runTransaction(async (transaction) => {
    const requestSnap = await transaction.get(requestRef);
    if (!requestSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Settlement request not found.');
    }

    const reqData = requestSnap.data()!;
    const currentStatus = reqData.status;
    const userId = reqData.userId;
    const userType = reqData.userType;
    const amount = reqData.amount || 0;

    if (currentStatus === action) {
      return; // Already processed
    }

    const walletCol = userType === 'driver' ? 'driverWallets' : 'vendorWallets';
    const walletRef = db.collection(walletCol).doc(userId);
    const walletSnap = await transaction.get(walletRef);
    const wData = walletSnap.exists ? walletSnap.data()! : { balance: 0, pendingBalance: 0, paidBalance: 0 };

    let newBalance = wData.balance || 0;
    let newPending = wData.pendingBalance || 0;
    let newPaid = wData.paidBalance || 0;

    if (action === 'approved') {
      transaction.update(requestRef, { status: 'approved', updatedAt: new Date().toISOString() });
    } else if (action === 'rejected') {
      newPending = Math.max(0, newPending - amount);
      newBalance = newBalance + amount;
      
      transaction.update(requestRef, { status: 'rejected', updatedAt: new Date().toISOString() });
      transaction.set(walletRef, {
        balance: newBalance,
        pendingBalance: newPending,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } else if (action === 'paid') {
      newPending = Math.max(0, newPending - amount);
      newPaid = newPaid + amount;

      transaction.update(requestRef, { status: 'paid', updatedAt: new Date().toISOString() });
      transaction.set(walletRef, {
        pendingBalance: newPending,
        paidBalance: newPaid,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      const txCol = userType === 'driver' ? 'driverTransactions' : 'vendorTransactions';
      const txRef = db.collection(txCol).doc();
      transaction.set(txRef, {
        id: txRef.id,
        type: userType === 'vendor' ? 'vendor_settlement' : 'driver_withdrawal',
        referenceId: requestId,
        [userType === 'vendor' ? 'vendorId' : 'driverId']: userId,
        amount: -amount,
        currency: 'EGP',
        status: 'completed',
        createdAt: new Date().toISOString(),
        metadata: { note: 'Settlement Paid' }
      });
    }

    await writeAuditLog(transaction, {
      action: 'PROCESS_SETTLEMENT',
      collection: 'settlementRequests',
      documentId: requestId,
      actor: context.auth?.uid || 'admin',
      oldValue: { status: currentStatus, wallet: wData },
      newValue: { status: action, wallet: { balance: newBalance, pendingBalance: newPending, paidBalance: newPaid } }
    });
  });

  return { success: true };
});

export const onDriverLocationUpdate = functions.firestore.document('driverLocations/{driverId}').onWrite(async (change, context) => {
  const driverId = context.params.driverId;
  const before = change.before.data();
  const after = change.after.data();
  if (!after) return;

  if (before && before.lat && before.lng && after.lat && after.lng) {
    const timeDiffHours = (after.lastUpdated - before.lastUpdated) / (1000 * 60 * 60);
    if (timeDiffHours > 0.002) {
      const distKm = calculateDistanceKm(before.lat, before.lng, after.lat, after.lng);
      const speedKmh = distKm / timeDiffHours;
      const settings = await getAdminSettings();
      if (speedKmh > settings.impossibleSpeedLimit) {
        const incidentRef = db.collection('fraudIncidents').doc();
        await incidentRef.set({
          id: incidentRef.id,
          driverId,
          type: 'impossible_speed',
          details: `Driver moved at ${speedKmh.toFixed(1)} km/h. Jumped ${distKm.toFixed(2)} km in ${(timeDiffHours * 3600).toFixed(0)} seconds.`,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
});

export const reconcileDriverCash = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const userRef = db.collection('users').doc(context.auth.uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists || userSnap.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only administrators can reconcile cash.');
  }

  const { driverId, amount } = data;
  if (!driverId || amount === undefined || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing parameters: driverId and positive amount.');
  }

  const walletRef = db.collection('driverWallets').doc(driverId);
  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(walletRef);
    if (!snap.exists) {
      throw new functions.https.HttpsError('not-found', 'Driver wallet not found.');
    }
    const wData = snap.data()!;
    const remaining = wData.cashRemaining || 0;
    const delivered = wData.cashDelivered || 0;

    if (amount > remaining) {
      throw new functions.https.HttpsError('failed-precondition', 'Reconciliation amount exceeds driver remaining cash.');
    }

    transaction.update(walletRef, {
      cashRemaining: remaining - amount,
      cashDelivered: delivered + amount,
      updatedAt: new Date().toISOString()
    });

    const txRef = db.collection('driverTransactions').doc();
    transaction.set(txRef, {
      id: txRef.id,
      driverId,
      amount: -amount,
      type: 'cash_handover',
      description: `Cash handover/reconciliation to admin`,
      createdAt: new Date().toISOString(),
      status: 'completed'
    });
  });

  return { success: true };
});

// ----------------------------------------------------
// ENTERPRISE NOTIFICATION & FCM TRIGGERS (Part 1 & 9)
// ----------------------------------------------------

async function createSystemNotification(userId: string, title: string, body: string, type: string, entityId: string) {
  const notifRef = db.collection('notifications').doc();
  const notifData = {
    id: notifRef.id,
    userId,
    title,
    body,
    type,
    entityId,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  await notifRef.set(notifData);

  try {
    const userSnap = await db.collection('users').doc(userId).get();
    if (userSnap.exists) {
      const userData = userSnap.data() || {};
      const prefs = userData.preferences || {};
      
      // Part 9 - Prefs validations
      if (prefs.notificationsEnabled === false) return;
      if (type.includes('chat') && prefs.chatNotifications === false) return;
      if (type.includes('support') && prefs.supportNotifications === false) return;
      if ((type.includes('offer') || type.includes('marketing')) && prefs.offers === false) return;

      const fcmTokens = userData.fcmTokens || [];
      if (fcmTokens.length > 0) {
        const message = {
          notification: { title, body },
          data: { type, entityId },
          tokens: fcmTokens
        };
        await admin.messaging().sendEachForMulticast(message);
      }
    }
  } catch (err) {
    console.error('FCM messaging failed:', err);
  }
}

export const onOrderCreated = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const orderData = snap.data();
    if (!orderData) return;

    const orderId = context.params.orderId;
    const shopId = orderData.shopId;

    // Sync to search index (Part 7)
    const indexRef = db.collection('searchIndex').doc(`order_${orderId}`);
    await indexRef.set({
      id: orderId,
      type: 'order',
      title: `Order #${orderId.slice(-6)}`,
      subtitle: `${orderData.shopName || 'Store'} - ${orderData.total} EGP`,
      tags: [orderId, orderData.shopName, orderData.customerName, orderData.status].filter(Boolean).map(s => s.toLowerCase()),
      metadata: {
        total: orderData.total,
        status: orderData.status,
        customerId: orderData.customerId,
        shopId
      },
      updatedAt: new Date().toISOString()
    });

    // Notify vendor
    const storeSnap = await db.collection('stores').doc(shopId).get();
    if (storeSnap.exists) {
      const vendorUid = storeSnap.data()?.ownerId;
      if (vendorUid) {
        await createSystemNotification(
          vendorUid,
          'طلب جديد وارد',
          `لديك طلب جديد بقيمة ${orderData.total} ج.م. يرجى مراجعته وقبوله.`,
          'order_created',
          orderId
        );
      }
    }
  });

export const onOrderUpdated = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data()!;
    const after = change.after.data()!;
    
    if (before.status === after.status) return;

    const orderId = context.params.orderId;
    const status = after.status;
    const customerId = after.customerId;
    const shopId = after.shopId;
    const driverId = after.driverId;

    const notify = async (userId: string, title: string, body: string, type: string) => {
      await createSystemNotification(userId, title, body, type, orderId);
    };

    switch (status) {
      case 'accepted':
        await notify(customerId, 'تم قبول طلبك', `المتجر ${after.shopName} قبل طلبك ويقوم بتحضيره الآن.`, 'store_accepted');
        break;
      case 'rejected':
        await notify(customerId, 'تم اعتذار المتجر', `المتجر اعتذر عن قبول طلبك رقم #${orderId.slice(-6)}.`, 'store_rejected');
        break;
      case 'driver_assigned':
        if (after.assignedDriverId) {
          await notify(after.assignedDriverId, 'طلب توصيل جديد متاح', `تم تكليفك بتوصيل طلب. يرجى المراجعة والقبول.`, 'driver_assigned');
        }
        break;
      case 'driver_accepted':
        await notify(customerId, 'سائق في الطريق', `السائق ${after.driverName} قبل طلبك وهو في طريقه للمتجر.`, 'driver_accepted');
        break;
      case 'arrived_store':
        const sSnap = await db.collection('stores').doc(shopId).get();
        if (sSnap.exists) {
          const vendorUid = sSnap.data()?.ownerId;
          if (vendorUid) {
            await notify(vendorUid, 'وصل السائق للمحل', `السائق ${after.driverName} متواجد الآن بالمتجر لاستلام الطلب.`, 'driver_arrived_store');
          }
        }
        break;
      case 'picked_up':
        await notify(customerId, 'الطلب بالطريق إليك', `تم استلام طلبك من المتجر وهو في طريق التوصيل إليك.`, 'driver_picked_up');
        break;
      case 'arrived_customer':
        await notify(customerId, 'وصل السائق لموقعك', `وصل السائق إليك. يرجى إعطاء كود التحقق OTP لتأكيد الاستلام.`, 'driver_arrived_customer');
        break;
      case 'delivered':
        await notify(customerId, 'تم التوصيل بنجاح', `تم تسليم طلبك رقم #${orderId.slice(-6)} بنجاح. شكراً لك!`, 'order_delivered');
        break;
      case 'cancelled':
        await notify(customerId, 'تم إلغاء الطلب', `تم إلغاء طلبك رقم #${orderId.slice(-6)}.`, 'order_cancelled');
        if (driverId) {
          await notify(driverId, 'طلب ملغى', `تم إلغاء الطلب رقم #${orderId.slice(-6)} المكلف به.`, 'order_cancelled');
        }
        break;
    }
  });

// ----------------------------------------------------
// AUTOMATED SCHEDULERS & HEALTH CHECK ENGINES (Part 4 & 6)
// ----------------------------------------------------

export const processScheduledOrders = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    const now = new Date();
    // Activate scheduled orders target time <= 30 minutes from now
    const targetTime = new Date(now.getTime() + 30 * 60 * 1000);
    
    const snap = await db.collection('orders')
      .where('status', '==', 'scheduled')
      .where('scheduledAt', '<=', targetTime.toISOString())
      .get();

    for (const docSnap of snap.docs) {
      const orderId = docSnap.id;
      
      await db.runTransaction(async (transaction) => {
        transaction.update(db.collection('orders').doc(orderId), {
          status: 'pending',
          updatedAt: new Date().toISOString()
        });

        const eventRef = db.collection('orders').doc(orderId).collection('timeline').doc();
        transaction.set(eventRef, {
          id: eventRef.id,
          status: 'pending',
          timestamp: new Date().toISOString(),
          actor: 'system',
          actorRole: 'system',
          GPS: null,
          notes: 'Scheduled order activated automatically.'
        });
      });
    }
  });

export const checkDriverHealthAndTimeout = functions.pubsub
  .schedule('every 1 minute')
  .onRun(async (context) => {
    const now = new Date();
    
    // A. 30 seconds acceptance timeout
    const timeoutThreshold = new Date(now.getTime() - 30 * 1000);
    const pendingAssigns = await db.collection('orders')
      .where('status', '==', 'driver_assigned')
      .get();

    for (const orderDoc of pendingAssigns.docs) {
      const orderId = orderDoc.id;
      const orderData = orderDoc.data();
      const assignedAtStr = orderData.updatedAt;
      if (!assignedAtStr) continue;

      const assignedAt = new Date(assignedAtStr);
      if (assignedAt <= timeoutThreshold) {
        await triggerReassignment(orderId, orderData, 'assignment_timeout');
      }
    }

    // B. GPS Lost (5 mins) & Battery (<10%) Health reassignment
    const gpsLostThreshold = new Date(now.getTime() - 5 * 60 * 1000);
    const activeOrders = await db.collection('orders')
      .where('status', 'in', ['accepted', 'picked_up', 'on_the_way', 'delivering'])
      .get();

    for (const orderDoc of activeOrders.docs) {
      const orderId = orderDoc.id;
      const orderData = orderDoc.data();
      const driverId = orderData.driverId;
      if (!driverId) continue;

      const driverSnap = await db.collection('drivers').doc(driverId).get();
      if (!driverSnap.exists) continue;

      const dData = driverSnap.data()!;
      const availability = (dData.availability || '').toUpperCase();
      const status = dData.status || 'approved';

      const isUnavailable = availability === 'OFFLINE' || status === 'suspended' || status === 'blocked';
      const isBatteryCritical = dData.batteryLevel !== undefined && dData.batteryLevel < 10;

      let isGpsLost = false;
      const locSnap = await db.collection('driverLocations').doc(driverId).get();
      if (locSnap.exists) {
        const lastSeenStr = locSnap.data()?.lastUpdated;
        if (lastSeenStr) {
          const lastSeen = new Date(lastSeenStr);
          if (lastSeen <= gpsLostThreshold) {
            isGpsLost = true;
          }
        }
      }

      if (isUnavailable || isBatteryCritical || isGpsLost) {
        let reason = 'driver_offline';
        if (isBatteryCritical) reason = 'driver_battery_critical';
        if (isGpsLost) reason = 'driver_gps_lost';
        if (status === 'suspended' || status === 'blocked') reason = 'driver_suspended';

        await triggerReassignment(orderId, orderData, reason);
      }
    }
  });

async function triggerReassignment(orderId: string, orderData: any, reason: string) {
  const driverId = orderData.driverId || orderData.assignedDriverId;
  const rejectedBy = orderData.rejectedBy || [];
  
  if (driverId && !rejectedBy.includes(driverId)) {
    rejectedBy.push(driverId);
  }

  await db.runTransaction(async (transaction) => {
    const orderRef = db.collection('orders').doc(orderId);
    const updates: any = {
      status: 'ready_for_delivery',
      driverId: null,
      driverName: null,
      assignedDriverId: null,
      rejectedBy,
      updatedAt: new Date().toISOString()
    };

    if (driverId) {
      const driverRef = db.collection('drivers').doc(driverId);
      transaction.update(driverRef, {
        availability: 'available',
        currentOrderId: null
      });
    }

    const bestDriver = await assignBestDriver(transaction, orderId, { ...orderData, location: orderData.location }, rejectedBy);
    if (bestDriver) {
      updates.status = 'driver_assigned';
      updates.assignedDriverId = bestDriver.id;
      updates.driverId = bestDriver.id;
      updates.driverName = bestDriver.name;

      const newDriverRef = db.collection('drivers').doc(bestDriver.id);
      transaction.update(newDriverRef, {
        availability: 'busy',
        currentOrderId: orderId
      });
    }

    transaction.update(orderRef, updates);

    const eventRef = orderRef.collection('timeline').doc();
    transaction.set(eventRef, {
      id: eventRef.id,
      status: updates.status,
      timestamp: new Date().toISOString(),
      actor: 'system',
      actorRole: 'system',
      GPS: null,
      notes: `Reassigned from driver ${driverId || 'none'} due to ${reason}.`
    });
  });
}

// ----------------------------------------------------
// SEARCH INDEX REAL-TIME MIRROR TRIGGERS (Part 7)
// ----------------------------------------------------

export const syncProductToSearchIndex = functions.firestore
  .document('products/{productId}')
  .onWrite(async (change, context) => {
    const docId = context.params.productId;
    const ref = db.collection('searchIndex').doc(`product_${docId}`);
    if (!change.after.exists) {
      await ref.delete();
      return;
    }
    const data = change.after.data()!;
    if (data.status === 'draft') {
      await ref.delete();
      return;
    }
    await ref.set({
      id: docId,
      type: 'product',
      title: data.name || '',
      subtitle: data.description || '',
      tags: [data.name, data.category, data.brand, data.description].filter(Boolean).map(s => s.toLowerCase()),
      metadata: {
        price: data.price || 0,
        storeId: data.storeId || '',
        category: data.category || '',
        imageUrl: data.images?.[0] || ''
      },
      updatedAt: new Date().toISOString()
    });
  });

export const syncStoreToSearchIndex = functions.firestore
  .document('stores/{storeId}')
  .onWrite(async (change, context) => {
    const docId = context.params.storeId;
    const ref = db.collection('searchIndex').doc(`store_${docId}`);
    if (!change.after.exists) {
      await ref.delete();
      return;
    }
    const data = change.after.data()!;
    if (data.status !== 'approved') {
      await ref.delete();
      return;
    }
    await ref.set({
      id: docId,
      type: data.isRestaurant ? 'restaurant' : (data.isPharmacy ? 'pharmacy' : 'store'),
      title: data.name || '',
      subtitle: data.description || '',
      tags: [data.name, data.description, data.district].filter(Boolean).map(s => s.toLowerCase()),
      metadata: {
        rating: data.averageRating || 5.0,
        logo: data.logo || ''
      },
      updatedAt: new Date().toISOString()
    });
  });

export const syncDriverToSearchIndex = functions.firestore
  .document('drivers/{driverId}')
  .onWrite(async (change, context) => {
    const docId = context.params.driverId;
    const ref = db.collection('searchIndex').doc(`driver_${docId}`);
    if (!change.after.exists) {
      await ref.delete();
      return;
    }
    const data = change.after.data()!;
    await ref.set({
      id: docId,
      type: 'driver',
      title: data.name || '',
      subtitle: data.vehicleType || '',
      tags: [data.name, data.vehicleType, data.phone].filter(Boolean).map(s => s.toLowerCase()),
      metadata: {
        rating: data.rating || 5.0,
        availability: data.availability || 'offline'
      },
      updatedAt: new Date().toISOString()
    });
  });

export const syncCategoryToSearchIndex = functions.firestore
  .document('categories/{categoryId}')
  .onWrite(async (change, context) => {
    const docId = context.params.categoryId;
    const ref = db.collection('searchIndex').doc(`category_${docId}`);
    if (!change.after.exists) {
      await ref.delete();
      return;
    }
    const data = change.after.data()!;
    await ref.set({
      id: docId,
      type: 'category',
      title: data.name || '',
      subtitle: data.slug || '',
      tags: [data.name, data.slug].filter(Boolean).map(s => s.toLowerCase()),
      metadata: {
        icon: data.icon || ''
      },
      updatedAt: new Date().toISOString()
    });
  });

export const syncCouponToSearchIndex = functions.firestore
  .document('coupons/{couponId}')
  .onWrite(async (change, context) => {
    const docId = context.params.couponId;
    const ref = db.collection('searchIndex').doc(`coupon_${docId}`);
    if (!change.after.exists) {
      await ref.delete();
      return;
    }
    const data = change.after.data()!;
    await ref.set({
      id: docId,
      type: 'coupon',
      title: data.code || '',
      subtitle: `${data.discountValue}% Off`,
      tags: [data.code].filter(Boolean).map(s => s.toLowerCase()),
      metadata: {
        discountValue: data.discountValue || 0,
        minOrder: data.minOrder || 0
      },
      updatedAt: new Date().toISOString()
    });
  });

