import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';

export function VendorSettlements() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWallet() {
      if (!user) return;
      const walletRef = doc(db, 'vendorWallets', user.uid);
      const snap = await getDoc(walletRef);
      if (snap.exists()) {
        setBalance(snap.data().balance || 0);
      }
      setLoading(false);
    }
    loadWallet();
  }, [user]);

  const requestWithdrawal = async () => {
    if (balance <= 0) return alert('Insufficient balance');
    try {
      await addDoc(collection(db, 'settlementRequests'), {
        storeId: user?.uid,
        amount: balance,
        status: 'pending',
        timestamp: serverTimestamp()
      });
      alert('Withdrawal request submitted successfully.');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold mb-6">Vendor Wallet & Settlements</h1>
      <div className="bg-gradient-to-r from-theme-primary to-purple-600 p-6 rounded-2xl text-white flex justify-between items-center shadow-lg">
        <div>
          <p className="text-white/80 font-medium">Available Balance</p>
          <p className="text-4xl font-bold mt-1">{balance.toFixed(2)} EGP</p>
        </div>
        <button 
          onClick={requestWithdrawal}
          className="bg-white text-theme-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors"
        >
          <ArrowUpRight className="w-5 h-5" />
          Request Withdrawal
        </button>
      </div>
    </div>
  );
}
