export interface Product {
  // Existing base fields
  id: string;
  storeId: string;
  cat: string; // Left for backward compatibility (maps to categoryName)
  name: string; // Left for backward compatibility (maps to nameAr/nameEn)
  desc: string; // Left for backward compatibility (maps to description)
  price: number; // Left for backward compatibility (maps to sellingPrice)
  imgUrl: string; // Left for backward compatibility (maps to imageUrl)

  // Universal Product Schema fields (Phase 12A)
  nameAr?: string;
  nameEn?: string;
  templateId?: string;
  categoryId?: string;
  categoryName?: string;
  brand?: string;
  barcode?: string;
  sku?: string;
  unit?: string;
  weight?: string;
  imageUrl?: string;
  images?: string[];
  description?: string;
  costPrice?: number;
  sellingPrice?: number;
  stock?: number;
  reservedStock?: number;
  minStock?: number;
  averageRating?: number;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  isTrending?: boolean;
  viewsCount?: number;
  salesCount?: number;
  favoritesCount?: number;
  isTemplate?: boolean;
  storeType?: string;
  isActive?: boolean;
  imageKeywords?: string[];

  // Existing extra fields (Phase 8–11)
  isOffer?: boolean;
  oldPrice?: number | null;
  offerType?: 'percentage' | 'fixed' | 'buyOneGetOne' | 'bundle';
  offerValue?: number;
  gallery?: string[];
  productBrand?: string;
  productWeight?: string;
  purchasePrice?: number;
  profitMargin?: number;
  currentStock?: number;
  lowStockThreshold?: number;
  availabilityStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'archived';
  ratingsCount?: number;

  // Media Asset Management (Phase 12B)
  primaryImage?: string;
  galleryImages?: string[];
  imageSource?: 'template' | 'vendor' | 'generated';
  assetStatus?: 'pending' | 'ready' | 'missing';
  templateImageVersion?: number;
  lastAssetUpdate?: string;
  syncStatus?: 'synced' | 'outdated';
  assetVersion?: number;
}

