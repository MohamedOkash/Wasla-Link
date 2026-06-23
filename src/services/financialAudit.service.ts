import { db } from './firebase';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';

export const validateOrderLedger = async (orderId: string) => {
  const qPlatform = query(collection(db, 'platformTransactions'), where('orderId', '==', orderId));
  const qVendor = query(collection(db, 'vendorTransactions'), where('orderId', '==', orderId));
  const qDriver = query(collection(db, 'driverTransactions'), where('orderId', '==', orderId));

  const [pSnap, vSnap, dSnap] = await Promise.all([getDocs(qPlatform), getDocs(qVendor), getDocs(qDriver)]);
  
  let totalPlatform = 0;
  pSnap.forEach(d => totalPlatform += d.data().amount);
  
  let totalVendor = 0;
  vSnap.forEach(d => totalVendor += d.data().amount);

  let totalDriver = 0;
  dSnap.forEach(d => totalDriver += d.data().amount);

  return { totalPlatform, totalVendor, totalDriver };
};

export const validateVendorBalance = async (vendorId: string) => {
  const qVendor = query(collection(db, 'vendorTransactions'), where('vendorId', '==', vendorId));
  const vSnap = await getDocs(qVendor);
  
  let calculatedBalance = 0;
  vSnap.forEach(d => {
    const tx = d.data();
    if (tx.status === 'completed') {
      calculatedBalance += tx.amount;
    }
  });

  const walletSnap = await getDoc(doc(db, 'vendorWallets', vendorId));
  const storedBalance = walletSnap.exists() ? walletSnap.data().balance || 0 : 0;

  return { calculatedBalance, storedBalance, isMatch: Math.abs(calculatedBalance - storedBalance) < 0.01 };
};

export const validateDriverBalance = async (driverId: string) => {
  const qDriver = query(collection(db, 'driverTransactions'), where('driverId', '==', driverId));
  const dSnap = await getDocs(qDriver);
  
  let calculatedBalance = 0;
  dSnap.forEach(d => {
    const tx = d.data();
    if (tx.status === 'completed') {
      calculatedBalance += tx.amount;
    }
  });

  const walletSnap = await getDoc(doc(db, 'driverWallets', driverId));
  const storedBalance = walletSnap.exists() ? walletSnap.data().balance || 0 : 0;

  return { calculatedBalance, storedBalance, isMatch: Math.abs(calculatedBalance - storedBalance) < 0.01 };
};

export const validatePlatformRevenue = async () => {
  const pSnap = await getDocs(collection(db, 'platformTransactions'));
  
  let calculatedBalance = 0;
  pSnap.forEach(d => {
    const tx = d.data();
    if (tx.status === 'completed') {
      calculatedBalance += tx.amount;
    }
  });

  const ledgerSnap = await getDoc(doc(db, 'platformLedger', 'master'));
  const storedBalance = ledgerSnap.exists() ? ledgerSnap.data().totalRevenue || 0 : 0;

  return { calculatedBalance, storedBalance, isMatch: Math.abs(calculatedBalance - storedBalance) < 0.01 };
};

export const validateSettlementIntegrity = async (settlementId: string) => {
  const reqSnap = await getDoc(doc(db, 'settlementRequests', settlementId));
  if (!reqSnap.exists()) return null;
  const req = reqSnap.data();

  // Validate the withdrawal matches the ledger transaction
  const qTx = query(
    collection(db, req.userType === 'vendor' ? 'vendorTransactions' : 'driverTransactions'), 
    where('referenceId', '==', settlementId)
  );
  const txSnap = await getDocs(qTx);
  let ledgerRecordedAmount = 0;
  txSnap.forEach(t => ledgerRecordedAmount += t.data().amount);

  // Note: withdrawal ledger amount is usually negative since it's a debit
  return { 
    requestedAmount: req.amount, 
    ledgerRecordedAmount, 
    isMatch: Math.abs(req.amount - Math.abs(ledgerRecordedAmount)) < 0.01 
  };
};

export const detectLedgerMismatch = async () => {
  // Broad sweep to check integrity. In a massive DB this should be a cloud function
  const platform = await validatePlatformRevenue();
  return {
    platformMatch: platform.isMatch,
    platformDiff: platform.calculatedBalance - platform.storedBalance
  };
};
