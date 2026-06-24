import { useTranslation } from '../../hooks/useTranslation';
import React, { useState, useEffect } from 'react';
import { ShoppingBag, ClipboardList, Tag, Settings, LogOut, Store as StoreIcon, BarChart3, TrendingUp, DollarSign, AlertTriangle, ArrowRight, Megaphone, RotateCcw, Star, Reply } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { VendorOrders } from './VendorOrders';
import { VendorProducts } from './VendorProducts';
import { VendorOffers } from './VendorOffers';
import { VendorSettings } from './VendorSettings';
import { VendorReports } from './VendorReports';
import { VendorCampaigns } from './VendorCampaigns';
import { VendorCatalogBuilder } from './VendorCatalogBuilder';
import { onSnapshot, collection, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';

// Premium Rebuild Imports
import { PremiumCard } from '../../components/premium/PremiumCard';
import { PremiumStatCard } from '../../components/premium/PremiumStatCard';
import { PremiumButton } from '../../components/premium/PremiumButton';
import { PremiumBadge } from '../../components/premium/PremiumBadge';
import { PremiumInput } from '../../components/premium/PremiumInput';
import { useProducts } from '../../hooks/useProducts';

export const VendorDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { goHome,  orders, theme, isRTL, walletTransactions, walletSettlements, addSettlement, returnRequests, updateReturnStatus, showToast } = useApp();
  const { products } = useProducts();;
  const [activeTab, setActiveTab] = useState<'dashboard' | 'catalog_builder' | 'orders' | 'products' | 'offers' | 'campaigns' | 'reports' | 'wallet' | 'settings' | 'returns' | 'reviews'>('dashboard');

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'vodafone' | 'instapay' | 'bank'>('vodafone');
  const [withdrawDetails, setWithdrawDetails] = useState('');

  const [vendorReviews, setVendorReviews] = useState<any[]>([]);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    const q = query(collection(db, 'reviews'));
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const vendorProductIds = new Set(products.filter(p => p.storeId === 'g_1').map(p => p.id));
      const filtered = list.filter((r: any) => vendorProductIds.has(r.productId));
      filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setVendorReviews(filtered);
    });
    return unsub;
  }, [products]);

  const handleSubmitReply = async (reviewId: string) => {
    const replyText = replyTexts[reviewId] || '';
    if (!replyText.trim()) return;

    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        vendorReply: replyText,
        vendorReplyCreatedAt: new Date().toISOString()
      });
      showToast(t('str_760'));
      setReplyTexts(prev => ({ ...prev, [reviewId]: '' }));
    } catch (err) {
      console.error('Error submitting vendor reply:', err);
      showToast(t('str_761'));
    }
  };

  // Filter vendor metrics (using store g_1 for Al-Khair Markets)
  const vendorOrders = orders.filter(o => o.shopId === 'g_1');
  const vendorProducts = products.filter(p => p.storeId === 'g_1');
  const deliveredOrders = vendorOrders.filter(o => o.status === 'delivered');

  // Dashboard Stats calculations
  const totalSales = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
  const lowStockProducts = vendorProducts.filter(p => (p.currentStock || 0) <= (p.lowStockThreshold || 10));
  const recentOrders = vendorOrders.slice(0, 4);

  // Wallet balances calculations
  const pendingBalance = vendorOrders.filter(o => ['accepted', 'preparing', 'readyForPickup', 'pickedUp', 'onTheWay'].includes(o.status)).reduce((sum, o) => sum + o.subtotal, 0);
  const totalDeliveredSubtotal = deliveredOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const completedSettlementsAmount = walletSettlements.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.amount, 0);
  const availableBalance = Math.max(0, totalDeliveredSubtotal - completedSettlementsAmount);
  const pendingSettlementsAmount = walletSettlements.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.amount, 0);
  const withdrawableBalance = Math.max(0, availableBalance - pendingSettlementsAmount);

  // Best Selling Products calculations
  const productSalesMap: Record<string, { name: string; qty: number }> = {};
  deliveredOrders.forEach(order => {
    order.items.forEach(item => {
      if (!productSalesMap[item.id]) {
        productSalesMap[item.id] = { name: item.name, qty: 0 };
      }
      productSalesMap[item.id].qty += item.quantity;
    });
  });
  const bestSellers = Object.values(productSalesMap).sort((a,b) => b.qty - a.qty).slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen bg-[#080C14] text-[#F9FAFB] theme-transition pb-20">
      {/* Top Premium SaaS Header */}
      <div className="bg-[#111827] px-5 pt-12 pb-4 shadow-sm border-b border-[#1F2937] flex justify-between items-center sticky top-0 z-30 theme-transition">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-white p-2.5 rounded-2xl shadow shadow-primary/20">
            <StoreIcon size={20} />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-[#F9FAFB]">{t('str_762')}</h1>
            <p className="text-[10px] text-[#9CA3AF] font-bold mt-0.5">{t('str_763')}</p>
          </div>
        </div>
        
        <PremiumButton 
          onClick={goHome} 
          variant="danger"
          size="sm"
          className="rounded-xl h-9.5 w-9.5 p-0 flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
        >
          <LogOut size={16} />
        </PremiumButton>
      </div>

      {/* Tabs Menu Navigation (Horizontal Scroll) */}
      <div className="bg-[#111827] px-4 py-2.5 border-b border-[#1F2937] flex overflow-x-auto no-scrollbar gap-2 z-20 theme-transition">
        {[
          { id: 'dashboard', label: t('str_360'), icon: BarChart3 },
          { id: 'catalog_builder', label: t('str_764'), icon: StoreIcon },
          { id: 'orders', label: t('str_365'), icon: ClipboardList },
          { id: 'products', label: t('str_765'), icon: ShoppingBag },
          { id: 'offers', label: t('str_766'), icon: Tag },
          { id: 'returns', label: t('str_767'), icon: RotateCcw },
          { id: 'campaigns', label: t('str_768'), icon: Megaphone },
          { id: 'reports', label: t('str_769'), icon: TrendingUp },
          { id: 'wallet', label: t('str_770'), icon: DollarSign },
          { id: 'reviews', label: t('str_771'), icon: Star },
          { id: 'settings', label: t('str_772'), icon: Settings },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all flex-shrink-0 text-xs font-black border ${
              activeTab === tab.id 
                ? 'bg-primary text-white border-primary shadow shadow-primary/20' 
                : 'text-[#9CA3AF] border-[#1F2937] hover:text-[#F9FAFB] hover:bg-[#1F2937]'
            }`}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Tab View */}
      <div className="p-5 flex-1 max-w-[1200px] w-full mx-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            
            {/* Quick Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PremiumStatCard 
                title={t('str_773')}
                value={`${totalSales} ${t('currencyEGP')}`}
                change={t('str_774')}
                changeType="positive"
                icon={<DollarSign size={16} />}
                sparklinePath="M 10 25 Q 30 15, 50 20 T 90 10"
                className="bg-[#111827] border-[#1F2937]"
              />

              <PremiumStatCard 
                title={t('str_775')}
                value={`${vendorOrders.length} ${t('ordersLabel')}`}
                change={`${vendorOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length} ${t('active')}`}
                changeType="neutral"
                icon={<ClipboardList size={16} />}
                sparklinePath="M 10 20 Q 30 25, 50 15 T 90 22"
                className="bg-[#111827] border-[#1F2937]"
              />

              <PremiumStatCard 
                title={t('str_776')}
                value={`${vendorProducts.length} ${t('product')}`}
                change={t('str_777')}
                changeType={lowStockProducts.length > 0 ? 'negative' : 'neutral'}
                icon={<ShoppingBag size={16} />}
                sparklinePath="M 10 15 Q 30 10, 50 20 T 90 12"
                className="bg-[#111827] border-[#1F2937]"
              />
            </div>

            {/* Low stock Alert */}
            {lowStockProducts.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3.5 items-center animate-fade-in">
                <div className="bg-red-500/20 p-2.5 rounded-xl text-red-500">
                  <AlertTriangle size={18} />
                </div>
                <div className="flex-1 text-right">
                  <h4 className="text-xs font-black text-red-300">{t('str_778')}</h4>
                  <p className="text-[10px] text-red-400 font-bold mt-0.5">{t('str_779')}</p>
                </div>
                <PremiumButton 
                  onClick={() => setActiveTab('products')}
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-red-500/30 text-red-500 hover:bg-red-500/10 text-[9px] font-black"
                >
                  {t('str_780')}
                </PremiumButton>
              </div>
            )}

            {/* Side-by-side grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              
              {/* Best Selling Products Panel */}
              <PremiumCard hoverable={false} className="bg-[#111827] border-[#1F2937] p-5">
                <h3 className="font-black text-[#F9FAFB] text-xs mb-4 uppercase tracking-wider">{t('str_781')}</h3>
                {bestSellers.length === 0 ? (
                  <p className="text-xs text-[#9CA3AF] text-center py-8 font-bold">{t('str_782')}</p>
                ) : (
                  <div className="space-y-3.5">
                    {bestSellers.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs font-bold border-b border-[#1F2937] pb-3 last:border-0 last:pb-0">
                        <span className="text-[#F9FAFB]">{item.name}</span>
                        <PremiumBadge variant="primary" pill={true}>
                          {item.qty} {t('str_783')}
                        </PremiumBadge>
                      </div>
                    ))}
                  </div>
                )}
              </PremiumCard>

              {/* Recent Orders activity */}
              <PremiumCard hoverable={false} className="bg-[#111827] border-[#1F2937] p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-[#F9FAFB] text-xs uppercase tracking-wider">{t('str_784')}</h3>
                  <button 
                    onClick={() => setActiveTab('orders')} 
                    className="text-[10px] text-primary font-black flex items-center gap-0.5"
                  >
                    <span>{t('str_785')}</span> 
                    <ArrowRight size={12} className={isRTL ? 'rotate-180' : ''} />
                  </button>
                </div>
                {recentOrders.length === 0 ? (
                  <p className="text-xs text-[#9CA3AF] text-center py-8 font-bold">{t('str_786')}</p>
                ) : (
                  <div className="space-y-3.5">
                    {recentOrders.map(order => (
                      <div key={order.id} className="flex justify-between items-center border-b border-[#1F2937] pb-3 last:border-0 last:pb-0 text-right">
                        <div>
                          <h4 className="font-black text-xs text-[#F9FAFB]">{t('str_787')}</h4>
                          <p className="text-[9px] text-[#9CA3AF] font-bold mt-0.5 font-sans">
                            {new Date(order.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-black text-[#F9FAFB] font-sans">{order.total} {t('currencyEGP')}</p>
                          <span className="text-[9px] font-bold text-primary">
                            {order.status === 'delivered' ? (t('str_190')) : (t('str_659'))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </PremiumCard>
            </div>
          </div>
        )}

        {activeTab === 'catalog_builder' && <VendorCatalogBuilder />}
        {activeTab === 'orders' && <VendorOrders />}
        {activeTab === 'products' && <VendorProducts />}
        {activeTab === 'offers' && <VendorOffers />}
        {activeTab === 'campaigns' && <VendorCampaigns />}
        {activeTab === 'reports' && <VendorReports />}
        {activeTab === 'wallet' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PremiumCard hoverable={false} className="bg-[#111827] border-[#1F2937] p-5">
                <span className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-wider block mb-1">{t('str_788')}</span>
                <h2 className="text-3xl font-black text-primary font-sans">{withdrawableBalance} {t('currencyEGP')}</h2>
                <p className="text-[9px] text-[#9CA3AF] font-bold mt-1.5">{t('str_789')}</p>
              </PremiumCard>

              <PremiumCard hoverable={false} className="bg-[#111827] border-[#1F2937] p-5">
                <span className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-wider block mb-1">{t('str_790')}</span>
                <h2 className="text-3xl text-amber-500 font-black font-sans">{pendingBalance} {t('currencyEGP')}</h2>
                <p className="text-[9px] text-[#9CA3AF] font-bold mt-1.5">{t('str_791')}</p>
              </PremiumCard>
            </div>

            {/* Withdraw request form */}
            <PremiumCard hoverable={false} className="bg-[#111827] border-[#1F2937] p-5">
              <h3 className="font-black text-[#F9FAFB] text-xs mb-4 uppercase tracking-wider">{t('str_792')}</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const amt = parseFloat(withdrawAmount);
                if (isNaN(amt) || amt <= 0 || amt > withdrawableBalance) {
                  showToast(t('str_793'));
                  return;
                }
                addSettlement(amt, withdrawMethod, withdrawDetails);
                setWithdrawAmount('');
                setWithdrawDetails('');
                showToast(t('str_794'));
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PremiumInput 
                    label={t('str_795')}
                    type="number" 
                    value={withdrawAmount} 
                    onChange={e => setWithdrawAmount(e.target.value)} 
                    placeholder="0.00"
                    required
                  />
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-wider">
                      {t('str_796')}
                    </label>
                    <select
                      value={withdrawMethod}
                      onChange={e => setWithdrawMethod(e.target.value as any)}
                      className="w-full bg-[#080C14] border border-[#1F2937] rounded-xl p-3 text-xs font-black text-[#F9FAFB] outline-none focus:border-primary"
                    >
                      <option value="vodafone">{t('str_124')}</option>
                      <option value="instapay">{t('str_797')}</option>
                      <option value="bank">{t('str_798')}</option>
                    </select>
                  </div>
                </div>

                <PremiumInput 
                  label={t('str_799')}
                  type="text" 
                  value={withdrawDetails} 
                  onChange={e => setWithdrawDetails(e.target.value)} 
                  placeholder={t('str_800')}
                  required
                />

                <PremiumButton type="submit" variant="primary" size="md" className="w-full shadow-sm rounded-xl h-11 text-xs font-black">
                  {t('str_801')}
                </PremiumButton>
              </form>
            </PremiumCard>
          </div>
        )}

        {/* Reviews Reply Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <h3 className="font-black text-[#F9FAFB] text-xs uppercase tracking-wider mb-2">{t('str_802')}</h3>
            {vendorReviews.length === 0 ? (
              <p className="text-xs text-[#9CA3AF] text-center py-12 font-bold">{t('str_803')}</p>
            ) : (
              <div className="space-y-4">
                {vendorReviews.map(r => {
                  const prod = products.find(p => p.id === r.productId);
                  return (
                    <PremiumCard key={r.id} hoverable={false} className="bg-[#111827] border-[#1F2937] p-4.5 space-y-3 text-right">
                      <div className="flex justify-between items-start border-b border-[#1F2937] pb-2.5 flex-wrap gap-2">
                        <div>
                          <h4 className="font-black text-xs text-[#F9FAFB]">{prod?.name || (t('str_804'))}</h4>
                          <span className="text-[9px] text-[#9CA3AF] font-bold mt-1 block">
                            {new Date(r.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                          </span>
                        </div>
                        <div className="flex gap-0.5 text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={10} fill={i < r.rating ? 'currentColor' : 'none'} />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-[#9CA3AF] leading-relaxed font-bold">{r.comment}</p>
                      
                      {r.images && r.images.length > 0 && (
                        <div className="flex gap-1.5 pt-1">
                          {r.images.map((img: string, idx: number) => (
                            <img key={idx} src={img} className="w-12 h-12 object-cover rounded-xl border border-[#1F2937]" alt="Review visual" />
                          ))}
                        </div>
                      )}

                      {r.vendorReply ? (
                        <div className="bg-[#080C14] border border-[#1F2937] p-3 rounded-xl text-[10px] font-bold text-[#9CA3AF] mt-2.5">
                          <p className="font-black text-primary mb-1 flex items-center gap-1">
                            <Reply size={11} />
                            {t('str_805')}
                          </p>
                          <p>{r.vendorReply}</p>
                        </div>
                      ) : (
                        <div className="space-y-2 pt-2 border-t border-[#1F2937]/80">
                          <span className="text-[9.5px] font-black text-[#9CA3AF] uppercase tracking-wider block">{t('str_806')}</span>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={replyTexts[r.id] || ''}
                              onChange={e => setReplyTexts(prev => ({ ...prev, [r.id]: e.target.value }))}
                              placeholder={t('str_807')}
                              className="flex-1 bg-[#080C14] border border-[#1F2937] rounded-xl px-3 py-2 text-xs font-bold outline-none text-[#F9FAFB] focus:border-primary"
                            />
                            <PremiumButton 
                              onClick={() => handleSubmitReply(r.id)}
                              variant="primary"
                              size="sm"
                              className="rounded-xl font-black text-[10px] h-9 px-4"
                            >
                              {t('str_158')}
                            </PremiumButton>
                          </div>
                        </div>
                      )}
                    </PremiumCard>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Returns Management Tab */}
        {activeTab === 'returns' && (
          <div className="space-y-4">
            <h3 className="font-black text-[#F9FAFB] text-xs uppercase tracking-wider mb-2">{t('str_808')}</h3>
            {returnRequests.length === 0 ? (
              <p className="text-xs text-[#9CA3AF] text-center py-12 font-bold">{t('str_809')}</p>
            ) : (
              <div className="space-y-4">
                {returnRequests.map(req => (
                  <PremiumCard key={req.id} hoverable={false} className="bg-[#111827] border-[#1F2937] p-4.5 space-y-3 text-right">
                    <div className="flex justify-between items-start border-b border-[#1F2937] pb-2.5 flex-wrap gap-2">
                      <div>
                        <h4 className="font-black text-xs text-[#F9FAFB]">{t('str_810')}</h4>
                        <span className="text-[9px] text-[#9CA3AF] font-bold mt-1 block">
                          {t('typeLabel')}: {req.type}
                        </span>
                      </div>
                      <PremiumBadge 
                        variant={req.status === 'approved' || req.status === 'completed' ? 'success' : req.status === 'rejected' ? 'danger' : 'warning'}
                        pill={true}
                      >
                        {req.status}
                      </PremiumBadge>
                    </div>

                    <p className="text-xs text-[#9CA3AF] leading-relaxed font-bold"><span className="text-[#F9FAFB] font-black">{t('str_811')}</span> {req.reason}</p>

                    {req.status === 'submitted' && (
                      <div className="flex gap-3 pt-2.5 border-t border-[#1F2937]">
                        <PremiumButton
                          onClick={() => {
                            updateReturnStatus(req.id, 'rejected', 'Rejected by store');
                            showToast(t('str_812'));
                          }}
                          variant="danger"
                          size="sm"
                          className="flex-1 rounded-xl text-[10px] font-black h-9 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20"
                        >
                          {t('str_813')}
                        </PremiumButton>
                        <PremiumButton
                          onClick={() => {
                            updateReturnStatus(req.id, 'approved', 'Approved by store');
                            showToast(t('str_814'));
                          }}
                          variant="primary"
                          size="sm"
                          className="flex-1 rounded-xl text-[10px] font-black h-9 shadow-sm"
                        >
                          {t('str_815')}
                        </PremiumButton>
                      </div>
                    )}
                  </PremiumCard>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && <VendorSettings />}
      </div>
    </div>
  );
};

export default VendorDashboard;
