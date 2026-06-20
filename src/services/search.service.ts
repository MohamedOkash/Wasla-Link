import { Product } from '../types/product.types';
import { Store } from '../types/store.types';
import { Category } from '../data/categories';

export interface ScoredResult<T> {
  item: T;
  score: number;
}

export const searchProductsAndStores = (
  query: string,
  products: Product[],
  stores: Store[],
  categories: Category[]
) => {
  const q = query.toLowerCase().trim();
  if (!q) return { shops: [], products: [], categories: [] };

  // 1. Search & Score Stores (Store Name Match = 80)
  const scoredShops: ScoredResult<Store>[] = stores
    .filter(s => s.status === 'approved')
    .map(s => {
      let score = 0;
      const sName = s.name.toLowerCase();
      if (sName === q) {
        score = 80;
      } else if (sName.includes(q)) {
        score = 70;
      }
      return { item: s, score };
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // 2. Search & Score Products (Exact Barcode = 110, Exact SKU = 105, Exact Product Match = 100, Brand Match = 70-85, Offer Match = 40)
  const scoredProducts: ScoredResult<Product & { shop?: Store }>[] = products
    .map(p => {
      let score = 0;
      const pName = p.name.toLowerCase();
      const pDesc = (p.desc || '').toLowerCase();
      const pBrand = ((p.productBrand || p.brand) || '').toLowerCase();
      const pSku = (p.sku || '').toLowerCase();
      const pBarcode = (p.barcode || '').toLowerCase();
      
      if (pBarcode === q) {
        score = 110;
      } else if (pSku === q) {
        score = 105;
      } else if (pName === q) {
        score = 100;
      } else if (pName.includes(q)) {
        score = 90;
      } else if (pBrand === q) {
        score = 85;
      } else if (pBrand.includes(q)) {
        score = 70;
      } else if (pDesc.includes(q)) {
        score = 50;
      } else if (p.isOffer && (q === 'عرض' || q === 'عروض' || q === 'خصم' || q === 'خصومات' || q === 'offer' || q === 'offers' || q === 'sale')) {
        score = 60;
      } else if (p.isOffer && pDesc.includes(q)) {
        score = 40;
      }
      
      const shop = stores.find(s => s.id === p.storeId);
      return { item: { ...p, shop }, score };
    })
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score);

  // 3. Search & Score Categories (Category Match = 60)
  const scoredCategories: ScoredResult<Category>[] = categories
    .map(c => {
      let score = 0;
      const catAr = c.name.ar.toLowerCase();
      const catEn = c.name.en.toLowerCase();
      if (catAr === q || catEn === q) {
        score = 60;
      } else if (catAr.includes(q) || catEn.includes(q)) {
        score = 50;
      }
      return { item: c, score };
    })
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score);

  return {
    shops: scoredShops.map(s => s.item),
    products: scoredProducts.map(p => p.item),
    categories: scoredCategories.map(c => c.item)
  };
};
