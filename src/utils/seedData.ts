import { db, auth } from '../firebase';
import { doc, writeBatch, getDocs, collection } from 'firebase/firestore';
import { AUTHORIZED_BARCODES, AUTHORIZED_MEDICINES_DATA } from '../data/authorizedMedicines';
import { isApprovedCompanyEmail } from '../data/approvedCompanies';
import { OperationType, handleFirestoreError } from './firestoreError';

const COMPANIES_META = [
  { company_id: 'scanurmed_pharma_1', company_name: 'Apex Pharma Labs', email: 'regulatory@apexpharma.example' },
  { company_id: 'scanurmed_pharma_2', company_name: 'MedCore Biologics', email: 'qa@medcorebio.example' },
  { company_id: 'scanurmed_pharma_3', company_name: 'Vanguard Therapeutics', email: 'compliance@vanguardrx.example' },
  { company_id: 'scanurmed_pharma_4', company_name: 'NovaCare Pharmaceuticals', email: 'support@novacarerx.example' },
];

export async function seedDatabase(): Promise<{ seededCount: number }> {
  const currentUser = auth.currentUser;
  if (!currentUser || !isApprovedCompanyEmail(currentUser.email)) {
    throw new Error('Only pre-approved company accounts can sync the 20 authorized labels to Firestore.');
  }

  const batch = writeBatch(db);

  // Remove any legacy non-authorized medicines (e.g. QRX/QRY/QRZ) if present and permitted
  try {
    const existingSnap = await getDocs(collection(db, 'medicines'));
    existingSnap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const code = String(data.barcode || docSnap.id);
      if (!AUTHORIZED_BARCODES.has(code) && (data.companyId === currentUser.uid || currentUser.email === 'smrutisikha4679@gmail.com')) {
        batch.delete(docSnap.ref);
      }
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'medicines');
  }

  for (const company of COMPANIES_META) {
    const companyRef = doc(db, 'companies', company.company_id);
    batch.set(companyRef, {
      uid: company.company_id,
      name: company.company_name,
      email: company.email,
      createdAt: new Date().toISOString(),
    });
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
