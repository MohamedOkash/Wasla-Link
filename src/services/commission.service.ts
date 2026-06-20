import { Order } from '../types/order.types';

class CommissionService {
  private defaultCommissionRate = 10; // 10% platform fee

  /**
   * Calculates platform commission and vendor net share for an order.
   */
  calculateOrderRevenue(
    order: Order,
    commissionRate = this.defaultCommissionRate
  ): {
    platformCommission: number;
    vendorNet: number;
    deliveryFee: number;
    total: number;
  } {
    const subtotal = order.subtotal;
    const platformCommission = Math.round(subtotal * (commissionRate / 100));
    const vendorNet = Math.max(0, subtotal - platformCommission);
    return {
      platformCommission,
      vendorNet,
      deliveryFee: order.deliveryFee,
      total: order.total
    };
  }

  /**
   * Generates periodic financial totals from a list of completed orders.
   */
  calculateFinancialTotals(orders: Order[], commissionRate = this.defaultCommissionRate) {
    const completedOrders = orders.filter(o => o.status === 'delivered');

    let totalGrossSales = 0;
    let totalPlatformRevenue = 0;
    let totalVendorNet = 0;
    let totalDeliveryFees = 0;

    const dailyBreakdown: Record<string, number> = {};
    const weeklyBreakdown: Record<string, number> = {};
    const monthlyBreakdown: Record<string, number> = {};

    completedOrders.forEach(o => {
      const { platformCommission, vendorNet } = this.calculateOrderRevenue(o, commissionRate);
      totalGrossSales += o.subtotal;
      totalPlatformRevenue += platformCommission;
      totalVendorNet += vendorNet;
      totalDeliveryFees += o.deliveryFee;

      const dateStr = o.createdAt.split('T')[0]; // "YYYY-MM-DD"
      const monthStr = dateStr.substring(0, 7); // "YYYY-MM"
      
      // Weekly key (Year-WeekNumber)
      const dateObj = new Date(o.createdAt);
      const startOfYear = new Date(dateObj.getFullYear(), 0, 1);
      const days = Math.floor((dateObj.getTime() - startOfYear.getTime()) / (24 * 3600 * 1000));
      const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
      const weekStr = `${dateObj.getFullYear()}-W${weekNum}`;

      dailyBreakdown[dateStr] = (dailyBreakdown[dateStr] || 0) + o.subtotal;
      weeklyBreakdown[weekStr] = (weeklyBreakdown[weekStr] || 0) + o.subtotal;
      monthlyBreakdown[monthStr] = (monthlyBreakdown[monthStr] || 0) + o.subtotal;
    });

    return {
      totalGrossSales,
      totalPlatformRevenue,
      totalVendorNet,
      totalDeliveryFees,
      dailyBreakdown,
      weeklyBreakdown,
      monthlyBreakdown
    };
  }
}

export const commissionService = new CommissionService();
export default commissionService;
