<USER_REQUEST>
import React, { useState, useEffect, useRef, useMemo, createContext, useContext } from 'react';
import { 
  MapPin, Bell, Search, Home, ShoppingBag, User, 
  ChevronLeft, ChevronRight, Package, CheckCircle, Heart, 
  Settings, HelpCircle, LogOut, X, Bike, 
  TrendingUp, ClipboardList, ArrowRight, Plus, Minus, Info,
  Map as MapIcon, Wallet, Check, AlertCircle, Users, BarChart3, ShieldCheck,
  Star, Clock, Store, Crosshair, Upload, FileCheck, History, Flame, Tag, Image as ImageIcon,
  Filter, SlidersHorizontal, ShoppingCart, Utensils, Activity, Zap, LayoutGrid, Globe, Edit, Trash2, Camera
} from 'lucide-react';

// ==========================================
// 1. I18N DICTIONARY
// ==========================================
const translations = {
  ar: {
    home: 'الرئيسية', orders: 'الطلبات', profile: 'حسابي', search: 'بحث',
    deliverTo: 'التوصيل إلى', selectLocation: 'اختر موقع التوصيل',
    searchPlaceholder: 'عن ماذا تبحث اليوم؟ (مثال: كوكاكولا...)',
    newOffer: 'عرض جديد', orderNow: 'اطلب الآن', categories: 'تصفح الأقسام',
    nearbyStores: 'متاجر مميزة بالقرب منك', freeDelivery: 'توصيل مجاني',
    closed: 'مغلق حالياً', store: 'متجر', offer: 'عرض',
    allStores: 'المتاجر', products: 'المنتجات', noResults: 'لا توجد نتائج',
    recentSearches: 'عمليات البحث الأخيرة', filters: 'تصفية',
    topRated: 'الأعلى تقييماً', fastest: 'الأسرع توصيلاً', openNow: 'المفتوحة فقط',
    bestSellers: 'الأكثر مبيعاً', todayOffers: 'عروض اليوم',
    addToCart: 'إضافة للسلة', cart: 'السلة', emptyCart: 'سلتك فارغة',
    checkout: 'متابعة للدفع', subtotal: 'المجموع الفرعي', deliveryFee: 'رسوم التوصيل',
    total: 'الإجمالي الكلي', paymentMethod: 'طريقة الدفع', cash: 'الدفع عند الاستلام',
    vodafone: 'فودافون كاش', instapay: 'إنستاباي', confirmOrder: 'تأكيد الطلب',
    login: 'تسجيل الدخول', register: 'إنشاء حساب', email: 'البريد الإلكتروني',
    password: 'كلمة المرور', name: 'الاسم الكامل', loginAsVendor: 'دخول كتاجر',
    loginAsAdmin: 'دخول كإدارة', loginAsCustomer: 'دخول كعميل',
    vendorDashboard: 'لوحة التاجر', adminDashboard: 'إدارة النظام',
    productsManage: 'إدارة المنتجات', addProduct: 'إضافة منتج',
    pendingOrders: 'الطلبات المعلقة', sales: 'المبيعات', customers: 'العملاء',
    approve: 'قبول', reject: 'رفض', language: 'Language: English',
    pendingVerification: 'بانتظار تأكيد الدفع', preparing: 'جاري التجهيز',
    outForDelivery: 'في الطريق', delivered: 'تم التوصيل', uploadReceipt: 'إرفاق الإيصال'
  },
  en: {
    home: 'Home', orders: 'Orders', profile: 'Profile', search: 'Search',
    deliverTo: 'Deliver to', selectLocation: 'Select Location',
    searchPlaceholder: 'What are you looking for? (e.g. Coca Cola...)',
    newOffer: 'New Offer', orderNow: 'Order Now', categories: 'Categories',
    nearbyStores: 'Featured Stores Nearby', freeDelivery: 'Free Delivery',
    closed: 'Closed Now', store: 'Store', offer: 'Offer',
    allStores: 'Stores', products: 'Products', noResults: 'No results found',
    recentSearches: 'Recent Searches', filters: 'Filters',
    topRated: 'Top Rated', fastest: 'Fastest Delivery', openNow: 'Open Now',
    bestSellers: 'Best Sellers', todayOffers: 'Today Offers',
    addToCart: 'Add to Cart', cart: 'Cart', emptyCart: 'Your cart is empty',
    checkout: 'Checkout', subtotal: 'Subtotal', deliveryFee: 'Delivery Fee',
    total: 'Total', paymentMethod: 'Payment Method', cash: 'Cash on Delivery',
    vodafone: 'Vodafone Cash', instapay: 'InstaPay', confirmOrder: 'Confirm Order',
    login: 'Login', register: 'Register', email: 'Email',
    password: 'Password', name: 'Full Name', loginAsVendor: 'Vendor Login',
    loginAsAdmin: 'Admin Login', loginAsCustomer: 'Customer Login',
    vendorDashboard: 'Vendor Dashboard', adminDashboard: 'Admin Panel',
    productsManage: 'Manage Products', addProduct: 'Add Product',
    pendingOrders: 'Pending Orders', sales: 'Sales', customers: 'Customers',
    approve: 'Approve', reject: 'Reject', language: 'اللغة: العربية',
    pendingVerification: 'Awaiting Payment', preparing: 'Preparing',
    outForDelivery: 'Out for Delivery', delivered: 'Delivered', uploadReceipt: 'Upload Receipt'
  }
};

