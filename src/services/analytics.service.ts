import { Order } from '../types/order.types';
import { Product } from '../types/product.types';
import { User } from '../types/user.types';
import { Store } from '../types/store.types';

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
  totalCommissions: number;
  totalOrdersCount: number;
  activeUsersCount: number;
  storePerformance: { name: string; gmv: number; ordersCount: number }[];
  salesTrend: number[];
  orderStatusDistribution: Record<string, number>;
  totalUsers: number;
  totalStores: number;
  totalDrivers: number;
  activeDrivers: number;
  busyDrivers: number;
  availableDrivers: number;
  ordersInDelivery: number;
  avgDeliveryTime: number;
  avgAcceptanceRate: number;
  driverRejectionRate: number;
}

export interface StorePerformance {
  ordersCount: number;
  revenue: number;
  avgRating: number;
  avgPreparationTime: number; // in minutes
  cancelRate: number; // percentage
  completionRate: number; // percentage
  storeScore: number;
}

export interface DriverPerformance {
  deliveries: number;
  acceptanceRate: number;
  rejectionRate: number;
  avgDeliveryTime: number; // in minutes
  earnings: number;
  driverScore: number;
}

export interface CustomerAnalytics {
  ordersCount: number;
  totalSpending: number;
  lastOrderDate: number | null;
  retentionStatus: 'VIP' | 'Loyal' | 'Active' | 'At Risk' | 'Inactive';
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

  getAdminKPIs(orders: Order[], users: User[] = [], stores: Store[] = [], drivers: User[] = []): AdminKPIs {
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

    // Logistics Overview
    const activeDrivers = drivers.filter(d => d.isOnline).length;
    const busyDrivers = drivers.filter(d => d.isOnline && d.currentOrderId).length;
    const availableDrivers = activeDrivers - busyDrivers;
    const ordersInDelivery = orders.filter(o => o.status === 'picked_up' || o.status === 'on_the_way').length;

    // Performance
    let totalDeliveryTime = 0;
    let validDeliveryOrders = 0;
    deliveredOrders.forEach(o => {
      const created = new Date(o.createdAt).getTime();
      const completed = new Date(o.completedAt || o.updatedAt || o.createdAt).getTime();
      if (completed > created) {
        totalDeliveryTime += (completed - created) / (1000 * 60); // minutes
        validDeliveryOrders++;
      }
    });
    const avgDeliveryTime = validDeliveryOrders > 0 ? parseFloat((totalDeliveryTime / validDeliveryOrders).toFixed(1)) : 0;

    // Calculate acceptance and rejection rates over all orders
    let totalPings = 0;
    let totalAccepts = 0;
    let totalRejects = 0;
    orders.forEach(o => {
      const rejects = o.rejectedBy ? o.rejectedBy.length : 0;
      totalRejects += rejects;
      if (o.driverId) totalAccepts += 1;
      totalPings += (rejects + (o.driverId ? 1 : 0));
    });
    const avgAcceptanceRate = totalPings > 0 ? parseFloat(((totalAccepts / totalPings) * 100).toFixed(1)) : 0;
    const driverRejectionRate = totalPings > 0 ? parseFloat(((totalRejects / totalPings) * 100).toFixed(1)) : 0;

    const data: AdminKPIs = {
      totalGMV,
      totalCommissions,
      totalOrdersCount,
      activeUsersCount,
      storePerformance,
      salesTrend,
      orderStatusDistribution,
      totalUsers: users.length,
      totalStores: stores.length,
      totalDrivers: drivers.length,
      activeDrivers,
      busyDrivers,
      availableDrivers,
      ordersInDelivery,
      avgDeliveryTime,
      avgAcceptanceRate,
      driverRejectionRate
    };

    this.adminCache = { data, timestamp: now };
    return data;
  }

