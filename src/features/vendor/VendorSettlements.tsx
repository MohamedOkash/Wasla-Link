import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { SettlementRequest } from '../../types/financial';
import { useTranslation } from '../../hooks/useTranslation';

export function VendorSettlements() {
  const { t } = useTranslation();
  const { currentUser: user, showToast } = useApp();
  const [balance, setBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [paidBalance, setPaidBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<SettlementRequest[]>([]);
  const [amountInput, setAmountInput] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const walletRef = doc(db, 'vendorWallets', user.uid);
        const snap = await getDoc(walletRef);
        if (snap.exists()) {
          const data = snap.data();
          setBalance(data.balance || 0);
          setPendingBalance(data.pendingBalance || 0);
          setPaidBalance(data.paidBalance || 0);
        }

        const q = query(collection(db, 'settlementRequests'), where('userId', '==', user.uid), orderBy('requestedAt', 'desc'));
        const reqSnap = await getDocs(q);
        const reqs: SettlementRequest[] = [];
        reqSnap.forEach(d => reqs.push({ id: d.id, ...d.data() } as SettlementRequest));
        setHistory(reqs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return t('statusPending');
      case 'approved': return t('statusApproved');
      case 'paid': return t('statusPaid');
      case 'rejected': return t('statusRejected');
      default: return status;
    }
  };

  const requestWithdrawal = async () => {
    const amt = parseFloat(amountInput);
    if (isNaN(amt) || amt <= 0) { showToast(t('enterValidAmount')); return; }
    if (amt > balance) { showToast(t('insufficientBalance')); return; }
    
    try {
      await addDoc(collection(db, 'settlementRequests'), {
        userId: user?.uid,
        userType: 'vendor',
        amount: amt,
        status: 'pending',
        requestedAt: serverTimestamp()
      });
      showToast(t('withdrawalSubmitted'));
      setAmountInput('');
      // Optimistic update
      setHistory(prev => [{
        id: 'temp',
        userId: user?.uid!,
        userType: 'vendor',
        amount: amt,
        status: 'pending',
        requestedAt: new Date()
      }, ...prev]);
    } catch (err) {
      console.error(err);
      showToast(t('withdrawalFailed'));
    }
  };

  if (loading) return <div>{t('loading')}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-theme-text pb-20">
      <h1 className="text-2xl font-bold mb-6">{t('vendorWallet')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-theme-primary to-purple-600 p-6 rounded-2xl text-white shadow-lg">
          <p className="text-white/80 font-medium">{t('availableEarnings')}</p>
          <p className="text-4xl font-bold mt-1">{balance.toFixed(2)} {t('currencyEGP')}</p>
        </div>
        <div className="bg-theme-card p-6 rounded-2xl border border-theme-border/60 shadow-sm">
          <p className="text-theme-text/70 font-medium">{t('pendingApprovals')}</p>
          <p className="text-3xl font-bold mt-1 text-yellow-500">{pendingBalance.toFixed(2)} {t('currencyEGP')}</p>
        </div>
        <div className="bg-theme-card p-6 rounded-2xl border border-theme-border/60 shadow-sm">
          <p className="text-theme-text/70 font-medium">{t('totalPaidOut')}</p>
          <p className="text-3xl font-bold mt-1 text-green-500">{paidBalance.toFixed(2)} {t('currencyEGP')}</p>
        </div>
      </div>

      <div className="bg-theme-card p-6 rounded-2xl border border-theme-border/60 mt-6">
        <h2 className="text-xl font-bold mb-4">{t('requestWithdrawal')}</h2>
        <div className="flex gap-4">
          <input 
            type="number" 
            value={amountInput}
            onChange={e => setAmountInput(e.target.value)}
            placeholder={t('amountInEGP')}
            className="flex-1 bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-theme-text"
          />
          <button 
            onClick={requestWithdrawal}
            className="bg-theme-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90"
          >
            <ArrowUpRight className="w-5 h-5" />
            {t('withdrawBtn')}
          </button>
        </div>
      </div>

      <div className="bg-theme-card rounded-2xl border border-theme-border/60 overflow-hidden mt-6">
        <div className="p-6 border-b border-theme-border/60">
          <h2 className="text-xl font-bold">{t('settlementHistory')}</h2>
        </div>
        <div className="divide-y divide-theme-border/60">
          {history.length === 0 ? (
            <div className="p-6 text-center text-theme-text/60">{t('noSettlementRequests')}</div>
          ) : (
            history.map((req, i) => (
              <div key={req.id || i} className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {req.status === 'pending' && <Clock className="w-8 h-8 text-yellow-500" />}
                  {req.status === 'approved' && <CheckCircle className="w-8 h-8 text-blue-500" />}
                  {req.status === 'paid' && <CheckCircle className="w-8 h-8 text-green-500" />}
                  {req.status === 'rejected' && <XCircle className="w-8 h-8 text-red-500" />}
                  <div>
                    <p className="font-bold">{req.amount.toFixed(2)} {t('currencyEGP')}</p>
                    <p className="text-sm text-theme-text/60">
                      {req.requestedAt?.toDate ? req.requestedAt.toDate().toLocaleDateString() : t('justNow')}
                    </p>
                  </div>
                </div>
                <div className={`px-4 py-1 rounded-full text-sm font-bold uppercase
                  ${req.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : ''}
                  ${req.status === 'approved' ? 'bg-blue-500/10 text-blue-500' : ''}
                  ${req.status === 'paid' ? 'bg-green-500/10 text-green-500' : ''}
                  ${req.status === 'rejected' ? 'bg-red-500/10 text-red-500' : ''}
                `}>
                  {getStatusLabel(req.status)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
