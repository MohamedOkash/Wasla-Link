import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, getDocs, doc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

export function SettlementRequests() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    async function fetchRequests() {
      const snap = await getDocs(query(collection(db, 'settlementRequests')));
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    fetchRequests();
  }, []);

  const handleApprove = async (req: any) => {
    const batch = writeBatch(db);
    // Deduct from wallet
    const walletRef = doc(db, 'vendorWallets', req.storeId);
    batch.update(walletRef, {
      balance: 0 // assuming full withdrawal
    });
    // Update req
    const reqRef = doc(db, 'settlementRequests', req.id);
    batch.update(reqRef, {
      status: 'paid',
      paidAt: serverTimestamp()
    });
    await batch.commit();
    setRequests(requests.map(r => r.id === req.id ? { ...r, status: 'paid' } : r));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Settlement Requests</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 font-medium text-gray-500">Store ID</th>
              <th className="p-4 font-medium text-gray-500">Amount</th>
              <th className="p-4 font-medium text-gray-500">Status</th>
              <th className="p-4 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {requests.map(req => (
              <tr key={req.id}>
                <td className="p-4">{req.storeId}</td>
                <td className="p-4 font-medium">{req.amount.toFixed(2)} EGP</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${req.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {req.status}
                  </span>
                </td>
                <td className="p-4">
                  {req.status === 'pending' && (
                    <button onClick={() => handleApprove(req)} className="text-sm bg-theme-primary text-white px-3 py-1 rounded">
                      Mark Paid
                    </button>
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
