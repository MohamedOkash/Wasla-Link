import { Banner } from '../types/banner.types';

export const initialBanners: Banner[] = [
  { id: 1, title: {ar:'توصيل مجاني', en:'Free Delivery'}, subtitle: {ar:'على أول 3 طلبات', en:'On first 3 orders'}, imgUrl: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=800&q=80' },
  { id: 2, title: {ar:'عروض المطاعم', en:'Restaurant Offers'}, subtitle: {ar:'خصم حتى 50%', en:'Up to 50% off'}, imgUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80' },
  { id: 3, title: {ar:'خصم 30% على أسواق الخير', en:'30% Off Al-Khair'}, subtitle: {ar:'لفترة محدودة', en:'Limited Time'}, imgUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80' },
];
