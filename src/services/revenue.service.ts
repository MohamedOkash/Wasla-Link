import { db } from './firebase';
import { doc, getDoc, runTransaction, serverTimestamp, collection, setDoc, query, where, getDocs } from 'firebase/firestore';
import { PlatformSettings, LedgerTransaction } from '../types/financial';
import { DEFAULT_PLATFORM_SETTINGS } from './deliveryFee.service';

export interface RevenueBreakdown {
  orderTotal: number;
  subtotal: number;
  deliveryFee: number;
  platformCommissionRate: number;
  platformCommissionAmount: number;
  vendorNetAmount: number;
  driverEarnings: number;
  platformTotalRevenue: number;
}

export const getPlatformSettings = async (): Promise<PlatformSettings> => {
  const snap = await getDoc(doc(db, 'platformSettings', 'default'));
  if (snap.exists()) {
    return snap.data() as PlatformSettings;
  }
  return { ...DEFAULT_PLATFORM_SETTINGS };
};

export const calculateRevenueBreakdown = (
  subtotal: number, 
  deliveryFee: number, 
  settings: PlatformSettings
): RevenueBreakdown => {
  const commissionRate = settings.commissionPercent / 100;
  const platformCommissionAmount = subtotal * commissionRate;
  const vendorNetAmount = subtotal - platformCommissionAmount;
  
  let actualDeliveryFee = deliveryFee;
  if (settings.freeDeliveryEnabled) {
    actualDeliveryFee = 0; // Or platform subsidizes it
  }
  
  const driverBonus = settings.driverBonusPercent > 0 ? (actualDeliveryFee * (settings.driverBonusPercent / 100)) : 0;
  const driverEarnings = actualDeliveryFee + driverBonus;
  
  const platformTotalRevenue = platformCommissionAmount; // Minus subsidies if any, but simplified here

  return {
    orderTotal: subtotal + actualDeliveryFee,
    subtotal,
    deliveryFee: actualDeliveryFee,
    platformCommissionRate: commissionRate,
    platformCommissionAmount,
    vendorNetAmount,
    driverEarnings,
    platformTotalRevenue
  };
};

export const processOrderSettlement = async (orderId: string): Promise<void> => {
  try {
    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await transaction.get(orderRef);

      if (!orderSnap.exists()) {
        throw new Error('Order does not exist!');
      }

      const orderData = orderSnap.data();
      if (orderData.paymentMethod === 'cash_on_delivery' && orderData.status !== 'delivered') {
        throw new Error('COD orders must be delivered to generate revenue.');
      }
      if (orderData.paymentMethod !== 'cash_on_delivery' && orderData.paymentStatus !== 'paid') {
        throw new Error('Non-COD orders must be paid to generate revenue.');
      }
      
      if (orderData.financialProcessed) {
        throw new Error('Order revenue is already processed.');
      }

      const settingsRef = doc(db, 'platformSettings', 'default');
      const settingsSnap = await transaction.get(settingsRef);
      const settings = settingsSnap.exists() ? (settingsSnap.data() as PlatformSettings) : {
        ...DEFAULT_PLATFORM_SETTINGS
      };

      if (settings.maintenanceRevenueLock) {
        throw new Error('Financial operations are temporarily locked for maintenance.');
      }

      const breakdown = calculateRevenueBreakdown(orderData.subtotal || 0, orderData.deliveryFee || 0, settings);

      // 1. Update Vendor Wallet
      const vendorWalletRef = doc(db, 'vendorWallets', orderData.storeId);
      const vendorWalletSnap = await transaction.get(vendorWalletRef);
      const currentVendorBal = vendorWalletSnap.exists() ? vendorWalletSnap.data().balance || 0 : 0;
      const currentVendorPending = vendorWalletSnap.exists() ? vendorWalletSnap.data().pendingBalance || 0 : 0;
      const currentVendorPaid = vendorWalletSnap.exists() ? vendorWalletSnap.data().paidBalance || 0 : 0;
      
      transaction.set(vendorWalletRef, { 
        balance: currentVendorBal + breakdown.vendorNetAmount,
        pendingBalance: currentVendorPending,
        paidBalance: currentVendorPaid,
        updatedAt: serverTimestamp() 
      }, { merge: true });

      // 2. Record Vendor Ledger Transaction
      const vendorTxRef = doc(collection(db, 'vendorTransactions'));
      transaction.set(vendorTxRef, {
        id: vendorTxRef.id,
        type: 'vendor_revenue',
        referenceId: orderId,
        orderId,
        vendorId: orderData.storeId,
        amount: breakdown.vendorNetAmount,
        currency: 'EGP',
        status: 'completed',
        createdAt: serverTimestamp(),
        metadata: { subtotal: orderData.subtotal, commission: breakdown.platformCommissionAmount }
      } as LedgerTransaction);

      // 3. Update Driver Wallet (if driver assigned)
      if (orderData.driverId) {
        const driverWalletRef = doc(db, 'driverWallets', orderData.driverId);
        const driverWalletSnap = await transaction.get(driverWalletRef);
        const currentDriverBal = driverWalletSnap.exists() ? driverWalletSnap.data().balance || 0 : 0;
        const currentDriverPending = driverWalletSnap.exists() ? driverWalletSnap.data().pendingBalance || 0 : 0;
        const currentDriverPaid = driverWalletSnap.exists() ? driverWalletSnap.data().paidBalance || 0 : 0;

        transaction.set(driverWalletRef, { 
          balance: currentDriverBal + breakdown.driverEarnings,
          pendingBalance: currentDriverPending,
          paidBalance: currentDriverPaid,
          updatedAt: serverTimestamp() 
        }, { merge: true });

        // 4. Record Driver Ledger Transaction
        const driverTxRef = doc(collection(db, 'driverTransactions'));
        transaction.set(driverTxRef, {
          id: driverTxRef.id,
          type: 'driver_earning',
          referenceId: orderId,
          orderId,
          driverId: orderData.driverId,
          amount: breakdown.driverEarnings,
          currency: 'EGP',
          status: 'completed',
          createdAt: serverTimestamp(),
          metadata: { deliveryFee: breakdown.deliveryFee }
        } as LedgerTransaction);
      }

      // 5. Update Platform Ledger & Transactions
      const platformRef = doc(db, 'platformLedger', 'master');
      const platformSnap = await transaction.get(platformRef);
      const newPlatformRevenue = (platformSnap.exists() ? platformSnap.data().totalRevenue : 0) + breakdown.platformTotalRevenue;
      transaction.set(platformRef, { totalRevenue: newPlatformRevenue, updatedAt: serverTimestamp() }, { merge: true });

      const platformTxRef = doc(collection(db, 'platformTransactions'));
      transaction.set(platformTxRef, {
        id: platformTxRef.id,
        type: 'platform_commission',
        referenceId: orderId,
        orderId,
        amount: breakdown.platformCommissionAmount,
        currency: 'EGP',
        status: 'completed',
        createdAt: serverTimestamp(),
        metadata: { rate: breakdown.platformCommissionRate }
      } as LedgerTransaction);

      // 6. Mark Order Settled
      transaction.update(orderRef, { 
        settled: true, 
        revenueBreakdown: breakdown,
        financialProcessed: true,
        financialProcessedAt: serverTimestamp()
      });
    });
  } catch (error) {
    console.error('Settlement Failed:', error);
    throw error;
  }
};

