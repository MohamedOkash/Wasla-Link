export interface Settlement {
  id: string;
  storeId: string;
  amount: number;
  method: 'instapay' | 'vodafone' | 'bank';
  details: string; // e.g. InstaPay address or Vodafone number
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  processedAt?: string;
}

export interface WalletTransaction {
  id: string;
  storeId?: string; // If applicable to a vendor wallet
  driverId?: string; // If applicable to a driver wallet
  amount: number; // Positive for earnings/refunds, negative for withdrawals/settlements
  type: 'sale' | 'refund' | 'delivery_fee' | 'adjustment' | 'settlement' | 'commission_charge';
  description: string;
  createdAt: string;
  status: 'pending' | 'completed';
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g., "INV-2026-10029"
  orderId: string;
  storeId: string;
  storeName: string;
  customerName: string;
  customerPhone?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  platformCommission: number;
  vendorNet: number;
  qrCodeBase64?: string;
  createdAt: string;
}
