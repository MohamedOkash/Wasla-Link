import { Order } from '../types/order.types';
import { Product } from '../types/product.types';

export interface VendorKPIs {
  totalSales: number;
  totalProfit: number;
  deliveredOrdersCount: number;
  cancelledOrdersCount: number;
  avgOrderValue: number;
  topProducts: { name: string; qty: number; sales: number }[];
  topCategories: { name: string; sales: number }[];
  villageDemographics: { name: string; orders: number; sales: number }[];
  recentSalesTrend: number[]; // Sales per day for the last 7 days
}

export interface AdminKPIs {
  totalGMV: number;
  totalCommissions: number; // 5% of GMV or custom commission
  totalOrdersCount: number;
  activeUsersCount: number; // Users with at least 1 order
  storePerformance: { name: string; gmv: number; ordersCount: number }[];
  salesTrend: number[]; // Daily GMV for last 7 days
  orderStatusDistribution: Record<string, number>;
}

class AnalyticsService {
  private vendorCache: Record<string, { data: VendorKPIs; timestamp: number }> = {};
  private adminCache: { data: AdminKPIs; timestamp: number } | null = null;
  private CACHE_TTL = 15000; // 15 seconds cache to prevent excessive loops in React renders

  getVendorKPIs(storeId: string, orders: Order[], products: Product[]): VendorKPIs {
    const now = Date.now();
    if (this.vendorCache[storeId] && (now - this.vendorCache[storeId].timestamp < this.CACHE_TTL)) {
      return this.vendorCache[storeId].data;
    }

    const vendorOrders = orders.filter(o => o.shopId === storeId);
    const deliveredOrders = vendorOrders.filter(o => o.status === 'delivered');
    const cancelledOrders = vendorOrders.filter(o => o.status === 'cancelled');

    // 1. Calculations
    const totalSales = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
    
    // Net profit = sum of (item price - costPrice) * quantity
    // Fallback costPrice to 75% of price if not specified
    let totalProfit = 0;
    deliveredOrders.forEach(o => {
      o.items.forEach(item => {
        const prod = products.find(p => p.id === item.id);
        const cost = prod?.costPrice || prod?.purchasePrice || (item.price * 0.75);
        totalProfit += (item.price - cost) * item.quantity;
      });
      const discount = o.discount || 0;
      totalProfit = Math.max(0, totalProfit - discount);
    });

    const deliveredOrdersCount = deliveredOrders.length;
    const cancelledOrdersCount = cancelledOrders.length;
    const avgOrderValue = deliveredOrdersCount > 0 ? parseFloat((totalSales / deliveredOrdersCount).toFixed(1)) : 0;

    // 2. Top products
    const productSales: Record<string, { name: string; qty: number; sales: number }> = {};
    deliveredOrders.forEach(o => {
      o.items.forEach(item => {
        if (!productSales[item.id]) {
          productSales[item.id] = { name: item.name, qty: 0, sales: 0 };
        }
        productSales[item.id].qty += item.quantity;
        productSales[item.id].sales += item.price * item.quantity;
      });
    });
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // 3. Top categories
    const categorySales: Record<string, number> = {};
    deliveredOrders.forEach(o => {
      o.items.forEach(item => {
        const prod = products.find(p => p.id === item.id);
        const cat = prod?.cat || 'أخرى';
        categorySales[cat] = (categorySales[cat] || 0) + (item.price * item.quantity);
      });
    });
    const topCategories = Object.entries(categorySales)
      .map(([name, sales]) => ({ name, sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // 4. Village demographics
    const villageData: Record<string, { orders: number; sales: number }> = {};
    deliveredOrders.forEach(o => {
      let village = 'أخرى';
      if (o.location?.name) {
        const parts = (o.location?.name || '').split('،');
        if (parts.length >= 3) {
          village = parts[2].trim();
        } else {
          village = parts[0].trim();
        }
      }
      if (!villageData[village]) {
        villageData[village] = { orders: 0, sales: 0 };
      }
      villageData[village].orders += 1;
      villageData[village].sales += o.total;
    });
    const villageDemographics = Object.entries(villageData)
      .map(([name, data]) => ({ name, orders: data.orders, sales: data.sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // 5. Recent sales trend (Last 7 days)
    const recentSalesTrend = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - idx));
      const dateStr = d.toDateString();
      return deliveredOrders
        .filter(o => new Date(o.createdAt).toDateString() === dateStr)
        .reduce((sum, o) => sum + o.total, 0);
    });

    const data: VendorKPIs = {
      totalSales,
      totalProfit: parseFloat(totalProfit.toFixed(1)),
      deliveredOrdersCount,
      cancelledOrdersCount,
      avgOrderValue,
      topProducts,
      topCategories,
      villageDemographics,
      recentSalesTrend
    };

    this.vendorCache[storeId] = { data, timestamp: now };
    return data;
  }

  getAdminKPIs(orders: Order[]): AdminKPIs {
    const now = Date.now();
    if (this.adminCache && (now - this.adminCache.timestamp < this.CACHE_TTL)) {
      return this.adminCache.data;
    }

    const deliveredOrders = orders.filter(o => o.status === 'delivered');

    // 1. Calculations
    const totalGMV = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
    const totalCommissions = parseFloat((totalGMV * 0.05).toFixed(1));
    const totalOrdersCount = orders.length;

    // Active users: customers with at least 1 order
    const orderCustomers = new Set(orders.map(o => o.customerId));
    const activeUsersCount = orderCustomers.size;

    // 2. Store performance
    const storeGMV: Record<string, { name: string; gmv: number; ordersCount: number }> = {};
    orders.forEach(o => {
      if (!storeGMV[o.shopId]) {
        storeGMV[o.shopId] = { name: o.shopName || o.shopId, gmv: 0, ordersCount: 0 };
      }
      storeGMV[o.shopId].ordersCount += 1;
      if (o.status === 'delivered') {
        storeGMV[o.shopId].gmv += o.total;
      }
    });
    const storePerformance = Object.values(storeGMV)
      .sort((a, b) => b.gmv - a.gmv);

    // 3. Sales trend (Last 7 days daily GMV)
    const salesTrend = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - idx));
      const dateStr = d.toDateString();
      return deliveredOrders
        .filter(o => new Date(o.createdAt).toDateString() === dateStr)
        .reduce((sum, o) => sum + o.total, 0);
    });

    // 4. Order status distribution
    const orderStatusDistribution: Record<string, number> = {};
    orders.forEach(o => {
      orderStatusDistribution[o.status] = (orderStatusDistribution[o.status] || 0) + 1;
    });

    const data: AdminKPIs = {
      totalGMV,
      totalCommissions,
      totalOrdersCount,
      activeUsersCount,
      storePerformance,
      salesTrend,
      orderStatusDistribution
    };

    this.adminCache = { data, timestamp: now };
    return data;
  }
}

export const analyticsService = new AnalyticsService();
