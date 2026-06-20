import React from 'react';
import { Heart, Plus, Minus, Star, Zap } from 'lucide-react';
import { Product } from '../../types/product.types';
import { Store } from '../../types/store.types';
import { calculateDiscountedPrice, getPromoLabel } from '../../utils/promo';

interface ProductCardProps {
  product: Product;
  shop?: Store;
  onProductClick: (product: Product, shop?: Store) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onRemoveFromCart?: (productId: string, e: React.MouseEvent) => void;
  quantityInCart?: number;
  isFavorite: boolean;
  onToggleFavorite: (productId: string, e: React.MouseEvent) => void;
  isRTL: boolean;
  t: (key: string) => string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  shop,
  onProductClick,
  onAddToCart,
  onRemoveFromCart,
  quantityInCart = 0,
  isFavorite,
  onToggleFavorite,
  isRTL,
  t
}) => {
  const discountedPrice = calculateDiscountedPrice(product, 1);
  const hasDiscount = discountedPrice < product.price;
  const promoLabel = getPromoLabel(product, isRTL);
  
  // Calculate percentage discount if fixed discount is present
  const discountPercent = hasDiscount 
    ? Math.round(((product.price - discountedPrice) / product.price) * 100) 
    : 0;

  return (
    <div 
      onClick={() => onProductClick(product, shop)}
      className="bg-theme-card border border-theme-border/60 rounded-[24px] p-3 w-40 shrink-0 shadow-sm cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col justify-between relative group animate-card-entrance"
    >
      {/* Product Image Container */}
      <div className="h-32 w-full rounded-2xl overflow-hidden bg-theme-bg relative mb-2.5 flex-shrink-0">
        <img 
          src={product.imgUrl} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          alt={product.name} 
        />
        
        {/* Hover overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Favorite Button */}
        <button
          onClick={(e) => onToggleFavorite(product.id, e)}
          className="absolute top-2 left-2 p-2 bg-theme-card/90 backdrop-blur-md hover:bg-theme-card text-theme-text rounded-full shadow-sm active:scale-90 transition z-10 border border-theme-border/30"
        >
          <Heart 
            size={12} 
            className={isFavorite ? 'fill-red-500 stroke-red-500 text-red-500' : 'text-theme-muted group-hover:text-red-400 transition-colors'} 
          />
        </button>

        {/* Discount Badge */}
        {hasDiscount && (
          <span className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[8px] font-black px-2 py-0.5 rounded-lg shadow-sm">
            {discountPercent > 0 ? `-${discountPercent}%` : t('offer')}
          </span>
        )}

        {/* Quick Promo Badge */}
        {promoLabel && !hasDiscount && (
          <span className="absolute bottom-2 right-2 bg-primary text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-sm">
            {promoLabel}
          </span>
        )}
      </div>

      {/* Product Information */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Brand/Category Label */}
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-[8px] font-black text-primary uppercase tracking-wider truncate">
              {product.cat}
            </span>
            {product.averageRating !== undefined && product.averageRating > 0 && (
              <div className="flex items-center gap-0.5 text-amber-500">
                <Star size={8} className="fill-amber-500" />
                <span className="text-[8px] font-black font-sans">{(product.averageRating).toFixed(1)}</span>
              </div>
            )}
          </div>
          
          <h4 className="text-[11px] font-black text-theme-text line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h4>
          
          {shop && (
            <p className="text-[9px] text-theme-muted font-bold truncate mt-0.5 flex items-center gap-1">
              <span>{shop.name}</span>
              {shop.village && (
                <span className="text-[8px] px-1 bg-theme-border/40 rounded text-theme-muted">
                  {shop.village}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Price & Add to Cart Action */}
        <div className="flex items-center justify-between mt-3 flex-shrink-0">
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-primary font-sans">
              {discountedPrice} ج.م
            </span>
            {hasDiscount && (
              <span className="text-[8px] text-theme-muted line-through font-bold font-sans">
                {product.price} ج.m
              </span>
            )}
          </div>

          {/* Quick Add Button / Counter */}
          {quantityInCart > 0 && onRemoveFromCart ? (
            <div className="flex items-center bg-theme-bg border border-theme-border rounded-xl p-0.5 shadow-sm">
              <button 
                onClick={(e) => onRemoveFromCart(product.id, e)} 
                className="p-1 text-theme-text hover:bg-theme-border rounded-lg transition"
              >
                <Minus size={8} strokeWidth={3} />
              </button>
              <span className="text-[10px] font-black text-theme-text px-1.5 font-sans">{quantityInCart}</span>
              <button 
                onClick={(e) => onAddToCart(product, e)} 
                className="p-1 text-theme-text hover:bg-theme-border rounded-lg transition"
              >
                <Plus size={8} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <button 
              onClick={(e) => onAddToCart(product, e)}
              className="p-2 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-sm hover:shadow active:scale-90 transition duration-200"
            >
              <Plus size={12} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
