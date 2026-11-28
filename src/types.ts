import type { Timestamp } from 'firebase/firestore';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified?: boolean;
  isAnonymous?: boolean;
}

export interface Company {
  uid: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  licenseNumber: string;
  licenseType: string;
  licenseDetails: string;
  representativeName?: string;
  applicationId: string;
  status: 'APPROVED' | 'REJECTED';
  createdAt: string | Timestamp;
  approvedAt: string | Timestamp;
  approvedByUid: string;
  updatedAt?: string | Timestamp;
}

export interface CompanyMedicineRecord {
  id: string;
  companyId: string;
  companyName: string;
  manufacturerName: string;
  licenseNumber: string;
  licenseType: string;
  licenseDetails: string;
  name: string;
  activeComponent: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  imagePath: string;
  registeredAt: string | Timestamp;
}

export interface MedicineRegistrationHistory {
  id: string;
  companyId: string;
  medicineId: string;
  medicineName: string;
  eventType: 'REGISTERED';
  performedByUid: string;
  createdAt: string | Timestamp;
}

export interface CompanyRegistrationRequest {
  id: string;
  uid: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  licenseNumber: string;
  licenseType: string;
  licenseDetails: string;
  contactPerson: string;
  notes: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string | Timestamp;
  reviewedAt?: string | Timestamp;
  reviewedByUid?: string;
}

export interface Medicine {
  id: string;
  companyId: string;
  companyName: string;
  name: string;
  ingredients: string[];
  dosage: string;
  sideEffects: string;
  barcode: string;
  qr_code?: string;
  mfgDate: string;
  expiryDate: string;
  medicalUses: string;
  otherUses: string;
  allergyWarnings: string;
  alternatives: string[];
  scanCount: number;
  createdAt?: string;
}

export interface ScanLog {
  id: string;
  medicineId: string;
  companyId: string;
  timestamp: string;
}
