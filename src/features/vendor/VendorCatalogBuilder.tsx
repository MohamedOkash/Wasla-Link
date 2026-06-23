import { useTranslation } from '../../hooks/useTranslation';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Package, Tag, Filter } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc, setDoc } from 'firebase/firestore';

import { PremiumCard } from '../../components/premium/PremiumCard';
import { PremiumButton } from '../../components/premium/PremiumButton';
import { PremiumInput } from '../../components/premium/PremiumInput';
import { PremiumBadge } from '../../components/premium/PremiumBadge';

export const VendorCatalogBuilder: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser, isRTL, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'categories' | 'subCategories' | 'brands'>('categories');
  
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  const [newItemName, setNewItemName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser?.storeId) return;

    const qCats = query(collection(db, 'vendorCategories'), where('storeId', '==', currentUser.storeId));
    const unsubCats = onSnapshot(qCats, snap => setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const qSubCats = query(collection(db, 'vendorSubCategories'), where('storeId', '==', currentUser.storeId));
    const unsubSubCats = onSnapshot(qSubCats, snap => setSubCategories(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const qBrands = query(collection(db, 'vendorBrands'), where('storeId', '==', currentUser.storeId));
    const unsubBrands = onSnapshot(qBrands, snap => setBrands(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubCats(); unsubSubCats(); unsubBrands(); };
  }, [currentUser]);

  const handleAddItem = async () => {
    if (!newItemName.trim() || !currentUser?.storeId) return;
    
    if (activeTab === 'subCategories' && !selectedParentId) {
      showToast(t('str_745'));
      return;
    }

    setLoading(true);
    try {
      const colName = activeTab === 'categories' ? 'vendorCategories' 
                    : activeTab === 'subCategories' ? 'vendorSubCategories' 
                    : 'vendorBrands';
      
      const id = Date.now().toString();
      const payload: any = {
        name: newItemName,
        storeId: currentUser.storeId,
        createdAt: new Date().toISOString()
      };
      
      if (activeTab === 'subCategories') {
        payload.parentCategoryId = selectedParentId;
      }

      await setDoc(doc(db, colName, id), payload);
      setNewItemName('');
      showToast(t('str_746'));
    } catch (err) {
      console.error(err);
      showToast(t('str_747'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, colName: string) => {
    if (!confirm(t('str_748'))) return;
    try {
      await deleteDoc(doc(db, colName, id));
      showToast(t('str_749'));
    } catch (err) {
      console.error(err);
      showToast(t('str_750'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-theme-text flex items-center gap-2">
            <Package size={24} className="text-primary"/>
            {t('str_751')}
          </h2>
          <p className="text-xs text-theme-muted mt-1">
            {t('str_752')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {[
          { id: 'categories', label: t('str_753'), icon: <Tag size={16}/> },
          { id: 'subCategories', label: t('str_754'), icon: <Filter size={16}/> },
          { id: 'brands', label: t('str_457'), icon: <Package size={16}/> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all shrink-0 border
              ${activeTab === tab.id 
                ? 'bg-primary/10 text-primary border-primary/20 shadow-sm' 
                : 'bg-theme-card text-theme-muted border-theme-border/60 hover:bg-theme-border/20'}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Builder Core */}
      <PremiumCard className="p-5">
        <h3 className="text-sm font-black mb-4">
          {activeTab === 'categories' && (t('str_755'))}
          {activeTab === 'subCategories' && (t('str_756'))}
          {activeTab === 'brands' && (t('str_757'))}
        </h3>

        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          {activeTab === 'subCategories' && (
            <div className="flex-1">
              <label className="block text-xs font-bold text-theme-muted mb-2">
                {t('str_758')}
              </label>
              <select 
                className="w-full bg-theme-bg border border-theme-border/60 rounded-xl px-4 py-3.5 text-sm font-bold text-theme-text outline-none focus:border-primary transition"
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(e.target.value)}
              >
                <option value="">{t('str_759')}</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex-1">
             <PremiumInput 
               type="text"
               placeholder={t('str_466')}
               value={newItemName}
               onChange={(e) => setNewItemName(e.target.value)}
             />
          </div>

          <PremiumButton 
             onClick={handleAddItem}
             isLoading={loading}
             className="md:w-auto w-full px-8 h-[52px]"
          >
             <Plus size={18}/> {t('str_48')}
          </PremiumButton>
        </div>
      </PremiumCard>

      {/* List Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {(activeTab === 'categories' ? categories : activeTab === 'subCategories' ? subCategories : brands).map(item => (
          <div key={item.id} className="bg-theme-card border border-theme-border/60 p-4 rounded-2xl flex items-center justify-between group">
            <div>
              <p className="font-black text-theme-text text-sm">{item.name}</p>
              {activeTab === 'subCategories' && (
                <p className="text-[10px] text-theme-muted font-bold mt-1">
                  {categories.find(c => c.id === item.parentCategoryId)?.name || 'Unknown'}
                </p>
              )}
            </div>
            <button 
              onClick={() => handleDelete(item.id, activeTab === 'categories' ? 'vendorCategories' : activeTab === 'subCategories' ? 'vendorSubCategories' : 'vendorBrands')}
              className="p-2 text-red-500 bg-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition"
            >
              <Trash2 size={16}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
