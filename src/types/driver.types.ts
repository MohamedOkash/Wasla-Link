export type DriverStatus = 
  | 'draft' 
  | 'pending_review' 
  | 'needs_documents' 
  | 'approved' 
  | 'rejected' 
  | 'suspended' 
  | 'blocked';

export type DriverTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface DriverDocumentRequest {
  status: DriverStatus;
  requestedDocuments: string[];
  reviewNote: string;
  requestedBy: string;
  requestedAt: string;
  updatedAt: string;
}

export interface Vehicle {
  type: string;
  brand: string;
  model: string;
  plateNumber: string;
  color: string;
  year: string;
  isPrimary: boolean;
  status: 'active' | 'inactive';
}

export interface WorkingZone {
  governorate: string;
  center: string;
  village: string;
}

export interface Availability {
  workingDays: number[]; // 0 = Sunday, etc.
  workingHours: { start: string; end: string };
  breakTime: { start: string; end: string } | null;
  vacationMode: boolean;
  emergencyOffline: boolean;
}

export interface DriverStats {
  acceptanceRate: number;
  completionRate: number;
  averageRating: number;
  complaints: number;
  lateDeliveries: number;
  onlineHours: number;
  completedOrders: number;
}

export interface DriverScore {
  score: number; // 0-100 calculated score
  lastCalculated: string;
}

export interface DriverWallet {
  balance: number;
  pendingBalance: number;
  paidBalance: number;
  updatedAt: string;
}

export interface DriverLedgerEntry {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  timestamp: string;
  orderId?: string;
}

export interface Driver {
  id?: string;
  uid: string;
  name: string;
  phone: string;
  email?: string;
  governorate: string;
  city: string;
  village: string;
  deliveryMethod: string;
  
  // Multi-vehicle management
  vehicles?: Vehicle[];

  // Working zones
  workingZones?: WorkingZone[];
  maxDistance?: number; // In km
  preferredAreas?: string[];

  // Availability Settings
  availabilitySettings?: Availability;

  // Documents
  profilePhotoUrl?: string;
  nationalIdNumber?: string;
  nationalIdImageUrl?: string;
  nationalIdExpiry?: string;
  drivingLicenseUrl?: string;
  licenseExpiry?: string;
  vehicleLicenseUrl?: string;
  vehicleLicenseExpiry?: string;
  vehicleImageUrl?: string;
  insuranceImageUrl?: string;
  insuranceExpiry?: string;

  documentStatus?: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;
  verifiedAt?: string;
  verificationRequest?: DriverDocumentRequest;

  // Verification State
  status: DriverStatus;
  isApproved: boolean;
  isActive: boolean;
  availability: 'online' | 'busy' | 'offline' | 'delivering' | 'available';
  
  // Agreement & Training
  agreementAccepted: boolean;
  trainingCompleted: boolean;

  // Analytics & Tiering
  tier: DriverTier;
  score: number;
  stats?: DriverStats;

  // Timestamps
  createdAt: any;
  updatedAt: any;
}
