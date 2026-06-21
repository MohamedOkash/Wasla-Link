import React, { useState } from 'react';
import { Home, ShoppingBag, User, Heart, ClipboardList } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

// Customer screens
import { HomeScreen } from '../features/customer/HomeScreen';
import { CategoryScreen } from '../features/customer/CategoryScreen';
import { CustomerShop } from '../features/customer/CustomerShop';
import { ProductModal } from '../features/customer/ProductModal';
import { CustomerCart } from '../features/customer/CustomerCart';
import { CustomerCheckout } from '../features/customer/CustomerCheckout';
import { CustomerOrders } from '../features/customer/CustomerOrders';
import { CustomerProfile } from '../features/customer/CustomerProfile';
import { FavoritesScreen } from '../features/customer/FavoritesScreen';
import { GlobalSearch } from '../features/customer/GlobalSearch';
import { LocationPicker } from '../features/customer/LocationPicker';
import { NotificationsDrawer } from '../components/common/NotificationsDrawer';
import { TrackingScreen } from '../features/customer/TrackingScreen';

export const CustomerRoutes: React.FC = () => {
  const { 
    cart, 
    t, 
    isRTL,
    showSearch,
    setShowSearch,
    showMap,
    setShowMap,
    showNotifications,
    setShowNotifications
  } = useApp();
  const [route, setRoute] = useState<{ name: string; params: any }>({ name: 'home', params: {} });

  const navigate = (name: string, params: any = {}) => {
    setRoute({ name, params });
  };

  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex-1 flex flex-col relative h-full bg-theme-bg theme-transition overflow-hidden">
      {showSearch && <GlobalSearch closeSearch={() => setShowSearch(false)} navigate={navigate} />}
      {showMap && <LocationPicker closeMap={() => setShowMap(false)} />}
      {showNotifications && <NotificationsDrawer onClose={() => setShowNotifications(false)} navigate={navigate} />}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative h-full">
        {route.name === 'home' && (
          <HomeScreen 
            navigate={navigate} 
            openSearch={() => setShowSearch(true)} 
            openMap={() => setShowMap(true)} 
          />
        )}
        {route.name === 'category' && (
          <CategoryScreen 
            catId={route.params.catId} 
            navigate={navigate} 
            goBack={() => navigate('home')} 
            openSearch={() => setShowSearch(true)} 
          />
        )}
        {route.name === 'shop' && (
          <CustomerShop 
            shop={route.params.shop} 
            navigate={navigate} 
            goBack={() => navigate(route.params.from || 'home', { catId: route.params.shop.catId })} 
            openSearch={() => setShowSearch(true)} 
          />
        )}
        {route.name === 'product' && (
          <ProductModal 
            product={route.params.product} 
            shop={route.params.shop} 
            goBack={() => navigate('shop', { shop: route.params.shop })} 
          />
        )}
        {route.name === 'cart' && (
          <CustomerCart 
            goBack={() => navigate('home')} 
            goToCheckout={() => navigate('checkout')} 
          />
        )}
        {route.name === 'checkout' && (
          <CustomerCheckout 
            goBack={() => navigate('cart')} 
            placeOrder={() => navigate('orders')} 
          />
        )}
        {route.name === 'orders' && <CustomerOrders goBack={() => navigate('home')} navigate={navigate} />}
        {route.name === 'tracking' && <TrackingScreen orderId={route.params.orderId} goBack={() => navigate('orders')} />}
        {route.name === 'profile' && <CustomerProfile navigate={navigate} />}
        {route.name === 'favorites' && <FavoritesScreen navigate={navigate} />}
      </div>

      {/* Bottom Navigation Tab Bar (Fixed & Always Visible) */}
      {!showSearch && !showMap && !['cart', 'checkout'].includes(route.name) && (
        <div className="fixed bottom-0 left-0 right-0 max-w-[400px] mx-auto w-full glass-effect border-t border-theme-border/60 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] flex justify-between items-center z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] rounded-t-[28px] theme-transition">
          {[
            { id: 'home', icon: Home, label: t('home') },
            { id: 'favorites', icon: Heart, label: isRTL ? 'المفضلة' : 'Favorites' },
            { id: 'orders', icon: ClipboardList, label: t('orders') },
            { id: 'profile', icon: User, label: t('profile') },
          ].map((item) => {
            // Home is highlighted for categories, store details (shop) and products too
            const isActive = route.name === item.id || 
              (item.id === 'home' && ['category', 'shop', 'product'].includes(route.name));
            
            return (
              <div 
                key={item.id} 
                onClick={() => navigate(item.id)} 
                className={`flex flex-col items-center cursor-pointer transition-all flex-1 hover:scale-105 active:scale-95 ${
                  isActive ? 'text-primary' : 'text-theme-muted hover:text-theme-text'
                }`}
              >
                <div className={`p-2 rounded-2xl transition-all duration-300 relative ${isActive ? 'bg-primary/10' : ''}`}>
                  <item.icon 
                    size={24} 
                    strokeWidth={isActive ? 2.5 : 2} 
                    className={isActive ? 'fill-primary/10' : ''} 
                  />
                </div>
                <span className="text-[10px] mt-1 font-black">{item.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default CustomerRoutes;
