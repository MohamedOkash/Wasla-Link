import { Product } from '../types/product.types';
import { Order } from '../types/order.types';

class RecommendationService {
  /**
   * Returns products in the same category, excluding the current product itself.
   */
  getSimilarProducts(product: Product, allProducts: Product[], limit = 5): Product[] {
    return allProducts
      .filter(p => p.cat === product.cat && p.id !== product.id)
      .slice(0, limit);
  }

  /**
   * Finds products frequently bought in the same order as the target product.
   */
  getFrequentlyBoughtTogether(product: Product, allProducts: Product[], allOrders: Order[], limit = 5): Product[] {
    const productAffinities: Record<string, number> = {};

    // Scan order history to count co-occurrences
    allOrders.forEach(order => {
      const hasProduct = order.items.some(item => item.id === product.id);
      if (hasProduct) {
        order.items.forEach(item => {
          if (item.id !== product.id) {
            productAffinities[item.id] = (productAffinities[item.id] || 0) + item.quantity;
          }
        });
      }
    });

    // Sort product IDs by co-occurrence count
    const sortedProductIds = Object.keys(productAffinities)
      .sort((a, b) => productAffinities[b] - productAffinities[a]);

    // Map back to Product objects
    const recommended = sortedProductIds
      .map(id => allProducts.find(p => p.id === id))
      .filter((p): p is Product => !!p);

    // Fallback to same-category bestsellers if history is sparse
    if (recommended.length < limit) {
      const fallbacks = allProducts
        .filter(p => p.cat === product.cat && p.id !== product.id && !sortedProductIds.includes(p.id))
        .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
      
      return [...recommended, ...fallbacks].slice(0, limit);
    }

    return recommended.slice(0, limit);
  }

  /**
   * Tailored recommendations based on customer purchase history and favorites.
   */
  getYouMayLike(
    allProducts: Product[],
    customerOrders: Order[],
    favoriteStoreIds: string[],
    limit = 6
  ): Product[] {
    // 1. Extract favorite categories from past orders
    const categoryCounts: Record<string, number> = {};
    customerOrders.forEach(order => {
      order.items.forEach(item => {
        const prod = allProducts.find(p => p.id === item.id);
        if (prod) {
          categoryCounts[prod.cat] = (categoryCounts[prod.cat] || 0) + item.quantity;
        }
      });
    });

    const favoriteCategories = Object.keys(categoryCounts)
      .sort((a, b) => categoryCounts[b] - categoryCounts[a]);

    // 2. Score and sort products
    const scoredProducts = allProducts.map(prod => {
      let score = 0;
      // Boost for favorite stores
      if (favoriteStoreIds.includes(prod.storeId)) {
        score += 30;
      }
      // Boost for favorite categories
      const catIndex = favoriteCategories.indexOf(prod.cat);
      if (catIndex !== -1) {
        score += Math.max(0, 20 - catIndex * 5);
      }
      // Boost for popular/best sellers
      if (prod.isBestSeller) {
        score += 10;
      }
      if (prod.salesCount) {
        score += Math.min(10, prod.salesCount);
      }
      return { prod, score };
    });

    return scoredProducts
      .sort((a, b) => b.score - a.score)
      .map(item => item.prod)
      .slice(0, limit);
  }

  /**
   * Returns products sorted by sales or views count.
   */
  getTrendingNow(allProducts: Product[], limit = 6): Product[] {
    return [...allProducts]
      .sort((a, b) => {
        const scoreA = (a.salesCount || 0) * 2 + (a.viewsCount || 0);
        const scoreB = (b.salesCount || 0) * 2 + (b.viewsCount || 0);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }
}

export const recommendationService = new RecommendationService();
