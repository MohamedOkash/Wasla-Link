export interface RouteResponse {
  distanceKm: number;
  durationMins: number;
  polyline: [number, number][];
}

export interface GeocodeResponse {
  formattedAddress: string;
  placeId: string;
  plusCode?: string;
}

export interface AutocompleteSuggestion {
  description: string;
  placeId: string;
  lat: number;
  lng: number;
}

export interface PaymentResult {
  success: boolean;
  paymentStatus: 'pending' | 'pending_verification' | 'paid' | 'failed' | 'payment_failed' | 'refunded' | 'cancelled';
  receiptUrl?: string;
  receiptMetadata?: Record<string, any>;
  transactionId?: string;
  message?: string;
}


export interface GeocoderProvider {
  reverseGeocode(lat: number, lng: number): Promise<GeocodeResponse>;
  getAutocompleteSuggestions(input: string): Promise<AutocompleteSuggestion[]>;
}

export interface RoutingProvider {
  getDirections(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    roadFactor?: number,
    avgSpeedKmh?: number
  ): Promise<RouteResponse>;
}

export interface PaymentProvider {
  initiatePayment(
    orderId: string,
    method: 'cash_on_delivery' | 'vodafone_cash' | 'instapay',
    amount: number,
    metadata?: any
  ): Promise<PaymentResult>;

  verifyPayment(
    paymentId: string,
    orderId: string,
    status: 'pending' | 'pending_verification' | 'paid' | 'failed' | 'payment_failed' | 'refunded' | 'cancelled',
    verifierId?: string
  ): Promise<{ success: boolean }>;

  processRefund(
    paymentId: string,
    orderId: string,
    amount: number,
    reason: string,
    adminId: string
  ): Promise<{ success: boolean; refundId?: string }>;
}