// Reversals
export const processOrderReversal = async (orderId: string, reason: string): Promise<void> => {
  try {
    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await transaction.get(orderRef);

      if (!orderSnap.exists()) throw new Error('Order does not exist!');
      const orderData = orderSnap.data();
      
      if (!orderData.financialProcessed || !orderData.revenueBreakdown) {
        throw new Error('Order has no financial record to reverse.');
      }
      if (orderData.financialReversed) {
        throw new Error('Order is already reversed.');
      }

      const breakdown: RevenueBreakdown = orderData.revenueBreakdown;

      // 1. Reverse Vendor
      const vendorWalletRef = doc(db, 'vendorWallets', orderData.storeId);
      const vendorWalletSnap = await transaction.get(vendorWalletRef);
      const vendorBal = vendorWalletSnap.exists() ? vendorWalletSnap.data().balance || 0 : 0;
      transaction.update(vendorWalletRef, { balance: vendorBal - breakdown.vendorNetAmount, updatedAt: serverTimestamp() });
      
      const vendorTxRef = doc(collection(db, 'vendorTransactions'));
      transaction.set(vendorTxRef, {
        id: vendorTxRef.id,
        type: 'refund',
        referenceId: orderId,
        orderId,
        vendorId: orderData.storeId,
        amount: -breakdown.vendorNetAmount,
        currency: 'EGP',
        status: 'completed',
        createdAt: serverTimestamp(),
        metadata: { reason }
      } as LedgerTransaction);

      // 2. Reverse Driver (Optional based on policy, but doing it here)
      if (orderData.driverId) {
        const driverWalletRef = doc(db, 'driverWallets', orderData.driverId);
        const driverWalletSnap = await transaction.get(driverWalletRef);
        const driverBal = driverWalletSnap.exists() ? driverWalletSnap.data().balance || 0 : 0;
        transaction.update(driverWalletRef, { balance: driverBal - breakdown.driverEarnings, updatedAt: serverTimestamp() });

        const driverTxRef = doc(collection(db, 'driverTransactions'));
        transaction.set(driverTxRef, {
          id: driverTxRef.id,
          type: 'refund',
          referenceId: orderId,
          orderId,
          driverId: orderData.driverId,
          amount: -breakdown.driverEarnings,
          currency: 'EGP',
          status: 'completed',
          createdAt: serverTimestamp(),
          metadata: { reason }
        } as LedgerTransaction);
      }

      // 3. Reverse Platform
      const platformRef = doc(db, 'platformLedger', 'master');
      const platformSnap = await transaction.get(platformRef);
      const platBal = platformSnap.exists() ? platformSnap.data().totalRevenue || 0 : 0;
      transaction.update(platformRef, { totalRevenue: platBal - breakdown.platformTotalRevenue, updatedAt: serverTimestamp() });

      const platformTxRef = doc(collection(db, 'platformTransactions'));
      transaction.set(platformTxRef, {
        id: platformTxRef.id,
        type: 'refund',
        referenceId: orderId,
        orderId,
        amount: -breakdown.platformCommissionAmount,
        currency: 'EGP',
        status: 'completed',
        createdAt: serverTimestamp(),
        metadata: { reason }
      } as LedgerTransaction);

      // 4. Mark Order Reversed
      transaction.update(orderRef, { 
        financialReversed: true,
        financialReversedAt: serverTimestamp()
      });
    });
  } catch (error) {
    console.error('Reversal Failed:', error);
    throw error;
  }
};
