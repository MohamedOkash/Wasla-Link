import { db } from './firebase';
import { collection, doc, addDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';

export type PaymentMethod = 'cash_on_delivery' | 'instapay' | 'paymob_card' | 'paymob_wallet';
export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded' | 'cancelled';

export const initiatePayment = async (orderId: string, method: PaymentMethod, amount: number, metadata?: any) => {
  try {
    const paymentRef = await addDoc(collection(db, 'payments'), {
      orderId,
      method,
      amount,
      status: 'pending',
      metadata: metadata || {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await updateDoc(doc(db, 'orders', orderId), {
      paymentStatus: 'pending',
      paymentMethod: method,
      paymentId: paymentRef.id,
      updatedAt: serverTimestamp()
    });

    // Simulated Paymob URL return
    if (method.startsWith('paymob')) {
      return { success: true, paymentId: paymentRef.id, redirectUrl: `https://accept.paymob.com/api/acceptance/iframes/dummy?payment_token=dummy_${paymentRef.id}` };
    }

    return { success: true, paymentId: paymentRef.id };
  } catch (error) {
    console.error('Payment Initiation Failed:', error);
    throw error;
  }
};

export const verifyPayment = async (paymentId: string, orderId: string, status: PaymentStatus, verifierId?: string) => {
  try {
    await updateDoc(doc(db, 'payments', paymentId), {
      status,
      verifiedAt: serverTimestamp(),
      verifiedBy: verifierId || 'system',
      updatedAt: serverTimestamp()
    });

    await updateDoc(doc(db, 'orders', orderId), {
      paymentStatus: status,
      paymentVerifiedAt: serverTimestamp(),
      paymentVerifiedBy: verifierId || 'system',
      updatedAt: serverTimestamp()
    });

    await addDoc(collection(db, 'paymentLogs'), {
      paymentId,
      orderId,
      action: 'verify',
      status,
      userId: verifierId || 'system',
      timestamp: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Payment Verification Failed:', error);
    throw error;
  }
};

export const processRefund = async (paymentId: string, orderId: string, amount: number, reason: string, adminId: string) => {
  try {
    // 1. Record Refund Request
    const refundRef = await addDoc(collection(db, 'refundRequests'), {
      paymentId,
      orderId,
      amount,
      reason,
      status: 'processed',
      requestedBy: adminId,
      createdAt: serverTimestamp(),
      processedAt: serverTimestamp()
    });

    // 2. Update Payment Status
    await updateDoc(doc(db, 'payments', paymentId), {
      status: 'refunded',
      refundId: refundRef.id,
      updatedAt: serverTimestamp()
    });

    // 3. Update Order Status
    await updateDoc(doc(db, 'orders', orderId), {
      paymentStatus: 'refunded',
      updatedAt: serverTimestamp()
    });

    await addDoc(collection(db, 'paymentLogs'), {
      paymentId,
      orderId,
      action: 'refund',
      status: 'refunded',
      userId: adminId,
      timestamp: serverTimestamp(),
      metadata: { reason, amount }
    });

    return { success: true, refundId: refundRef.id };
  } catch (error) {
    console.error('Refund Processing Failed:', error);
    throw error;
  }
};
