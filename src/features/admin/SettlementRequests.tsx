import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, getDocs, doc, updateDoc, writeBatch, serverTimestamp, getDoc } from 'firebase/firestore';
import { SettlementRequest, LedgerTransaction } from '../../types/financial';
import { useTranslation } from '../../hooks/useTranslation';
import { useApp } from '../../contexts/AppContext';

export function SettlementRequests() {
  const { t } = useTranslation();
  const { showToast } = useApp();
  const [requests, setRequests] = useState<SettlementRequest[]>([]);

  useEffect(() => {
    async function fetchRequests() {
      const snap = await getDocs(query(collection(db, 'settlementRequests')));
      const reqs: SettlementRequest[] = [];
      snap.forEach(d => reqs.push({ id: d.id, ...d.data() } as SettlementRequest));
      setRequests(reqs.sort((a, b) => b.requestedAt - a.requestedAt));
    }
    fetchRequests();
  }, []);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return t('statusPending');
      case 'approved': return t('statusApproved');
      case 'paid': return t('statusPaid');
      case 'rejected': return t('statusRejected');
      default: return status;
    }
  };

  const handleAction = async (req: SettlementRequest, action: 'approved' | 'rejected' | 'paid') => {
    try {
      const batch = writeBatch(db);
      
      const isVendor = req.userType === 'vendor';
      const walletCollection = isVendor ? 'vendorWallets' : 'driverWallets';
      const txCollection = isVendor ? 'vendorTransactions' : 'driverTransactions';

      const walletRef = doc(db, walletCollection, req.userId);
      const walletSnap = await getDoc(walletRef);
      const wData = walletSnap.exists() ? walletSnap.data() : { balance: 0, pendingBalance: 0, paidBalance: 0 };
      
      let newBalance = wData.balance || 0;
      let newPending = wData.pendingBalance || 0;
      let newPaid = wData.paidBalance || 0;

      if (action === 'approved') {
        newPending += req.amount;
        newBalance -= req.amount;
      } else if (action === 'rejected') {
        // If it was previously approved, we need to return from pending to balance.
        // Assuming rejection from 'pending' state
        if (req.status === 'approved') {
          newPending -= req.amount;
          newBalance += req.amount;
        }
      } else if (action === 'paid') {
        // If it was approved, deduct from pending. Otherwise deduct from balance directly if skipped approval.
        if (req.status === 'approved') {
          newPending -= req.amount;
        } else {
          newBalance -= req.amount;
        }
        newPaid += req.amount;

        // Create transaction
        const txRef = doc(collection(db, txCollection));
        batch.set(txRef, {
          id: txRef.id,
          type: isVendor ? 'vendor_settlement' : 'driver_withdrawal',
          referenceId: req.id,
          [isVendor ? 'vendorId' : 'driverId']: req.userId,
          amount: -req.amount,
          currency: 'EGP',
          status: 'completed',
          createdAt: serverTimestamp(),
          metadata: { note: 'Settlement Paid' }
        } as LedgerTransaction);
      }

      batch.set(walletRef, {
        balance: newBalance,
        pendingBalance: newPending,
        paidBalance: newPaid,
        updatedAt: serverTimestamp()
      }, { merge: true });

      const reqRef = doc(db, 'settlementRequests', req.id);
      batch.update(reqRef, {
        status: action,
        processedAt: serverTimestamp(),
        processedBy: 'admin'
      });

      await batch.commit();
      
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: action } : r));
    } catch (err) {
      console.error(err);
      showToast(t('actionFailed'));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('settlementProcessing')}</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 font-medium text-gray-500">{t('userId')}</th>
              <th className="p-4 font-medium text-gray-500">{t('type')}</th>
              <th className="p-4 font-medium text-gray-500">{t('amount')}</th>
              <th className="p-4 font-medium text-gray-500">{t('status')}</th>
              <th className="p-4 font-medium text-gray-500">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {requests.map(req => (
              <tr key={req.id}>
                <td className="p-4 font-mono text-sm">{req.userId || (req as any).storeId}</td>
                <td className="p-4 capitalize">{req.userType || 'vendor'}</td>
                <td className="p-4 font-bold">{req.amount.toFixed(2)} {t('currencyEGP')}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                    ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                    ${req.status === 'approved' ? 'bg-blue-100 text-blue-700' : ''}
                    ${req.status === 'paid' ? 'bg-green-100 text-green-700' : ''}
                    ${req.status === 'rejected' ? 'bg-red-100 text-red-700' : ''}
                  `}>
                    {getStatusLabel(req.status)}
                  </span>
                </td>
                <td className="p-4 flex gap-2">
                  {req.status === 'pending' && (
                    <>
                      <button onClick={() => handleAction(req, 'approved')} className="text-sm bg-blue-500 text-white px-3 py-1 rounded">{t('approveBtn')}</button>
                      <button onClick={() => handleAction(req, 'rejected')} className="text-sm bg-red-500 text-white px-3 py-1 rounded">{t('rejectBtn')}</button>
                    </>
                  )}
                  {(req.status === 'pending' || req.status === 'approved') && (
                    <button onClick={() => handleAction(req, 'paid')} className="text-sm bg-green-500 text-white px-3 py-1 rounded">{t('markPaid')}</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