  getStorePerformance(storeId: string, orders: Order[]): StorePerformance {
    const vendorOrders = orders.filter(o => o.shopId === storeId);
    const ordersCount = vendorOrders.length;
    
    let revenue = 0;
    let totalPrepTime = 0;
    let prepOrders = 0;
    let ratingSum = 0;
    let ratedCount = 0;
    
    const delivered = vendorOrders.filter(o => o.status === 'delivered');
    const cancelled = vendorOrders.filter(o => o.status === 'cancelled');
    
    delivered.forEach(o => {
      revenue += o.total;
      // rating implementation placeholder if orders hold ratings
      ratingSum += 4.5; // Stub for average rating until ratings array exists
      ratedCount++;
    });

    // Preparation time mock - would be diff between accepted and ready_for_delivery
    totalPrepTime = 15 * delivered.length; 
    prepOrders = delivered.length;

    const avgRating = ratedCount > 0 ? parseFloat((ratingSum / ratedCount).toFixed(1)) : 4.5;
    const avgPreparationTime = prepOrders > 0 ? parseFloat((totalPrepTime / prepOrders).toFixed(1)) : 15;
    const cancelRate = ordersCount > 0 ? parseFloat(((cancelled.length / ordersCount) * 100).toFixed(1)) : 0;
    const completionRate = ordersCount > 0 ? parseFloat(((delivered.length / ordersCount) * 100).toFixed(1)) : 0;

    // score = (revenue * 0.35) + (rating * 0.25) + (completionRate * 0.25) + ((100 - cancelRate) * 0.15)
    // normalize revenue for score (e.g. max 100 score points)
    const normRev = Math.min(revenue / 1000, 100); 
    const score = (normRev * 0.35) + ((avgRating/5*100) * 0.25) + (completionRate * 0.25) + ((100 - cancelRate) * 0.15);

    return {
      ordersCount,
      revenue,
      avgRating,
      avgPreparationTime,
      cancelRate,
      completionRate,
      storeScore: parseFloat(score.toFixed(1))
    };
  }

  getDriverPerformance(driverId: string, orders: Order[]): DriverPerformance {
    let deliveries = 0;
    let earnings = 0;
    let totalDeliveryTime = 0;
    let accepted = 0;
    let rejected = 0;
    
    orders.forEach(o => {
      if (o.driverId === driverId) {
        accepted++;
        if (o.status === 'delivered') {
          deliveries++;
          earnings += o.deliveryFee || 0; // simplistic earning calc
          const created = new Date(o.createdAt).getTime();
          const completed = new Date(o.completedAt || o.updatedAt || o.createdAt).getTime();
          totalDeliveryTime += (completed - created) / (1000 * 60);
        }
      } else if (o.rejectedBy?.includes(driverId)) {
        rejected++;
      }
    });

    const totalPings = accepted + rejected;
    const acceptanceRate = totalPings > 0 ? parseFloat(((accepted / totalPings) * 100).toFixed(1)) : 100;
    const rejectionRate = totalPings > 0 ? parseFloat(((rejected / totalPings) * 100).toFixed(1)) : 0;
    const avgDeliveryTime = deliveries > 0 ? parseFloat((totalDeliveryTime / deliveries).toFixed(1)) : 30;
    
    // onTimeDeliveries mock
    const onTimeDeliveries = 100; 
    const rating = 4.8; // mock rating

    const score = (acceptanceRate * 0.35) + (onTimeDeliveries * 0.35) + ((rating/5*100) * 0.20) + ((100 - rejectionRate) * 0.10);

    return {
      deliveries,
      acceptanceRate,
      rejectionRate,
      avgDeliveryTime,
      earnings,
      driverScore: parseFloat(score.toFixed(1))
    };
  }

  getCustomerAnalytics(customerId: string, orders: Order[]): CustomerAnalytics {
    const userOrders = orders.filter(o => o.customerId === customerId);
    const ordersCount = userOrders.length;
    let totalSpending = 0;
    let lastOrderDate = 0;

    userOrders.forEach(o => {
      if (o.status === 'delivered') totalSpending += o.total;
      const ts = new Date(o.createdAt).getTime();
      if (ts > lastOrderDate) lastOrderDate = ts;
    });

    let retentionStatus: 'VIP' | 'Loyal' | 'Active' | 'At Risk' | 'Inactive' = 'Inactive';
    const daysSinceLastOrder = lastOrderDate > 0 ? (Date.now() - lastOrderDate) / (1000 * 60 * 60 * 24) : 999;

    if (ordersCount === 0) retentionStatus = 'New' as any;
    else if (ordersCount >= 10 && totalSpending > 500) retentionStatus = 'VIP';
    else if (ordersCount >= 5) retentionStatus = 'Loyal';
    else if (daysSinceLastOrder <= 30) retentionStatus = 'Active';
    else if (daysSinceLastOrder <= 60) retentionStatus = 'At Risk';
    else retentionStatus = 'Inactive';

    return {
      ordersCount,
      totalSpending,
      lastOrderDate: lastOrderDate > 0 ? lastOrderDate : null,
      retentionStatus
    };
  }
}

export const analyticsService = new AnalyticsService();
