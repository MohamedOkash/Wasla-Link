export interface ReturnTimelineEvent {
  status: 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'refunded' | 'replaced' | 'completed';
  note?: string;
  createdAt: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  storeId: string;
  storeName: string;
  customerId: string;
  customerName: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  reason: string;
  type: 'refund' | 'replacement';
  status: 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'refunded' | 'replaced' | 'completed';
  images?: string[];
  timeline: ReturnTimelineEvent[];
  createdAt: string;
  updatedAt: string;
}