// ==========================================
// 2. MASSIVE DATABASE EXPANSION (RESTORED & EXPANDED)
// ==========================================
const IMAGES = {
  fallback: "https://images.unsplash.com/photo-1601598755742-8354ab9a1876?auto=format&fit=crop&w=300&q=80",
  map: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80",
  categories: {
    grocery: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=300&q=80',
    restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80',
    pharmacy: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=300&q=80',
    bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80',
    library: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80',
    electric: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&w=300&q=80'
  }
};

const initialBanners = [
  { id: 1, title: {ar:'توصيل مجاني', en:'Free Delivery'}, subtitle: {ar:'على أول 3 طلبات', en:'On first 3 orders'}, imgUrl: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=800&q=80' },
  { id: 2, title: {ar:'عروض المطاعم', en:'Restaurant Offers'}, subtitle: {ar:'خصم حتى 50%', en:'Up to 50% off'}, imgUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80' },
  { id: 3, title: {ar:'خصم 30% على أسواق الخير', en:'30% Off Al-Khair'}, subtitle: {ar:'لفترة محدودة', en:'Limited Time'}, imgUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80' },
];

const initialCategories = [
  { id: 'grocery', name: {ar:'البقالات والسوبر ماركت', en:'Groceries'}, icon: <ShoppingCart/>, imgUrl: IMAGES.categories.grocery },
  { id: 'restaurant', name: {ar:'المطاعم والكافيهات', en:'Restaurants'}, icon: <Utensils/>, imgUrl: IMAGES.categories.restaurant },
  { id: 'pharmacy', name: {ar:'الصيدليات', en:'Pharmacies'}, icon: <Activity/>, imgUrl: IMAGES.categories.pharmacy },
  { id: 'library', name: {ar:'المكتبات والأدوات', en:'Libraries'}, icon: <Store/>, imgUrl: IMAGES.categories.library },
  { id: 'electric', name: {ar:'الكهرباء والإضاءة', en:'Electronics'}, icon: <Zap/>, imgUrl: IMAGES.categories.electric },
  { id: 'bakery', name: {ar:'المخابز والحلويات', en:'Bakeries'}, icon: <LayoutGrid/>, imgUrl: IMAGES.categories.bakery },
];

// 15 RESTORED STORES
const initialStores = [
  { id: 'g_1', catId: 'grocery', name: 'أسواق الخير', logoUrl: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=150&q=80', coverUrl: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=600&q=80', rating: 4.9, time: 15, fee: 0, minOrder: 50, isOpen: true, promoBanner: 'خصم 20% على الألبان', status: 'approved', paymentInfo: { vodafone: '01011112222', instapay: 'alkhair@instapay' } },
  { id: 'g_2', catId: 'grocery', name: 'الياسمين ماركت', logoUrl: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=150&q=80', coverUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80', rating: 4.5, time: 10, fee: 10, minOrder: 30, isOpen: true, status: 'approved' },
  { id: 'g_3', catId: 'grocery', name: 'بقالة أبو حمزة', logoUrl: 'https://ui-avatars.com/api/?name=أبوحمزة&background=F59E0B&color=fff', coverUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80', rating: 4.6, time: 5, fee: 5, minOrder: 20, isOpen: true, status: 'approved' },
  { id: 'g_4', catId: 'grocery', name: 'سوبر ماركت الحسان', logoUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=150&q=80', coverUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=600&q=80', rating: 4.8, time: 20, fee: 15, minOrder: 50, isOpen: false, status: 'approved' },
  
  { id: 'r_1', catId: 'restaurant', name: 'مطعم الباز', logoUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=150&q=80', coverUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80', rating: 4.8, time: 30, fee: 15, minOrder: 100, isOpen: true, promoBanner: 'اطلب وجبة واحصل على مقبلات مجانية', status: 'approved', paymentInfo: { vodafone: '01099998888', instapay: 'elbaz@instapay' } },
  { id: 'r_2', catId: 'restaurant', name: 'حلويات الجمل', logoUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=150&q=80', coverUrl: 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&w=600&q=80', rating: 4.9, time: 25, fee: 10, minOrder: 50, isOpen: true, promoBanner: 'أفضل الحلويات الشرقية في مدينتك', status: 'approved' },
  
  { id: 'p_1', catId: 'pharmacy', name: 'صيدلية سعفان', logoUrl: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=150&q=80', coverUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=600&q=80', rating: 4.9, time: 10, fee: 0, minOrder: 0, isOpen: true, status: 'approved', promoBanner: 'توصيل مجاني للأدوية والمستلزمات' },
  { id: 'p_2', catId: 'pharmacy', name: 'صيدلية البرم', logoUrl: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=150&q=80', coverUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ad?auto=format&fit=crop&w=600&q=80', rating: 4.6, time: 15, fee: 5, minOrder: 30, isOpen: true, status: 'approved' },
  { id: 'p_3', catId: 'pharmacy', name: 'صيدلية العيسوي', logoUrl: 'https://ui-avatars.com/api/?name=العيسوي&background=6366F1&color=fff', coverUrl: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=600&q=80', rating: 4.8, time: 20, fee: 5, minOrder: 20, isOpen: true, status: 'approved' },
  
  { id: 'l_1', catId: 'library', name: 'مكتبة الإيمان', logoUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=150&q=80', coverUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80', rating: 4.7, time: 20, fee: 10, minOrder: 25, isOpen: true, status: 'approved' },
  { id: 'l_2', catId: 'library', name: 'مكتبة المروة', logoUrl: 'https://ui-avatars.com/api/?name=المروة&background=D946EF&color=fff', coverUrl: 'https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=600&q=80', rating: 4.8, time: 15, fee: 5, minOrder: 20, isOpen: true, status: 'approved' },
  { id: 'l_3', catId: 'library', name: 'مكتبة الأوائل', logoUrl: 'https://ui-avatars.com/api/?name=الأوائل&background=EC4899&color=fff', coverUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=600&q=80', rating: 4.9, time: 10, fee: 5, minOrder: 15, isOpen: true, status: 'approved' },
  
  { id: 'e_1', catId: 'electric', name: 'إسلام أبو حلوة', logoUrl: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&w=150&q=80', coverUrl: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=600&q=80', rating: 4.8, time: 35, fee: 15, minOrder: 50, isOpen: true, status: 'approved' },
  { id: 'e_2', catId: 'electric', name: 'إسماعيل أبو حلوة', logoUrl: 'https://ui-avatars.com/api/?name=إسماعيل&background=CA8A04&color=fff', coverUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80', rating: 4.7, time: 30, fee: 10, minOrder: 40, isOpen: true, status: 'approved' },
  
  { id: 'b_1', catId: 'bakery', name: 'مخبز المدينة', logoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=150&q=80', coverUrl: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=600&q=80', rating: 4.8, time: 15, fee: 5, minOrder: 15, isOpen: true, status: 'approved' },
  { id: 'b_2', catId: 'bakery', name: 'مخبز الهدى', logoUrl: 'https://ui-avatars.com/api/?name=الهدى&background=F97316&color=fff', coverUrl: 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?auto=format&fit=crop&w=600&q=80', rating: 4.7, time: 20, fee: 5, minOrder: 10, isOpen: true, status: 'approved' },
];

// DENSE PROGRAMMATIC GENERATION FOR 300+ PRODUCTS TO PREVENT TOKEN LIMITS
const generateMassiveInventory = () => {
  const allProds = [];
  
  // Grocery Templates
  const groceryCats = ['ألبان وأجبان', 'سناكس وشيبسي', 'مشروبات', 'مخبوزات', 'منظفات', 'مجمدات', 'زيوت وسمن', 'أرز ومكرونة', 'معلبات', 'حلويات', 'منتجات أطفال', 'أدوات منزلية استهلاكية'];
  const groceryStores = ['g_1', 'g_2', 'g_3', 'g_4'];
  let idCounter = 1;
  
  groceryStores.forEach(s => {
    groceryCats.forEach(c => {
      for(let i=0; i<3; i++) { // 12 cats * 4 stores * 3 items = 144 grocery items
        allProds.push({
          id: `p_g_${idCounter++}`, storeId: s, cat: c, 
          name: `منتج ${c} المميز - ${i+1}`, desc: `وصف واقعي لمنتج ${c} طازج وعالي الجودة`,
          price: 15 + (i*10), isBestSeller: i===0, isOffer: i===1, oldPrice: i===1 ? 40 : null,
          imgUrl: `https://source.unsplash.com/300x300/?supermarket,${encodeURIComponent(c)}`
        });
      }
    });
  });

  // Pharmacy Templates
  const pharmCats = ['مسكنات', 'فيتامينات', 'عناية شخصية', 'أجهزة طبية', 'إسعافات أولية', 'أطفال', 'عناية بالبشرة', 'عناية بالشعر', 'نزلات برد', 'مكملات غذائية'];
  const pharmStores = ['p_1', 'p_2', 'p_3'];
  pharmStores.forEach(s => {
    pharmCats.forEach(c => {
      for(let i=0; i<3; i++) { // 10 * 3 * 3 = 90 pharmacy items
        allProds.push({
          id: `p_p_${idCounter++}`, storeId: s, cat: c, 
          name: `${c} طبية آمنة ${i+1}`, desc: `منتج طبي مصرح به ومعتمد في قسم ${c}`,
          price: 25 + (i*15), isBestSeller: i===0, isOffer: i===2, oldPrice: i===2 ? 90 : null,
          imgUrl: `https://source.unsplash.com/300x300/?pharmacy,medicine`
        });
      }
    });
  });

  // Restaurant Templates
  const restCatsBaz = ['وجبات', 'مشويات', 'ساندويتشات', 'إضافات', 'مشروبات', 'عروض'];
  restCatsBaz.forEach(c => {
    for(let i=0; i<4; i++) {
      allProds.push({
        id: `p_r_${idCounter++}`, storeId: 'r_1', cat: c, 
        name: `طعام ${c} الباز ${i+1}`, desc: `وجبة ساخنة ولذيذة من قسم ${c}`,
        price: 50 + (i*30), isBestSeller: i===0, isOffer: c==='عروض', oldPrice: c==='عروض'? 150 : null,
        imgUrl: `https://source.unsplash.com/300x300/?food,meat`
      });
    }
  });

  const restCatsGamal = ['شرقي', 'غربي', 'تورت', 'مخبوزات', 'عروض'];
  restCatsGamal.forEach(c => {
    for(let i=0; i<4; i++) {
      allProds.push({
        id: `p_r_${idCounter++}`, storeId: 'r_2', cat: c, 
        name: `حلويات ${c} الجمل ${i+1}`, desc: `حلويات طازجة بالسمن البلدي من قسم ${c}`,
        price: 60 + (i*20), isBestSeller: i===1, isOffer: c==='عروض', oldPrice: c==='عروض'? 100 : null,
        imgUrl: `https://source.unsplash.com/300x300/?dessert,cake`
      });
    }
  });

  // Libraries
  const libCats = ['أدوات مدرسية', 'أوراق', 'أحبار', 'طباعة وتصوير', 'هدايا', 'أدوات هندسية', 'ملفات ومجلدات'];
  const libStores = ['l_1', 'l_2', 'l_3'];
  libStores.forEach(s => {
    libCats.forEach(c => {
      for(let i=0; i<3; i++) {
        allProds.push({
          id: `p_l_${idCounter++}`, storeId: s, cat: c, 
          name: `مستلزمات ${c} ${i+1}`, desc: `أدوات عالية الجودة للطلاب والمكاتب`,
          price: 10 + (i*10), isBestSeller: i===0, imgUrl: `https://source.unsplash.com/300x300/?stationery,pen`
        });
      }
    });
  });

  // Electric
  const elecCats = ['لمبات', 'LED', 'أسلاك', 'مفاتيح', 'أفياش', 'كشافات', 'أدوات كهربائية', 'إكسسوارات كهرباء'];
  const elecStores = ['e_1', 'e_2'];
  elecStores.forEach(s => {
    elecCats.forEach(c => {
      for(let i=0; i<4; i++) {
        allProds.push({
          id: `p_e_${idCounter++}`, storeId: s, cat: c, 
          name: `معدات ${c} أصلية ${i+1}`, desc: `منتج كهربائي مضمون وآمن`,
          price: 30 + (i*25), isBestSeller: i===2, imgUrl: `https://source.unsplash.com/300x300/?electricity,bulb`
        });
      }
    });
  });

  // Bakery
  const bakeryCats = ['خبز', 'فينو', 'معجنات', 'بيتزا', 'مخبوزات', 'حلويات'];
  const bakeryStores = ['b_1', 'b_2'];
  bakeryStores.forEach(s => {
    bakeryCats.forEach(c => {
      for(let i=0; i<4; i++) {
        allProds.push({
          id: `p_b_${idCounter++}`, storeId: s, cat: c, 
          name: `${c} مخبوز طازج ${i+1}`, desc: `مخبوزات ساخنة من الفرن إليك`,
          price: 5 + (i*5), isBestSeller: i===1, imgUrl: `https://source.unsplash.com/300x300/?bread,bakery`
        });
      }
    });
  });

  // Specifically inject precise named items to satisfy search queries requirements
  allProds.push(
    { id: 'sp1', storeId: 'g_1', cat: 'مشروبات', name: 'كوكاكولا 330 مل', desc: 'مشروب غازي كانز', price: 10, isBestSeller: true, imgUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80' },
    { id: 'sp2', storeId: 'g_2', cat: 'مشروبات', name: 'كوكاكولا 330 مل', desc: 'كانز بارد', price: 10, imgUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80' },
    { id: 'sp3', storeId: 'g_3', cat: 'مشروبات', name: 'كوكاكولا 1 لتر', desc: 'عائلي', price: 22, imgUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80' },
    { id: 'sp4', storeId: 'g_4', cat: 'مشروبات', name: 'كوكاكولا زيرو', desc: 'بدون سكر 330 مل', price: 10, imgUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80' },
    { id: 'sp5', storeId: 'p_1', cat: 'مسكنات', name: 'بنادول إكسترا', desc: 'مسكن للآلام', price: 35, isBestSeller: true, imgUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ad?auto=format&fit=crop&w=300&q=80' },
    { id: 'sp6', storeId: 'p_2', cat: 'نزلات برد', name: 'بنادول كولد اند فلو', desc: 'علاج نزلات البرد', price: 45, imgUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ad?auto=format&fit=crop&w=300&q=80' }
  );

  return allProds;
};

const initialProducts = generateMassiveInventory(); // Generates over 450+ real distinct objects instantly

// ==========================================
// 3. GLOBAL STATE MANAGEMENT (CONTEXT)
// ==========================================
const AppContext = createContext();

export default function App() {
  const [lang, setLang] = useState('ar');
  const t = (key) => translations[lang][key] || key;
  const isRTL = lang === 'ar';

  const [role, setRole] = useState('splash'); 
  const [currentUser, setCurrentUser] = useState(null);
  
  const [stores, setStores] = useState(initialStores);
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [banners, setBanners] = useState(initialBanners);
  const [orders, setOrders] = useState([]);
  
  const [cart, setCart] = useState({ shopId: null, shopName: '', items: [] });
  const [location, setLocation] = useState({ name: '', coords: null, isVerified: false });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (role === 'splash') setTimeout(() => setRole('login'), 2000);
  }, [role]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const ToastMessage = () => {
    if (!toast) return null;
    return (
      <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl z-[100] flex items-center animate-slide-down text-sm font-bold w-max max-w-[90%]">
        <CheckCircle size={18} className="text-green-400 mx-2 flex-shrink-0" />
        <span className="truncate">{toast}</span>
      </div>
    );
  };

  const contextValue = { 
    lang, setLang, t, isRTL,
    role, setRole, currentUser, setCurrentUser,
    stores, setStores, products, setProducts, categories, setCategories, banners, setBanners, orders, setOrders,
    cart, setCart, location, setLocation, showToast, 
    goHome: () => { setRole('login'); setCurrentUser(null); }
  };

  const renderApp = () => {
    switch (role) {
      case 'splash': return <SplashScreen />;
      case 'login': return <AuthScreen />;
      case 'customer': return <CustomerApp />;
      case 'vendor': return <VendorApp />;
      case 'admin': return <AdminApp />;
      default: return <AuthScreen />;
    }
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div dir={isRTL ? 'rtl' : 'ltr'} className="bg-black min-h-screen font-sans selection:bg-orange-500 selection:text-white text-gray-900">
        <div className="max-w-[400px] mx-auto bg-gray-50 min-h-screen relative shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
          {renderApp()}
          <ToastMessage />
        </div>
      </div>
    </AppContext.Provider>
  );
}

// ==========================================
// 4. AUTHENTICATION SCREENS
// ==========================================
const SplashScreen = () => (
  <div className="flex-1 bg-orange-500 flex flex-col items-center justify-center animate-fade-in relative overflow-hidden">
    <div className="w-32 h-32 bg-white rounded-[40px] shadow-2xl flex items-center justify-center mb-6 relative z-10 animate-bounce-slight">
      <Store size={64} className="text-orange-500" strokeWidth={1.5} />
    </div>
    <h1 className="text-5xl font-black text-white tracking-tight relative z-10">وصلة لينك</h1>
    <div className="absolute bottom-12 w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const AuthScreen = () => {
  const { setRole, setCurrentUser, lang, setLang, t, categories } = useContext(AppContext);
  const [view, setView] = useState('login'); 

  const handleLogin = (roleType) => {
    setCurrentUser({ name: 'أحمد محمود', role: roleType, email: 'user@demo.com' });
    setRole(roleType);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white relative overflow-y-auto animate-fade-in">
      <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="absolute top-6 left-6 bg-gray-100 p-2 rounded-xl text-xs font-bold flex items-center gap-2">
        <Globe size={16}/> {t('language')}
      </button>

      <div className="w-24 h-24 bg-orange-500 rounded-[30px] shadow-xl flex items-center justify-center mb-6 mt-10">
        <Store size={48} className="text-white" />
      </div>
      <h1 className="text-3xl font-black mb-8">وصلة لينك</h1>

      {view === 'login' && (
        <div className="w-full space-y-4">
          <input type="email" placeholder={t('email')} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl font-bold outline-none focus:border-orange-500" />
          <input type="password" placeholder={t('password')} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl font-bold outline-none focus:border-orange-500" />
          
          <button onClick={() => handleLogin('customer')} className="w-full bg-gray-900 text-white font-black py-4 rounded-xl shadow-lg mt-4">{t('loginAsCustomer')}</button>
          
          <div className="flex gap-3 mt-4">
            <button onClick={() => handleLogin('vendor')} className="flex-1 bg-orange-50 text-orange-600 font-black py-3 rounded-xl border border-orange-100">{t('loginAsVendor')}</button>
            <button onClick={() => handleLogin('admin')} className="flex-1 bg-blue-50 text-blue-600 font-black py-3 rounded-xl border border-blue-100">{t('loginAsAdmin')}</button>
          </div>
          <p className="text-center text-sm font-bold text-gray-500 mt-6 cursor-pointer hover:text-orange-500" onClick={()=>setView('register')}>إنشاء حساب جديد كعميل</p>
          <p className="text-center text-sm font-bold text-orange-500 cursor-pointer" onClick={()=>setView('vendor_register')}>تسجيل متجرك معنا</p>
        </div>
      )}

      {view === 'register' && (
        <div className="w-full space-y-4">
          <input type="text" placeholder={t('name')} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl font-bold outline-none" />
          <input type="email" placeholder={t('email')} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl font-bold outline-none" />
          <input type="password" placeholder={t('password')} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl font-bold outline-none" />
          <button onClick={() => handleLogin('customer')} className="w-full bg-gray-900 text-white font-black py-4 rounded-xl shadow-lg mt-4">{t('register')}</button>
          <p className="text-center text-sm font-bold text-gray-500 mt-4 cursor-pointer" onClick={()=>setView('login')}>لدي حساب بالفعل</p>
        </div>
      )}

      {view === 'vendor_register' && (
        <div className="w-full space-y-4">
          <h2 className="text-center font-black text-orange-600 mb-4">تسجيل متجر جديد</h2>
          <input type="text" placeholder="اسم المتجر" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold outline-none" />
          <select className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold outline-none">
            {categories.map(c => <option key={c.id} value={c.id}>{c.name.ar || c.name}</option>)}
          </select>
          <input type="text" placeholder="رقم الهاتف" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold outline-none" />
          <button onClick={() => { alert('تم إرسال طلبك للمراجعة من الإدارة'); setView('login'); }} className="w-full bg-orange-500 text-white font-black py-4 rounded-xl shadow-lg mt-4">إرسال طلب التسجيل</button>
          <p className="text-center text-sm font-bold text-gray-500 mt-4 cursor-pointer" onClick={()=>setView('login')}>عودة للوراء</p>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 5. CUSTOMER APP & ROUTES
// ==========================================
const useAppRouter = () => {
  const [route, setRoute] = useState({ name: 'home', params: {} });
  const navigate = (name, params = {}) => { setRoute({ name, params }); window.scrollTo(0, 0); };
  return { route, navigate };
};

const CustomerApp = () => {
  const { cart, location, t, isRTL } = useContext(AppContext);
  const { route, navigate } = useAppRouter();
  const [showSearch, setShowSearch] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex-1 flex flex-col relative h-full bg-gray-50">
      {showSearch && <GlobalSearch closeSearch={() => setShowSearch(false)} navigate={navigate} />}
      {showMap && <LocationPicker closeMap={() => setShowMap(false)} />}

      <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {route.name === 'home' && <CustomerHome navigate={navigate} openSearch={()=>setShowSearch(true)} openMap={()=>setShowMap(true)} />}
        {route.name === 'category' && <CategoryScreen catId={route.params.catId} navigate={navigate} goBack={() => navigate('home')} openSearch={()=>setShowSearch(true)} />}
        {route.name === 'shop' && <CustomerShop shop={route.params.shop} navigate={navigate} goBack={() => navigate(route.params.from || 'home', {catId: route.params.shop.catId})} openSearch={()=>setShowSearch(true)} />}
        {route.name === 'product' && <ProductModal product={route.params.product} shop={route.params.shop} goBack={() => navigate('shop', {shop: route.params.shop})} />}
        {route.name === 'cart' && <CustomerCart goBack={() => navigate('home')} goToCheckout={() => navigate('checkout')} />}
        {route.name === 'checkout' && <CustomerCheckout goBack={() => navigate('cart')} placeOrder={() => navigate('orders')} />}
        {route.name === 'orders' && <CustomerOrders />}
        {route.name === 'profile' && <CustomerProfile />}
      </div>

      {['home', 'orders', 'profile'].includes(route.name) && !showSearch && !showMap && (
        <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 px-6 py-4 flex justify-between items-center z-40 pb-safe shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] rounded-t-3xl">
          {[
            { id: 'home', icon: Home, label: t('home') },
            { id: 'orders', icon: ShoppingBag, label: t('orders') },
            { id: 'profile', icon: User, label: t('profile') },
          ].map((item) => (
            <div key={item.id} onClick={() => navigate(item.id)} className={`flex flex-col items-center cursor-pointer transition-colors ${route.name === item.id ? 'text-orange-600' : 'text-gray-400'}`}>
              <div className="relative">
                <item.icon size={24} strokeWidth={route.name === item.id ? 2.5 : 2} className={route.name === item.id ? 'fill-orange-50' : ''} />
                {item.id === 'orders' && cartCount > 0 && (
                  <span className={`absolute -top-1 ${isRTL?'-right-2':'-left-2'} bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white`}>{cartCount}</span>
                )}
              </div>
              <span className="text-[11px] mt-1.5 font-bold">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Global Search System ---
const GlobalSearch = ({ closeSearch, navigate }) => {
  const { stores, products, categories, t, isRTL } = useContext(AppContext);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ shops: [], products: [] });

  useEffect(() => {
    const delay = setTimeout(() => {
      if (!query.trim()) { setResults({ shops: [], products: [] }); return; }
      const q = query.toLowerCase();
      
      const foundShops = stores.filter(s => s.status === 'approved' && (s.name.toLowerCase().includes(q) || categories.find(c=>c.id===s.catId)?.name.ar.includes(q)));
      const foundProducts = products.filter(p => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)).map(p => ({...p, shop: stores.find(s=>s.id === p.storeId)}));
      
      setResults({ shops: foundShops, products: foundProducts });
    }, 300);
    return () => clearTimeout(delay);
  }, [query, stores, products, categories]);

  return (
    <div className="absolute inset-0 bg-gray-50 z-[60] flex flex-col animate-fade-in">
      <div className="bg-white px-5 pt-10 pb-4 shadow-sm flex items-center gap-3 border-b border-gray-100">
        <button onClick={closeSearch} className="p-2 text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200"><ChevronRight size={24} className={isRTL?'':'rotate-180'} /></button>
        <div className="flex-1 relative">
          <input autoFocus type="text" value={query} onChange={(e) => setQuery(e.target.value)} className={`w-full bg-gray-100 border-none rounded-xl py-3 ${isRTL?'pr-4 pl-10':'pl-4 pr-10'} text-sm focus:ring-2 focus:ring-orange-500 outline-none font-bold`} placeholder={t('searchPlaceholder')} />
          {query ? <button onClick={()=>setQuery('')} className={`absolute ${isRTL?'left-3':'right-3'} top-3.5 text-gray-400`}><X size={16}/></button> : <Search size={18} className={`absolute ${isRTL?'left-3':'right-3'} top-3.5 text-gray-400`} />}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {!query ? (
          <div><h3 className="font-bold mb-3 flex items-center gap-2"><History size={16}/> {t('recentSearches')}</h3></div>
        ) : results.shops.length === 0 && results.products.length === 0 ? (
          <div className="text-center text-gray-500 mt-20"><Search size={48} className="mx-auto mb-4 opacity-20" /><p className="font-bold">{t('noResults')}</p></div>
        ) : (
          <>
            {results.shops.length > 0 && (
              <div className="mb-6">
                <h3 className="font-black text-sm mb-3">{t('allStores')}</h3>
                <div className="space-y-3">
                  {results.shops.map(shop => (
                    <div key={shop.id} onClick={() => { closeSearch(); navigate('shop', { shop }); }} className="bg-white p-3 rounded-2xl flex items-center gap-3 border border-gray-100 cursor-pointer shadow-sm hover:border-orange-500 transition-colors">
                      <img src={shop.logoUrl} className="w-12 h-12 rounded-xl object-cover border border-gray-100" />
                      <div className="flex-1"><h4 className="font-black text-sm">{shop.name}</h4><p className="text-[10px] text-gray-500 font-bold">{categories.find(c=>c.id===shop.catId)?.name[t('lang') === 'ar' ? 'ar' : 'en'] || categories.find(c=>c.id===shop.catId)?.name.ar}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {results.products.length > 0 && (
              <div>
                <h3 className="font-black text-sm mb-3">{t('products')}</h3>
                <div className="space-y-3">
                  {results.products.map(prod => (
                    <div key={prod.id} onClick={() => { closeSearch(); navigate('product', { product: prod, shop: prod.shop }); }} className="bg-white p-3 rounded-2xl flex items-center gap-3 border border-gray-100 cursor-pointer shadow-sm hover:border-orange-500 transition-colors">
                      <img src={prod.imgUrl} className="w-14 h-14 rounded-xl object-cover bg-gray-50 border border-gray-50" />
                      <div className="flex-1">
                        <h4 className="font-black text-sm">{prod.name}</h4>
                        <p className="text-[10px] text-gray-500 line-clamp-1">{prod.desc}</p>
                        <p className="text-xs font-black text-orange-600 mt-1">{prod.price} ج.م <span className="text-gray-400 font-normal text-[10px] px-1">من {prod.shop?.name}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const LocationPicker = ({ closeMap }) => {
  const { setLocation, showToast } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('شارع التحرير، وسط البلد');

  const detectLocation = () => {
    setLoading(true);
    setTimeout(() => {
      setLocation({ name: 'موقعك الحالي (تم التحديد)', coords: { lat: 30.0444, lng: 31.2357 }, isVerified: true });
      showToast('تم تحديد موقعك بدقة');
      setLoading(false);
      closeMap();
    }, 1500);
  };

  const saveManualLocation = () => {
    setLocation({ name: address, coords: { lat: 30.0444, lng: 31.2357 }, isVerified: true });
    showToast('تم حفظ العنوان');
    closeMap();
  };

  return (
    <div className="absolute inset-0 bg-white z-[70] flex flex-col animate-slide-up">
      <div className="relative h-[50vh] bg-gray-200">
        <img src={IMAGES.map} className="w-full h-full object-cover opacity-80" alt="Map" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent"></div>
        <button onClick={closeMap} className="absolute top-8 right-5 bg-white/90 backdrop-blur shadow-md p-2.5 rounded-full text-gray-800 z-10 hover:bg-gray-100">
          <ChevronRight size={24} />
        </button>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full text-red-500 animate-bounce">
          <MapPin size={48} fill="currentColor" stroke="white" />
        </div>
      </div>
      
      <div className="flex-1 bg-white -mt-6 rounded-t-[30px] relative z-20 p-6 flex flex-col shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <h2 className="text-xl font-black text-gray-900 mb-2">تحديد موقع التوصيل</h2>
        <p className="text-gray-500 text-sm mb-6 font-bold">حرك الخريطة لتحديد موقعك بدقة، أو استخدم التحديد التلقائي.</p>
        
        <button onClick={detectLocation} disabled={loading} className="w-full bg-blue-50 text-blue-600 font-black py-3.5 rounded-2xl mb-4 flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors">
          {loading ? <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> : <Crosshair size={20} />}
          {loading ? 'جاري تحديد الموقع...' : 'تحديد موقعي التلقائي (GPS)'}
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <MapIcon size={18} className="text-gray-400" />
          </div>
          <input type="text" value={address} onChange={e=>setAddress(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 pr-12 pl-4 text-sm focus:border-orange-500 outline-none font-bold text-gray-900" placeholder="أدخل العنوان يدوياً..." />
        </div>

        <button onClick={saveManualLocation} className="mt-auto w-full bg-gray-900 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-black transition-all">
          تأكيد وحفظ العنوان
        </button>
      </div>
    </div>
  );
};

const CustomerHome = ({ navigate, openSearch, openMap }) => {
  const { location, t, categories, stores, banners } = useContext(AppContext);
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentBanner((prev) => (prev + 1) % banners.length), 3500);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <div className="animate-fade-in pb-10">
      <div className="bg-white px-5 pt-10 pb-5 rounded-b-[40px] shadow-sm sticky top-0 z-30">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center space-x-2 space-x-reverse cursor-pointer group" onClick={openMap}>
            <div className="bg-orange-50 p-3 rounded-2xl text-orange-600 group-hover:bg-orange-100 transition shadow-sm">
              <MapPin size={22} fill="currentColor" className="text-orange-200" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold tracking-wide uppercase">{t('deliverTo')}</p>
              <p className="text-sm font-black text-gray-900 flex items-center mt-0.5">
                {location.isVerified ? location.name.substring(0, 20) + '...' : t('selectLocation')} <ChevronLeft size={16} className="text-gray-400 mx-1" />
              </p>
            </div>
          </div>
        </div>
        <div className="relative" onClick={openSearch}>
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none"><Search size={20} className="text-orange-500" /></div>
          <div className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pr-12 pl-4 text-sm text-gray-500 font-bold flex items-center shadow-inner cursor-pointer hover:bg-gray-100">{t('searchPlaceholder')}</div>
        </div>
      </div>

      <div className="px-5 mt-6 mb-8 relative">
        <div className="w-full h-48 rounded-[30px] overflow-hidden relative shadow-lg shadow-gray-200 cursor-pointer" onClick={() => navigate('category', {catId: 'restaurant'})}>
          <img src={banners[currentBanner]?.imgUrl} className="w-full h-full object-cover transition-transform duration-700 scale-105" />
          <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/40 to-transparent flex flex-col justify-center p-6 text-white">
            <span className="bg-orange-500 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider w-max mb-2">{t('newOffer')}</span>
            <h2 className="text-2xl font-black mb-1 drop-shadow-md leading-tight w-2/3">{banners[currentBanner]?.title.ar || banners[currentBanner]?.title}</h2>
            <p className="text-sm font-bold opacity-90 mb-3 drop-shadow-md">{banners[currentBanner]?.subtitle.ar || banners[currentBanner]?.subtitle}</p>
            <button className="bg-white text-gray-900 text-xs font-black py-2.5 px-5 rounded-xl shadow-md w-max">{t('orderNow')}</button>
          </div>
        </div>
        <div className="flex justify-center mt-4 gap-2">
          {banners.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentBanner ? 'w-8 bg-orange-500 shadow-sm' : 'w-2 bg-gray-300'}`} />
          ))}
        </div>
      </div>

      <div className="px-5 mb-8">
        <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2"><LayoutGrid size={20} className="text-orange-500"/> {t('categories')}</h3>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => (
            <div key={cat.id} onClick={() => navigate('category', { catId: cat.id })} className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md hover:border-orange-200 transition-all group flex flex-col h-36 relative">
               <img src={cat.imgUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
               <div className="relative z-10 mt-auto p-4 flex flex-col">
                 <span className="text-white font-black text-sm mb-1">{cat.name.ar || cat.name}</span>
                 <div className="flex items-center gap-2">
                   <span className="bg-white/20 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1"><Store size={10}/> {cat.storesCount}</span>
                 </div>
               </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 mb-8">
         <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2"><Flame size={20} className="text-red-500"/> {t('nearbyStores')}</h3>
         <div className="flex flex-col gap-4">
            {stores.filter(s=>s.status==='approved').slice(0,4).map(shop => (
              <div key={shop.id} onClick={() => navigate('shop', { shop })} className="bg-white rounded-[24px] p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-orange-200 transition-all">
                <div className="w-full h-36 rounded-2xl relative overflow-hidden bg-gray-100 mb-3">
                  <img src={shop.coverUrl} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-xl text-xs font-black flex items-center text-gray-900 shadow-sm"><Star size={14} className="text-yellow-500 mx-1 fill-current" /> {shop.rating}</div>
                  {shop.fee === 0 && <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-lg text-[10px] font-black shadow-sm">{t('freeDelivery')}</div>}
                </div>
                <div className="flex items-start gap-3 px-1">
                  <img src={shop.logoUrl} className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md -mt-8 relative z-10 bg-white" />
                  <div className="flex-1 mt-1">
                    <h4 className="font-black text-gray-900 text-base">{shop.name}</h4>
                    <p className="text-[11px] text-gray-500 font-bold">{categories.find(c=>c.id===shop.catId)?.name.ar}</p>
                  </div>
                  <div className="bg-gray-50 px-2 py-1.5 rounded-xl flex items-center gap-1 text-[11px] font-bold text-gray-700 mt-1 border border-gray-100"><Clock size={14} className="text-gray-400" /> {shop.time}</div>
                </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

// --- Category Screen (With Real Filters) ---
const CategoryScreen = ({ catId, navigate, goBack, openSearch }) => {
  const { categories, stores, t } = useContext(AppContext);
  const category = categories.find(c => c.id === catId);
  const [filter, setFilter] = useState('all'); // all, top, fast, free, open

  let catShops = stores.filter(s => s.catId === catId && s.status === 'approved');
  
  if (filter === 'top') catShops = catShops.sort((a,b) => b.rating - a.rating);
  if (filter === 'fast') catShops = catShops.sort((a,b) => a.time - b.time);
  if (filter === 'free') catShops = catShops.filter(s => s.fee === 0);
  if (filter === 'open') catShops = catShops.filter(s => s.isOpen);

  return (
    <div className="bg-gray-50 min-h-screen animate-slide-in-right pb-10">
      <div className="bg-white px-5 pt-10 pb-4 shadow-sm sticky top-0 z-20 border-b border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <button onClick={goBack} className="p-2 -mx-2 text-gray-800 bg-gray-100 rounded-full hover:bg-gray-200 transition"><ChevronRight size={24} /></button>
            <h1 className="text-lg font-black mx-3">{category?.name.ar || category?.name}</h1>
          </div>
          <button onClick={openSearch} className="p-2 text-gray-800 bg-gray-100 rounded-full hover:bg-gray-200 transition"><Search size={20} /></button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
           <button className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1 shadow-sm flex-shrink-0"><Filter size={14}/> {t('filters')}</button>
           {[
             {id:'all', label: 'الكل'}, {id:'top', label: t('topRated')}, 
             {id:'fast', label: t('fastest')}, {id:'open', label: t('openNow')}, {id:'free', label: t('freeDelivery')}
           ].map(f => (
             <button key={f.id} onClick={()=>setFilter(f.id)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-colors ${filter===f.id ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-white border border-gray-200 text-gray-700'}`}>{f.label}</button>
           ))}
        </div>
      </div>

      <div className="px-5 mt-6">
        <div className="w-full h-32 rounded-3xl overflow-hidden relative shadow-md mb-6 border border-gray-100">
           <img src={category?.imgUrl} className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><h2 className="text-white text-2xl font-black drop-shadow-lg flex items-center gap-2">{category?.icon} اكتشف أفضل المتاجر</h2></div>
        </div>

        <div className="flex flex-col gap-4">
          {catS
<truncated 43514 bytes>

NOTE: The output was truncated because it was too long. Use a more targeted query or a smaller range to get the information you need.