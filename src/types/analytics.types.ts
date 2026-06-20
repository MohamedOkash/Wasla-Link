export interface DriverMetrics {
  driverId: string;
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  lifetimeEarnings: number;
  acceptanceRate: number; // e.g. 96 (%)
  completionRate: number;  // e.g. 98 (%)
  averageDeliveryTime: number; // in minutes
  completedDeliveries: number;
}

export interface VendorMetrics {
  storeId: string;
  revenue: number;
  ordersCount: number;
  productsCount: number;
  categoriesCount: number;
  refundsCount: number;
  returnsCount: number;
  revenueByVillage: Record<string, number>;
  topProducts: Array<{ id: string; name: string; quantity: number; revenue: number }>;
}

export interface PlatformMetrics {
  totalStores: number;
  totalCustomers: number;
  totalDrivers: number;
  platformRevenue: number;
  totalSales: number;
  marketplacePerformance: {
    monthlyGrowth: number; // percentage
    activeUsersCount: number;
  };
}
