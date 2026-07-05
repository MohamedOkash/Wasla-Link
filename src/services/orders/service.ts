import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';

export interface PlaceOrderPayload {
  cartItems: { id: string; quantity: number }[];
  storeId: string;
  activeCouponId?: string | null;
  pointsToRedeem?: number;
  address: any;
  paymentMethod: string;
  paymentReceipt?: string | null;
}

export class OrderService {
  async placeOrder(payload: PlaceOrderPayload): Promise<any> {
    const createOrderFn = httpsCallable(functions, 'createOrder');
    const result = await createOrderFn({
      cartItems: payload.cartItems,
      storeId: payload.storeId,
      couponId: payload.activeCouponId || null,
      pointsToRedeem: payload.pointsToRedeem || 0,
      address: payload.address,
      paymentMethod: payload.paymentMethod,
      paymentReceipt: payload.paymentReceipt || null
    });
    return result.data;
  }
}

export const orderService = new OrderService();
