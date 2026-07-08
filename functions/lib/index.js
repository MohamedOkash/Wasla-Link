"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processSettlement = exports.requestWalletSettlement = exports.approveDriver = exports.onReturnRequestUpdated = exports.onReviewCreated = exports.updateProductStock = exports.updateOrderStatus = exports.createOrder = exports.calculateOrder = exports.setUserRole = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
const DEFAULT_SETTINGS = {
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
async function getPlatformSettings() {
    const docSnap = await db.collection('platformSettings').doc('default').get();
    if (docSnap.exists) {
        return { ...DEFAULT_SETTINGS, ...docSnap.data() };
    }
    return DEFAULT_SETTINGS;
}
async function writeAuditLog(transaction, log) {
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
exports.setUserRole = functions.https.onCall(async (data, context) => {
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
function calculateCouponDiscount(coupon, subtotal, deliveryFee, cartItems) {
    if (coupon.discountType === 'free_delivery') {
        return deliveryFee;
    }
    if (coupon.discountType === 'fixed') {
        return Math.min(coupon.discountValue, subtotal);
    }
    if (coupon.discountType === 'buy_x_get_y') {
        if (!coupon.getXProductIds || !coupon.getQty || !cartItems)
            return 0;
        const yItemsInCart = cartItems.filter(item => coupon.getXProductIds.includes(item.id));
        let remainingGetQty = coupon.getQty;
        let discount = 0;
        const sortedYItems = [...yItemsInCart].sort((a, b) => a.price - b.price);
        for (const item of sortedYItems) {
            const qtyToDiscount = Math.min(item.quantity, remainingGetQty);
            discount += qtyToDiscount * item.price;
            remainingGetQty -= qtyToDiscount;
            if (remainingGetQty <= 0)
                break;
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
exports.calculateOrder = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { cartItems, couponId, pointsToRedeem = 0, address } = data;
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0 || !address) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing parameters.');
    }
    const productIds = cartItems.map(item => item.id);
    const productSnaps = await Promise.all(productIds.map(id => db.collection('products').doc(id).get()));
    const itemsByStore = {};
    let totalSubtotal = 0;
    for (const item of cartItems) {
        const pSnap = productSnaps.find(snap => snap.id === item.id);
        if (!pSnap || !pSnap.exists) {
            throw new functions.https.HttpsError('not-found', `Product with ID ${item.id} not found.`);
        }
        const productData = pSnap.data();
        const storeId = productData.storeId;
        if (!storeId)
            continue;
        let unitPrice = productData.price;
        if (productData.isOffer && productData.offerType) {
            const val = productData.offerValue || 0;
            if (productData.offerType === 'percentage') {
                unitPrice = productData.price - (productData.price * (val / 100));
            }
            else if (productData.offerType === 'fixed') {
                unitPrice = Math.max(0, productData.price - val);
            }
        }
        totalSubtotal += unitPrice * item.quantity;
        if (!itemsByStore[storeId])
            itemsByStore[storeId] = [];
        itemsByStore[storeId].push({ item, unitPrice });
    }
    const settings = await getPlatformSettings();
    const storeIds = Object.keys(itemsByStore);
    const storeSnaps = await Promise.all(storeIds.map(id => db.collection('stores').doc(id).get()));
    let totalDeliveryFee = 0;
    for (let idx = 0; idx < storeIds.length; idx++) {
        const storeSnap = storeSnaps[idx];
        if (!storeSnap.exists)
            continue;
        const storeData = storeSnap.data();
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
            const c = couponSnap.data();
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
exports.createOrder = functions.https.onCall(async (data, context) => {
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
        const userData = userSnap.data();
        const customerOrderNumber = (userData.totalOrders || 0) + 1;
        const productRefs = cartItems.map(item => db.collection('products').doc(item.id));
        const productSnaps = await Promise.all(productRefs.map(ref => transaction.get(ref)));
        const itemsByStore = {};
        for (let i = 0; i < cartItems.length; i++) {
            const item = cartItems[i];
            const pSnap = productSnaps[i];
            if (!pSnap.exists) {
                throw new functions.https.HttpsError('not-found', `Product ${item.id} not found.`);
            }
            const pData = pSnap.data();
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
                }
                else if (pData.offerType === 'fixed') {
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
        const storeCalculations = {};
        const storeIds = Object.keys(itemsByStore);
        const storeRefs = storeIds.map(id => db.collection('stores').doc(id));
        const storeSnaps = await Promise.all(storeRefs.map(ref => transaction.get(ref)));
        for (let idx = 0; idx < storeIds.length; idx++) {
            const storeId = storeIds[idx];
            const storeSnap = storeSnaps[idx];
            if (!storeSnap.exists) {
                throw new functions.https.HttpsError('not-found', `Store ${storeId} not found.`);
            }
            const storeData = storeSnap.data();
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
                const c = couponSnap.data();
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
        }
        else {
            transaction.set(systemCounterRef, { globalOrders: 1 });
        }
        const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const childOrderIds = [];
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
                status: initialStatus,
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
const ALLOWED_TRANSITIONS = {
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
exports.updateOrderStatus = functions.https.onCall(async (data, context) => {
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
        const orderData = orderSnap.data();
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
        }
        const updates = {
            status: nextStatus,
            updatedAt: new Date().toISOString()
        };
        if (nextStatus === 'ready_for_delivery') {
            updates.driverId = null;
            updates.driverName = null;
            updates.assignedDriverId = null;
            const rejectedBy = orderData.rejectedBy || [];
            if (driverId && !rejectedBy.includes(driverId)) {
                rejectedBy.push(driverId);
                updates.rejectedBy = rejectedBy;
            }
        }
        else if (driverId) {
            updates.driverId = driverId;
            updates.driverName = driverName || '';
        }
        transaction.update(orderRef, updates);
        const eventRef = db.collection('orderHistory').doc(orderId).collection('events').doc();
        transaction.set(eventRef, {
            id: eventRef.id,
            status: nextStatus,
            timestamp: new Date().toISOString(),
            userId: actorId,
            notes: `Status changed from ${currentStatus} to ${nextStatus}`
        });
        if (nextStatus === 'picked_up') {
            for (const item of orderData.items) {
                const prodRef = db.collection('products').doc(item.id);
                const prodSnap = await transaction.get(prodRef);
                if (prodSnap.exists) {
                    const p = prodSnap.data();
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
        }
        else if (nextStatus === 'cancelled' || nextStatus === 'rejected') {
            for (const item of orderData.items) {
                const prodRef = db.collection('products').doc(item.id);
                const prodSnap = await transaction.get(prodRef);
                if (prodSnap.exists) {
                    const p = prodSnap.data();
                    const isReserved = (p.reservedStock || 0) >= item.quantity;
                    const reservedStock = isReserved ? (p.reservedStock || 0) - item.quantity : (p.reservedStock || 0);
                    const currentStock = isReserved ? (p.currentStock || 0) : (p.currentStock || 0) + item.quantity;
                    let availStatus = 'in_stock';
                    if (currentStock === 0)
                        availStatus = 'out_of_stock';
                    else if (currentStock <= (p.lowStockThreshold || 10))
                        availStatus = 'low_stock';
                    transaction.update(prodRef, {
                        currentStock,
                        reservedStock,
                        availabilityStatus: availStatus
                    });
                }
            }
        }
        else if (nextStatus === 'delivered') {
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
                const distance = orderData.assignmentDistance || 3;
                let driverFee = 15;
                if (distance > 12)
                    driverFee = 50;
                else if (distance > 8)
                    driverFee = 35;
                else if (distance > 5)
                    driverFee = 25;
                else if (distance > 3)
                    driverFee = 20;
                transaction.set(driverWalletRef, {
                    balance: dBalance + driverFee,
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
                const driverRef = db.collection('drivers').doc(activeDriverId);
                const driverSnap = await transaction.get(driverRef);
                if (driverSnap.exists) {
                    const dData = driverSnap.data();
                    transaction.update(driverRef, {
                        completedOrders: (dData.completedOrders || 0) + 1,
                        totalDeliveries: (dData.totalDeliveries || 0) + 1,
                        totalEarnings: (dData.totalEarnings || 0) + driverFee,
                        availability: 'online',
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
exports.updateProductStock = functions.https.onCall(async (data, context) => {
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
        const pData = prodSnap.data();
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
        if (newStock === 0)
            availStatus = 'out_of_stock';
        else if (newStock <= (pData.lowStockThreshold || 10))
            availStatus = 'low_stock';
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
// 1. Recalculate average rating of products when a review is created
exports.onReviewCreated = functions.firestore
    .document('reviews/{reviewId}')
    .onCreate(async (snap) => {
    const reviewData = snap.data();
    const productId = reviewData.productId;
    if (!productId)
        return;
    const productRef = db.collection('products').doc(productId);
    await db.runTransaction(async (transaction) => {
        const reviewsSnap = await db.collection('reviews').where('productId', '==', productId).get();
        const ratingsList = reviewsSnap.docs.map(doc => doc.data().rating);
        const ratingsCount = ratingsList.length;
        const averageRating = parseFloat((ratingsList.reduce((sum, r) => sum + r, 0) / ratingsCount).toFixed(1));
        transaction.update(productRef, {
            averageRating,
            ratingsCount
        });
    });
});
// 2. Automate wallet transaction when return request is marked refunded
exports.onReturnRequestUpdated = functions.firestore
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
                if (!storeSnap.exists)
                    return;
                const vendorId = storeSnap.data()?.vendorId;
                if (!vendorId)
                    return;
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
exports.approveDriver = functions.https.onCall(async (data, context) => {
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
exports.requestWalletSettlement = functions.https.onCall(async (data, context) => {
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
    const userData = userSnap.data();
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
        const wData = walletSnap.data();
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
exports.processSettlement = functions.https.onCall(async (data, context) => {
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
        const reqData = requestSnap.data();
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
        const wData = walletSnap.exists ? walletSnap.data() : { balance: 0, pendingBalance: 0, paidBalance: 0 };
        let newBalance = wData.balance || 0;
        let newPending = wData.pendingBalance || 0;
        let newPaid = wData.paidBalance || 0;
        if (action === 'approved') {
            transaction.update(requestRef, { status: 'approved', updatedAt: new Date().toISOString() });
        }
        else if (action === 'rejected') {
            newPending = Math.max(0, newPending - amount);
            newBalance = newBalance + amount;
            transaction.update(requestRef, { status: 'rejected', updatedAt: new Date().toISOString() });
            transaction.set(walletRef, {
                balance: newBalance,
                pendingBalance: newPending,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        }
        else if (action === 'paid') {
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
//# sourceMappingURL=index.js.map