import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

export function DriverWallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    async function loadWallet() {
      if (!user) return;
      const walletRef = doc(db, 'driverWallets', user.uid);
      const snap = await getDoc(walletRef);
      if (snap.exists()) {
        setBalance(snap.data().balance || 0);
      }
    }
    loadWallet();
  }, [user]);

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold mb-4">Driver Wallet</h1>
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-2xl text-white shadow-lg">
        <p className="text-white/80 font-medium">Available Earnings</p>
        <p className="text-4xl font-bold mt-1">{balance.toFixed(2)} EGP</p>
      </div>
    </div>
  );
}
