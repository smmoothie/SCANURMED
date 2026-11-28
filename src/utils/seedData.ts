import { db, auth } from '../firebase';
import { doc, writeBatch, getDocs, collection } from 'firebase/firestore';
import { AUTHORIZED_BARCODES, AUTHORIZED_MEDICINES_DATA } from '../data/authorizedMedicines';
import { hasAdminClaim } from './adminAccess';
import { OperationType, handleFirestoreError } from './firestoreError';

export async function seedDatabase(): Promise<{ seededCount: number }> {
  const currentUser = auth.currentUser;
  if (!currentUser || !(await hasAdminClaim(currentUser))) {
    throw new Error('Only an administrator can sync the authorized medicine catalog.');
  }

  const batch = writeBatch(db);

  // Remove any legacy non-authorized medicines (e.g. QRX/QRY/QRZ) if present and permitted
  try {
    const existingSnap = await getDocs(collection(db, 'medicines'));
    existingSnap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const code = String(data.barcode || docSnap.id);
      if (!AUTHORIZED_BARCODES.has(code)) {
        batch.delete(docSnap.ref);
      }
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'medicines');
  }

  for (const med of AUTHORIZED_MEDICINES_DATA) {
    const medRef = doc(db, 'medicines', med.qr_code);
    batch.set(medRef, {
      barcode: med.qr_code,
      qr_code: med.qr_code,
      name: med.name,
      companyId: med.companyId,
      companyName: med.companyName,
      ingredients: med.ingredients,
      dosage: med.dosage,
      sideEffects: med.sideEffects,
      mfgDate: med.mfgDate,
      expiryDate: med.expiryDate,
      medicalUses: med.medicalUses,
      otherUses: med.otherUses,
      allergyWarnings: med.allergyWarnings,
      alternatives: med.alternatives,
      scanCount: 0,
      createdAt: new Date().toISOString(),
    });
  }

  try {
    await batch.commit();
    return { seededCount: AUTHORIZED_MEDICINES_DATA.length };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'medicines');
  }
}
