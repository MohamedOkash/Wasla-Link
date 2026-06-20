import React, { useState } from 'react';
import { X, Bell, Check, Trash2, ShoppingBag, Tag, Info, ShieldAlert, ArrowRightLeft } from 'lucide-react';
import { useApp, Notification } from '../../contexts/AppContext';

interface NotificationsDrawerProps {
  onClose: () => void;
  navigate: (name: string, params?: any) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ onClose, navigate }) => {
  const { 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead, 
    deleteNotification, 
    clearAllNotifications, 
    t, 
    isRTL,
    products,
    stores
  } = useApp();

  type TabType = 'all' | 'unread' | 'offer' | 'order' | 'promotion' | 'system';
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const filtered = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'offer') return n.type === 'offer';
    if (activeTab === 'order') return n.type === 'order' || n.type === 'delivery';
    if (activeTab === 'promotion') return n.type === 'promotion';
    if (activeTab === 'system') return n.type === 'system' || n.type === 'store_update';
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
      case 'delivery':
        return <ShoppingBag size={18} className="text-blue-500" />;
      case 'offer':
      case 'promotion':
        return <Tag size={18} className="text-orange-500" />;
      case 'store_update':
        return <ArrowRightLeft size={18} className="text-purple-500" />;
      case 'system':
      default:
        return <Info size={18} className="text-green-500" />;
    }
  };

  const getCategoryLabel = (type: string) => {
    if (isRTL) {
      switch (type) {
        case 'order': return 'طلب';
        case 'delivery': return 'توصيل';
        case 'offer': return 'عرض خاص';
        case 'promotion': return 'ترويج';
        case 'store_update': return 'تحديث متجر';
        case 'system':
        default:
          return 'نظام';
      }
    } else {
      switch (type) {
        case 'order': return 'Order';
        case 'delivery': return 'Delivery';
        case 'offer': return 'Special Offer';
        case 'promotion': return 'Promo';
        case 'store_update': return 'Store Update';
        case 'system':
        default:
          return 'System';
      }
    }
  };

  const getNotiText = (field: any) => {
    if (!field) return '';
    if (typeof field === 'object') {
      return isRTL ? (field.ar || field.en || '') : (field.en || field.ar || '');
    }
    return field;
  };

  const handleNotificationClick = (noti: Notification) => {
    markNotificationRead(noti.id);
    
    // Trigger deep linking
    if (noti.type === 'offer' || noti.type === 'promotion') {
      if (noti.productId) {
        const prod = products.find(p => p.id === noti.productId);
        const shop = stores.find(s => s.id === noti.storeId || s.id === prod?.storeId);
        if (prod && shop) {
          navigate('product', { product: prod, shop });
          onClose();
        }
      } else if (noti.storeId) {
        const shop = stores.find(s => s.id === noti.storeId);
        if (shop) {
          navigate('shop', { shop });
          onClose();
        }
      }
    } else if (noti.type === 'store_update') {
      if (noti.storeId) {
        const shop = stores.find(s => s.id === noti.storeId);
        if (shop) {
          navigate('shop', { shop });
          onClose();
        }
      }
    } else if (noti.type === 'order') {
      navigate('orders');
      onClose();
    } else if (noti.type === 'delivery') {
      navigate('tracking', { orderId: noti.orderId || 'O-101' });
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] flex justify-end animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[400px] h-full bg-theme-card theme-transition shadow-2xl flex flex-col animate-slide-in-right z-[9999]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-12 pb-4 border-b border-theme-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={22} className="text-primary" />
            <h2 className="text-base font-black text-theme-text">{isRTL ? 'مركز الإشعارات' : 'Notification Center'}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-theme-muted hover:text-theme-text hover:bg-theme-border rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Bar */}
        {notifications.length > 0 && (
          <div className="px-5 py-2.5 bg-theme-bg/50 border-b border-theme-border flex justify-between items-center text-xs">
            <button 
              onClick={markAllNotificationsRead} 
              className="text-primary hover:underline font-bold flex items-center gap-1"
            >
              <Check size={14} strokeWidth={3} /> {isRTL ? 'تحديد الكل كمقروء' : 'Mark all read'}
            </button>
            <button 
              onClick={clearAllNotifications} 
              className="text-red-500 hover:underline font-bold flex items-center gap-1"
            >
              <Trash2 size={12} /> {isRTL ? 'مسح الكل' : 'Clear all'}
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="px-4 py-2 border-b border-theme-border flex gap-1.5 overflow-x-auto no-scrollbar bg-theme-card">
          {[
            { id: 'all', label: isRTL ? 'الكل' : 'All' },
            { id: 'unread', label: isRTL ? 'غير المقروء' : 'Unread' },
            { id: 'offer', label: isRTL ? 'العروض' : 'Offers' },
            { id: 'order', label: isRTL ? 'الطلبات' : 'Orders' },
            { id: 'promotion', label: isRTL ? 'الترويج' : 'Promotions' },
            { id: 'system', label: isRTL ? 'النظام' : 'System' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-3 py-1.5 rounded-full text-xs font-black transition-all shrink-0 ${
                activeTab === tab.id 
                  ? 'bg-primary text-white shadow-sm shadow-primary/20' 
                  : 'bg-theme-bg text-theme-muted hover:text-theme-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-theme-bg/30 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
          {filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-theme-muted">
              <div className="w-16 h-16 rounded-full bg-theme-border flex items-center justify-center mb-4 text-theme-muted">
                <Bell size={28} />
              </div>
              <p className="font-black text-sm text-theme-text">{isRTL ? 'لا توجد إشعارات مطابقة' : 'No matching notifications'}</p>
              <p className="text-xs mt-1">{isRTL ? 'سنخبرك فور وصول أي تحديثات للطلب أو عروض!' : 'We will notify you on order updates and offers!'}</p>
            </div>
          ) : (
            filtered.map((noti) => (
              <div 
                key={noti.id} 
                onClick={() => handleNotificationClick(noti)}
                className={`p-4 rounded-2xl border transition-all relative cursor-pointer ${
                  noti.isRead 
                    ? 'bg-theme-card border-theme-border opacity-75' 
                    : 'bg-theme-card border-primary/20 shadow-md shadow-primary/5 hover:border-primary/45'
                }`}
              >
                {!noti.isRead && (
                  <span className="absolute top-4 left-4 w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                )}
                <div className="flex gap-3">
                  <div className="bg-theme-bg p-2.5 rounded-xl h-max border border-theme-border">
                    {getIcon(noti.type)}
                  </div>
                  <div className="flex-1 pr-1">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] bg-theme-bg px-2 py-0.5 rounded-md font-bold text-theme-muted border border-theme-border">
                        {getCategoryLabel(noti.type)}
                      </span>
                      <span className="text-[9px] text-theme-muted font-bold">
                        {new Date(noti.createdAt).toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h4 className="font-black text-xs text-theme-text mt-1">
                      {getNotiText(noti.title)}
                    </h4>
                    <p className="text-[11px] text-theme-muted font-bold mt-1 leading-relaxed">
                      {getNotiText(noti.description)}
                    </p>
                    <div className="flex justify-end gap-3 mt-3 pt-2 border-t border-theme-border/50 text-[10px]">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(noti.id);
                        }}
                        className="text-red-500 hover:text-red-600 font-bold"
                      >
                        {isRTL ? 'حذف' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
export default NotificationsDrawer;
