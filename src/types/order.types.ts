export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imgUrl: string;
}

export interface Order {
  id: string;
  shopId: string;
  shopName: string;
  customerId?: string;
  customerName?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: 'cash_on_delivery' | 'instapay' | 'paymob_card' | 'paymob_wallet';
  paymentStatus?: 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  paymentId?: string;
  paymentMetadata?: Record<string, any>;
  paymentVerifiedAt?: any;
  paymentVerifiedBy?: string;
  paymentReceiptUrl?: string;
  paymentReference?: string;
  paymentReceipt?: string;
  location: {
    name: string;
    coords?: { lat: number; lng: number } | null;
    isVerified: boolean;
  };
  status: 'pending' | 'accepted' | 'preparing' | 'ready_for_delivery' | 'driver_assigned' | 'driver_accepted' | 'picked_up' | 'on_the_way' | 'delivered' | 'cancelled' | 'returned';
  driverId?: string;
  driverName?: string;
  assignedDriverId?: string;
  assignedAt?: string;
  assignmentDistance?: number;
  estimatedPickupTime?: number;
  assignmentAttempts?: number;
  rejectedBy?: string[];
  createdAt: string;
  discount?: number;
  ratingStore?: number;
  ratingDriver?: number;
  ratingProducts?: number;
  ratingComment?: string;
  storeLocation?: { lat: number; lng: number };
  completedAt?: string;
  updatedAt?: string;
}
