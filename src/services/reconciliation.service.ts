import { db } from './firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export const reconcileOrder = async (orderId: string) => {
  // 1. Get Order
  const orderRef = await getDoc(doc(db, 'orders', orderId));
  if (!orderRef.exists()) return null;
  const order = orderRef.data();

  // 2. Get Payment
  let paymentAmount = 0;
  if (order.paymentId) {
    const paymentRef = await getDoc(doc(db, 'payments', order.paymentId));
    if (paymentRef.exists() && paymentRef.data().status === 'paid') {
      paymentAmount = paymentRef.data().amount;
    }
  } else if (order.paymentMethod === 'cash_on_delivery' && order.status === 'delivered') {
    // Implicit payment
    paymentAmount = order.total;
  }

  // 3. Get Ledger
  const qPlatform = query(collection(db, 'platformTransactions'), where('orderId', '==', orderId));
  const qVendor = query(collection(db, 'vendorTransactions'), where('orderId', '==', orderId));
  const qDriver = query(collection(db, 'driverTransactions'), where('orderId', '==', orderId));

  const [pSnap, vSnap, dSnap] = await Promise.all([getDocs(qPlatform), getDocs(qVendor), getDocs(qDriver)]);
  
  let ledgerAmount = 0;
  pSnap.forEach(d => { if (d.data().type === 'platform_commission') ledgerAmount += d.data().amount });
  vSnap.forEach(d => { if (d.data().type === 'vendor_revenue') ledgerAmount += d.data().amount });
  dSnap.forEach(d => { if (d.data().type === 'driver_earning') ledgerAmount += d.data().amount }); // assuming subsidies are handled

  // Reconcile
  const isMatch = Math.abs(order.total - paymentAmount) < 0.01 && 
                  (ledgerAmount === 0 || Math.abs(order.subtotal + (order.deliveryFee || 0) - ledgerAmount) < 0.01);

  return {
    orderId,
    orderTotal: order.total,
    paymentAmount,
    ledgerAmount,
    isMatch,
    status: isMatch ? 'Reconciled' : 'Mismatch',
    details: {
      hasPaymentRecord: !!order.paymentId,
      paymentStatus: order.paymentStatus,
      isFinancialProcessed: order.financialProcessed
    }
  };
};

export const detectMismatches = async () => {
  // This function would normally run as a background cron job over all recent orders.
  // We'll simulate fetching the latest 100 delivered orders to reconcile.
  const qOrders = query(collection(db, 'orders'), where('status', '==', 'delivered'));
  const snap = await getDocs(qOrders);
  
  const results = [];
  for (const doc of snap.docs) {
    const rec = await reconcileOrder(doc.id);
    if (rec) results.push(rec);
  }

  return {
    totalChecked: results.length,
    mismatches: results.filter(r => !r.isMatch)
  };
};
