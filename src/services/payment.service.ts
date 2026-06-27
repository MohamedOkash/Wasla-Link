import { db } from './firebase';
import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

import { PaymentResult } from '../types/providers.types';

export type PaymentMethod = 'cash_on_delivery' | 'vodafone_cash' | 'instapay';
export type PaymentStatus = 'pending' | 'pending_verification' | 'paid' | 'failed' | 'payment_failed' | 'refunded' | 'cancelled';

export const initiatePayment = async (
  orderId: string,
  method: PaymentMethod,
  amount: number,
  metadata?: any
): Promise<PaymentResult> => {
  try {
    const initialStatus: PaymentStatus = method === 'cash_on_delivery' ? 'pending' : 'pending_verification';
    
    const paymentRef = await addDoc(collection(db, 'payments'), {
      orderId,
      method,
      amount,
      status: initialStatus,
      metadata: metadata || {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await updateDoc(doc(db, 'orders', orderId), {
      paymentStatus: initialStatus,
      paymentMethod: method,
      paymentId: paymentRef.id,
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      paymentStatus: initialStatus,
      receiptUrl: metadata?.receiptUrl || undefined,
      receiptMetadata: metadata || undefined,
      transactionId: paymentRef.id
    };
  } catch (error) {
    console.error('Payment Initiation Failed:', error);
    throw error;
  }
};

import { getDoc } from 'firebase/firestore';
import { processOrderSettlement } from './revenue.service';

export const verifyPayment = async (paymentId: string, orderId: string, status: PaymentStatus, verifierId?: string) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) {
      throw new Error('Order not found');
    }
    const orderData = orderSnap.data();

    // Map verification status to order statuses per requirements
    let orderStatus = orderData.status;
    let paymentStatus = status;

    if (status === 'paid') {
      orderStatus = 'new'; // Move order to processing flow
      paymentStatus = 'paid';
    } else if (status === 'failed' || status === 'payment_failed') {
      orderStatus = 'cancelled';
      paymentStatus = 'payment_failed';
    }

    await updateDoc(doc(db, 'payments', paymentId), {
      status: paymentStatus,
      verifiedAt: serverTimestamp(),
      verifiedBy: verifierId || 'system',
      updatedAt: serverTimestamp()
    });

    await updateDoc(orderRef, {
      status: orderStatus,
      paymentStatus: paymentStatus,
      paymentVerifiedAt: serverTimestamp(),
      paymentVerifiedBy: verifierId || 'system',
      updatedAt: serverTimestamp()
    });

    await addDoc(collection(db, 'paymentLogs'), {
      paymentId,
      orderId,
      action: 'verify',
      status: paymentStatus,
      userId: verifierId || 'system',
      timestamp: serverTimestamp()
    });

    if (status === 'paid') {
      // Process financial settlement for the order
      await processOrderSettlement(orderId);
    } else if (status === 'failed' || status === 'payment_failed') {
      // Send notification to customer
      await addDoc(collection(db, 'notifications'), {
        userId: orderData.customerId,
        title: 'تم إلغاء الطلب - فشل الدفع',
        titleEn: 'Order Cancelled - Payment Failed',
        message: `تم رفض إيصال الدفع لطلبك رقم ${orderId}. تم إلغاء الطلب.`,
        messageEn: `The payment receipt for your order ${orderId} was rejected. The order has been cancelled.`,
        isRead: false,
        createdAt: serverTimestamp()
      });
    }

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
