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
  paymentMethod: 'cash' | 'vodafone' | 'instapay';
  paymentReceipt?: string;
  location: {
    name: string;
    coords?: { lat: number; lng: number } | null;
    isVerified: boolean;
  };
  status: 'pending' | 'accepted' | 'preparing' | 'readyForPickup' | 'pickedUp' | 'onTheWay' | 'delivered' | 'cancelled';
  driverId?: string;
  driverName?: string;
  createdAt: string;
  discount?: number;
  ratingStore?: number;
  ratingDriver?: number;
  ratingProducts?: number;
  ratingComment?: string;
}
