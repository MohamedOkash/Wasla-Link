export interface Category {
  id: string;
  name: { ar: string; en: string }; // For backward compatibility
  imgUrl: string; // For backward compatibility
  nameAr: string;
  nameEn: string;
  image: string;
  icon: string;
}

export const initialCategories: Category[] = [
  {
    id: 'grocery',
    name: { ar: 'البقالة والسوبر ماركت', en: 'Groceries & Supermarket' },
    imgUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
    nameAr: 'البقالة والسوبر ماركت',
    nameEn: 'Groceries & Supermarket',
    image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
    icon: 'ShoppingBag'
  },
  {
    id: 'minimarket',
    name: { ar: 'ميني ماركت', en: 'Mini Market' },
    imgUrl: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=600&q=80',
    nameAr: 'ميني ماركت',
    nameEn: 'Mini Market',
    image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=600&q=80',
    icon: 'Store'
  },
  {
    id: 'library',
    name: { ar: 'المكتبة والأدوات المدرسية', en: 'Stationery & Library' },
    imgUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    nameAr: 'المكتبة والأدوات المدرسية',
    nameEn: 'Stationery & Library',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    icon: 'BookOpen'
  },
  {
    id: 'electric',
    name: { ar: 'الكهرباء والإضاءة', en: 'Electrical Store' },
    imgUrl: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&w=600&q=80',
    nameAr: 'الكهرباء والإضاءة',
    nameEn: 'Electrical Store',
    image: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&w=600&q=80',
    icon: 'Lightbulb'
  },

  {
    id: 'pharmacy',
    name: { ar: 'الصيدلية ومستحضرات التجميل', en: 'Pharmacy' },
    imgUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=600&q=80',
    nameAr: 'الصيدلية ومستحضرات التجميل',
    nameEn: 'Pharmacy',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=600&q=80',
    icon: 'Activity'
  },
  {
    id: 'bakery',
    name: { ar: 'المخابز والحلويات', en: 'Bakery' },
    imgUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    nameAr: 'المخابز والحلويات',
    nameEn: 'Bakery',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    icon: 'Flame'
  },
  {
    id: 'restaurant',
    name: { ar: 'المطاعم والمأكولات', en: 'Restaurant' },
    imgUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    nameAr: 'المطاعم والمأكولات',
    nameEn: 'Restaurant',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    icon: 'Utensils'
  },
  {
    id: 'butcher',
    name: { ar: 'الجزارة واللحوم الطازجة', en: 'Butcher Shop' },
    imgUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80',
    nameAr: 'الجزارة واللحوم الطازجة',
    nameEn: 'Butcher Shop',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80',
    icon: 'Beef'
  },
  {
    id: 'poultry',
    name: { ar: 'الطيور والدواجن', en: 'Poultry Store' },
    imgUrl: 'https://images.unsplash.com/photo-1587593817645-121a7b7573f0?auto=format&fit=crop&w=600&q=80',
    nameAr: 'الطيور والدواجن',
    nameEn: 'Poultry Store',
    image: 'https://images.unsplash.com/photo-1587593817645-121a7b7573f0?auto=format&fit=crop&w=600&q=80',
    icon: 'Egg'
  },
  {
    id: 'fish',
    name: { ar: 'الأسماك والمأكولات البحرية', en: 'Fish & Seafood Store' },
    imgUrl: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=600&q=80',
    nameAr: 'الأسماك والمأكولات البحرية',
    nameEn: 'Fish & Seafood Store',
    image: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=600&q=80',
    icon: 'Fish'
  },
  {
    id: 'fruits_veg',
    name: { ar: 'الخضروات والفواكه الطازجة', en: 'Fruits & Vegetables' },
    imgUrl: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&w=600&q=80',
    nameAr: 'الخضروات والفواكه الطازجة',
    nameEn: 'Fruits & Vegetables',
    image: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&w=600&q=80',
    icon: 'Apple'
  },
  {
    id: 'home_appliances',
    name: { ar: 'الأجهزة المنزلية والكهربائية', en: 'Home Appliances' },
    imgUrl: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=600&q=80',
    nameAr: 'الأجهزة المنزلية والكهربائية',
    nameEn: 'Home Appliances',
    image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=600&q=80',
    icon: 'Tv'
  },

  {
    id: 'cafe',
    name: { ar: 'مقهى ومشروبات باردة وساخنة', en: 'Café & Coffee Shop' },
    imgUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    nameAr: 'مقهى ومشروبات باردة وساخنة',
    nameEn: 'Café & Coffee Shop',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    icon: 'Coffee'
  },
  {
    id: 'ice_cream',
    name: { ar: 'جيلاتي وآيس كريم', en: 'Ice Cream Parlor' },
    imgUrl: 'https://images.unsplash.com/photo-1501443710936-5b400968fd4a?auto=format&fit=crop&w=600&q=80',
    nameAr: 'جيلاتي وآيس كريم',
    nameEn: 'Ice Cream Parlor',
    image: 'https://images.unsplash.com/photo-1501443710936-5b400968fd4a?auto=format&fit=crop&w=600&q=80',
    icon: 'Zap'
  },
  {
    id: 'houseware',
    name: { ar: 'أدوات وأواني منزلية', en: 'Houseware & Kitchen' },
    imgUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
    nameAr: 'أدوات وأواني منزلية',
    nameEn: 'Houseware & Kitchen',
    image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
    icon: 'Home'
  }
];
