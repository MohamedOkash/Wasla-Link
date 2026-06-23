import { db } from './firebase';
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';

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

export const calculateRevenueBreakdown = (
  subtotal: number, 
  deliveryFee: number, 
  commissionRate: number = 0.10 // 10% default
): RevenueBreakdown => {
  const platformCommissionAmount = subtotal * commissionRate;
  const vendorNetAmount = subtotal - platformCommissionAmount;
  const driverEarnings = deliveryFee;
  // Platform keeps commission + delivery fee (if platform driver, but normally driver gets it).
  // In this marketplace, we assume platform collects commission only, or delivery fee is split.
  // The specs say: "Platform Revenue = Commission + Delivery Fee (if Platform driver)"
  // We'll return the base commission as revenue.
  const platformTotalRevenue = platformCommissionAmount;

  return {
    orderTotal: subtotal + deliveryFee,
    subtotal,
    deliveryFee,
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
      if (orderData.status !== 'delivered') {
        throw new Error('Order must be delivered to process settlement');
      }
      
      if (orderData.settled) {
        throw new Error('Order is already settled');
      }

      const breakdown = calculateRevenueBreakdown(orderData.subtotal || 0, orderData.deliveryFee || 0);

      // 1. Update Vendor Wallet
      const vendorWalletRef = doc(db, 'vendorWallets', orderData.storeId);
      const vendorWalletSnap = await transaction.get(vendorWalletRef);
      const newVendorBalance = (vendorWalletSnap.exists() ? vendorWalletSnap.data().balance : 0) + breakdown.vendorNetAmount;
      transaction.set(vendorWalletRef, { balance: newVendorBalance, updatedAt: serverTimestamp() }, { merge: true });

      // 2. Record Vendor Transaction
      const vendorTxRef = doc(collection(db, 'vendorTransactions'));
      transaction.set(vendorTxRef, {
        storeId: orderData.storeId,
        orderId,
        amount: breakdown.vendorNetAmount,
        type: 'credit',
        description: `Order ${orderId} Revenue`,
        timestamp: serverTimestamp()
      });

      // 3. Update Driver Wallet (if driver assigned)
      if (orderData.driverId) {
        const driverWalletRef = doc(db, 'driverWallets', orderData.driverId);
        const driverWalletSnap = await transaction.get(driverWalletRef);
        const newDriverBalance = (driverWalletSnap.exists() ? driverWalletSnap.data().balance : 0) + breakdown.driverEarnings;
        transaction.set(driverWalletRef, { balance: newDriverBalance, updatedAt: serverTimestamp() }, { merge: true });

        // 4. Record Driver Transaction
        const driverTxRef = doc(collection(db, 'driverTransactions'));
        transaction.set(driverTxRef, {
          driverId: orderData.driverId,
          orderId,
          amount: breakdown.driverEarnings,
          type: 'credit',
          description: `Order ${orderId} Delivery Fee`,
          timestamp: serverTimestamp()
        });
      }

      // 5. Update Platform Ledger
      const platformRef = doc(db, 'platformLedger', 'master');
      const platformSnap = await transaction.get(platformRef);
      const newPlatformRevenue = (platformSnap.exists() ? platformSnap.data().totalRevenue : 0) + breakdown.platformTotalRevenue;
      transaction.set(platformRef, { totalRevenue: newPlatformRevenue, updatedAt: serverTimestamp() }, { merge: true });

      // 6. Mark Order Settled
      transaction.update(orderRef, { settled: true, revenueBreakdown: breakdown });
    });
  } catch (error) {
    console.error('Settlement Failed:', error);
    throw error;
  }
};
