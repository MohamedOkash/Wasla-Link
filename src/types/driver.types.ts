export type DriverStatus = 'draft' | 'pending_review' | 'needs_documents' | 'approved' | 'rejected';

export type DocumentRequirement = 'NOT_REQUIRED' | 'OPTIONAL' | 'REQUIRED';

export interface DriverVerificationPolicy {
  nationalIdNumber: DocumentRequirement;
  nationalIdImage: DocumentRequirement;
  drivingLicense: DocumentRequirement;
  vehicleImage: DocumentRequirement;
  policeRecord: DocumentRequirement;
  profilePhoto: DocumentRequirement;
}

export interface DriverDocumentRequest {
  status: DriverStatus;
  requestedDocuments: string[]; // e.g. ['nationalIdImage', 'drivingLicense']
  reviewNote: string;
  requestedBy: string;
  requestedAt: string;
  updatedAt: string;
}

export interface Driver {
  id?: string;
  uid: string;
  name: string;
  phone: string;
  governorate: string;
  city: string;
  village: string;
  deliveryMethod: string;
  
  // Documents
  profilePhotoUrl?: string;
  nationalIdNumber?: string;
  nationalIdImageUrl?: string;
  drivingLicenseUrl?: string;
  vehicleImageUrl?: string;
  policeRecordUrl?: string;

  // Verification State
  status: DriverStatus;
  verificationRequest?: DriverDocumentRequest;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Extra metrics
  rating?: number;
  totalTrips?: number;
  isOnline?: boolean;
}
