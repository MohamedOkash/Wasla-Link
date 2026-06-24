import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { db } from '../../services/firebase';
import { collection, query, getDocs, doc, orderBy, where } from 'firebase/firestore';
import { verifyPayment, processRefund } from '../../services/payment.service';
import { detectMismatches } from '../../services/reconciliation.service';
import { useApp } from '../../contexts/AppContext';

export function PaymentCenter() {
  const { t } = useTranslation();
  const { currentUser: admin } = useApp();
  const [payments, setPayments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'failed' | 'refunds' | 'reconciliation'>('pending');
  const [mismatches, setMismatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'reconciliation') {
        const res = await detectMismatches();
        setMismatches(res.mismatches);
      } else {
        let statusFilter = activeTab === 'verified' ? 'paid' : activeTab;
        if (activeTab === 'refunds') statusFilter = 'refunded';
        
        const q = query(collection(db, 'payments'), where('status', '==', statusFilter), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPayments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (paymentId: string, orderId: string) => {
    try {
      await verifyPayment(paymentId, orderId, 'paid', admin?.uid);
      setPayments(prev => prev.filter(p => p.id !== paymentId));
      alert(t('paymentVerified'));
    } catch (err) {
      alert(t('verificationFailed'));
    }
  };

  const handleReject = async (paymentId: string, orderId: string) => {
    try {
      await verifyPayment(paymentId, orderId, 'failed', admin?.uid);
      setPayments(prev => prev.filter(p => p.id !== paymentId));
      alert(t('paymentRejected'));
    } catch (err) {
      alert(t('rejectionFailed'));
    }
  };

  const handleRefund = async (paymentId: string, orderId: string, amount: number) => {
    const reason = prompt(t('enterRefundReason'));
    if (!reason) return;
    try {
      await processRefund(paymentId, orderId, amount, reason, admin?.uid!);
      alert(t('refundProcessed'));
      loadData();
    } catch (err) {
      alert(t('refundFailed'));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('paymentCenter')}</h1>
      
      <div className="flex gap-4 mb-6 border-b border-theme-border/60 pb-2 overflow-x-auto">
        {['pending', 'verified', 'failed', 'refunds', 'reconciliation'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-xl font-bold capitalize whitespace-nowrap ${
              activeTab === tab ? 'bg-theme-primary text-white' : 'bg-theme-bg text-theme-text/70'
            }`}
          >
            {t(tab)}
          </button>
        ))}
      </div>

      <div className="bg-theme-card rounded-2xl border border-theme-border/60 overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">{t('loading')}</div>
        ) : activeTab === 'reconciliation' ? (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">{t('mismatchedOrders')}</h2>
            {mismatches.length === 0 ? (
              <p className="text-green-500 font-bold">{t('allOrdersReconciled')}</p>
            ) : (
              <div className="space-y-4">
                {mismatches.map((m, i) => (
                  <div key={i} className="p-4 border border-red-500 rounded-xl bg-red-500/10">
                    <p className="font-bold">{t('str_281')}: {m.orderId}</p>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <p>{t('orderTotal')}: {m.orderTotal}</p>
                      <p>{t('paymentAmt')}: {m.paymentAmount}</p>
                      <p>{t('ledgerAmt')}: {m.ledgerAmount}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-theme-bg/50 border-b border-theme-border/60">
              <tr>
                <th className="p-4">{t('paymentId')}</th>
                <th className="p-4">{t('method')}</th>
                <th className="p-4">{t('amount')}</th>
                <th className="p-4">{t('status')}</th>
                <th className="p-4">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border/60">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-theme-text/50">{t('noPaymentsFound')}</td>
                </tr>
              ) : (
                payments.map(p => (
                  <tr key={p.id}>
                    <td className="p-4 font-mono text-sm">{p.id}</td>
                    <td className="p-4">{p.method}</td>
                    <td className="p-4 font-bold">{p.amount} EGP</td>
                    <td className="p-4 uppercase text-xs font-bold">{p.status}</td>
                    <td className="p-4 flex gap-2">
                      {activeTab === 'pending' && (
                        <>
                          <button onClick={() => handleVerify(p.id, p.orderId)} className="bg-green-500 text-white px-3 py-1 rounded">{t('verify')}</button>
                          <button onClick={() => handleReject(p.id, p.orderId)} className="bg-red-500 text-white px-3 py-1 rounded">{t('reject')}</button>
                        </>
                      )}
                      {activeTab === 'verified' && (
                        <button onClick={() => handleRefund(p.id, p.orderId, p.amount)} className="bg-orange-500 text-white px-3 py-1 rounded">{t('refund')}</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
