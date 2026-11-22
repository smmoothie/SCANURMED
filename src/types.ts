export interface Company {
  uid: string;
  name: string;
  email: string;
  representativeName?: string;
  createdAt: string;
}

export interface CompanyRegistrationRequest {
  id: string;
  uid: string;
  companyName: string;
  email: string;
  licenseNumber: string;
  contactPerson: string;
  phone: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string;
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
