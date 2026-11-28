/**
 * Customer authentication utilities — Firestore read/write helpers for
 * customer profiles and their saved medicine scans.
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Medicine } from '../types';
import { saveUserProfile } from './userProfile';

export interface CustomerProfile {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  phoneVerified?: boolean;
  createdAt: string;
}

export interface CustomerScan {
  id: string;
  uid: string;
  medicineId: string;
  companyId: string;
  barcode: string;
  medicineName: string;
  companyName?: string;
  ingredients?: string[];
  dosage?: string;
  sideEffects?: string;
  mfgDate?: string;
  expiryDate?: string;
  medicalUses?: string;
  otherUses?: string;
  allergyWarnings?: string;
  alternatives?: string[];
  qrCode?: string;
  scannedAt: string;
}

/** Persist the customer's profile to Firestore. */
export async function saveCustomerProfile(
  uid: string,
  profile: CustomerProfile,
): Promise<void> {
  await saveUserProfile({
    uid,
    email: profile.email,
    displayName: profile.fullName,
  });
  const ref = doc(db, 'customerProfiles', uid);
  await setDoc(ref, profile, { merge: true });
}

/** Load the customer's profile from Firestore. */
export async function getCustomerProfile(
  uid: string,
): Promise<CustomerProfile | null> {
  const ref = doc(db, 'customerProfiles', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as CustomerProfile;
}

/**
 * Automatically save a scanned medicine to the customer's personal history.
 * Called from ResultPage when a logged-in customer views a result.
 */
export async function saveCustomerScan(
  uid: string,
  medicine: Medicine,
  scannedAt = new Date().toISOString(),
): Promise<void> {
  const scansRef = collection(db, 'customerProfiles', uid, 'scans');
  const payload: Omit<CustomerScan, 'id'> = {
    uid,
    barcode: medicine.barcode,
    medicineName: medicine.name,
    medicineId: medicine.id,
    companyId: medicine.companyId,
    scannedAt,
    ...(medicine.companyName ? { companyName: medicine.companyName } : {}),
    ...(medicine.ingredients ? { ingredients: medicine.ingredients } : {}),
    ...(medicine.dosage ? { dosage: medicine.dosage } : {}),
    ...(medicine.sideEffects ? { sideEffects: medicine.sideEffects } : {}),
    ...(medicine.mfgDate ? { mfgDate: medicine.mfgDate } : {}),
    ...(medicine.expiryDate ? { expiryDate: medicine.expiryDate } : {}),
    ...(medicine.medicalUses ? { medicalUses: medicine.medicalUses } : {}),
    ...(medicine.otherUses ? { otherUses: medicine.otherUses } : {}),
    ...(medicine.allergyWarnings ? { allergyWarnings: medicine.allergyWarnings } : {}),
    ...(medicine.alternatives ? { alternatives: medicine.alternatives } : {}),
    ...(medicine.qr_code ? { qrCode: medicine.qr_code } : {}),
  };
  await addDoc(scansRef, payload);
}

/**
 * Retrieve all scans for a customer, newest first.
 */
export async function getCustomerScans(uid: string): Promise<CustomerScan[]> {
  const scansRef = collection(db, 'customerProfiles', uid, 'scans');
  const q = query(scansRef, orderBy('scannedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CustomerScan);
}
