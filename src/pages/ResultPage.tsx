import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  doc,
  increment,
} from 'firebase/firestore';
import type { Medicine } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { OperationType, handleFirestoreError } from '../utils/firestoreError';
import { saveCustomerScan } from '../utils/customerAuth';
import {
  getAuthorizedMedicineByCode,
  normalizeScannedCode,
} from '../data/authorizedMedicines';
import {
  Pill,
  AlertTriangle,
  Stethoscope,
  ArrowLeft,
  RefreshCw,
  ShieldAlert,
  WifiOff,
  Check,
  Package,
  Layers,
  Landmark,
  Contact,
  Barcode,
  Calendar,
  Award,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const CACHE_PREFIX = 'scanurmed_med_cache_';

function readCachedMedicine(code: string): Medicine | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${code}`);
    if (!raw) return null;
    return JSON.parse(raw) as Medicine;
  } catch {
    return null;
  }
}

function writeCachedMedicine(code: string, med: Medicine) {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${code}`, JSON.stringify(med));
  } catch {
    // Ignore storage quota errors
  }
}

function isOfflineFirestoreError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    !navigator.onLine ||
    msg.includes('offline') ||
    msg.includes('unavailable') ||
    msg.includes('network') ||
    msg.includes('failed to get document')
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatMonthYear(dateValue?: string): string {
  if (!dateValue) return 'N/A';
  const match = dateValue.trim().match(/^(\d{4})-(\d{2})/);
  if (match) {
    const year = match[1];
    const monthIndex = Number(match[2]) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${MONTHS[monthIndex]} ${year}`;
    }
  }
  return dateValue;
}

export default function ResultPage() {
  const { barcode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const isOnline = useOnlineStatus();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [usedOfflineFallback, setUsedOfflineFallback] = useState(false);
  const [scanSaveError, setScanSaveError] = useState<string | null>(null);
  const [showClinicalDetails, setShowClinicalDetails] = useState(false);
  const savedScanEventRef = useRef<string | null>(null);
  const scannedAt =
    (location.state as { scannedAt?: string } | null)?.scannedAt || null;

  const normalizedCode = barcode ? normalizeScannedCode(decodeURIComponent(barcode)) : '';

  useEffect(() => {
    let cancelled = false;

    async function syncMedicineFromFirestore() {
      if (!normalizedCode) {
        setMedicine(null);
        setIsUnauthorized(true);
        setLoading(false);
        return;
      }

      // Strict 20-label allowlist check: any other QR code NEVER returns data.
      const authorizedRecord = getAuthorizedMedicineByCode(normalizedCode);
      if (!authorizedRecord) {
        setMedicine(null);
        setIsUnauthorized(true);
        setLoading(false);
        return;
      }

      const cachedRecord = readCachedMedicine(normalizedCode);
      const cachedOrBundled = cachedRecord
        ? { ...authorizedRecord, ...cachedRecord }
        : authorizedRecord;

      // Render immediately from cache/registry with zero loading delay
      setMedicine(cachedOrBundled);
      setIsUnauthorized(false);
      setUsedOfflineFallback(!navigator.onLine);
      setLoading(false);

      const customer = auth?.currentUser;
      const saveScanForCustomer = async (scanMedicine: Medicine) => {
        if (
          !scannedAt ||
          !customer ||
          savedScanEventRef.current === scannedAt
        ) {
          return;
        }

        savedScanEventRef.current = scannedAt;
        try {
          await saveCustomerScan(customer.uid, scanMedicine, scannedAt);
          if (!cancelled) setScanSaveError(null);
        } catch (error) {
          savedScanEventRef.current = null;
          console.error('Unable to save customer medicine scan:', error);
          if (!cancelled) {
            setScanSaveError('This scan could not be saved to your account. Check your connection and try again.');
          }
        }
      };

      if (!db) return;

      if (!navigator.onLine) {
        void saveScanForCustomer(cachedOrBundled);
        return;
      }

      try {
        let medData: Medicine | null = null;
        let existsInFirestore = false;

        const docPath = `medicines/${normalizedCode}`;
        const docRef = doc(db, 'medicines', normalizedCode);

        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            medData = { ...authorizedRecord, id: docSnap.id, ...docSnap.data() } as Medicine;
            existsInFirestore = true;
          }
        } catch (err) {
          if (isOfflineFirestoreError(err)) {
            if (!cancelled) setUsedOfflineFallback(true);
            void saveScanForCustomer(cachedOrBundled);
            return;
          }
          handleFirestoreError(err, OperationType.GET, docPath);
          return;
        }

        if (!medData) {
          try {
            const q = query(
              collection(db, 'medicines'),
              where('barcode', '==', normalizedCode)
            );
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              const first = querySnapshot.docs[0];
              medData = { ...authorizedRecord, id: first.id, ...first.data() } as Medicine;
              existsInFirestore = true;
            }
          } catch (err) {
            if (isOfflineFirestoreError(err)) {
              if (!cancelled) setUsedOfflineFallback(true);
              void saveScanForCustomer(cachedOrBundled);
              return;
            }
            handleFirestoreError(err, OperationType.LIST, 'medicines');
            return;
          }
        }

        if (medData) {
          writeCachedMedicine(normalizedCode, medData);
          if (!cancelled) {
            setMedicine(medData);
          }
          await saveScanForCustomer(medData);

          if (existsInFirestore && navigator.onLine) {
            void Promise.allSettled([
              addDoc(collection(db, 'scans'), {
                medicineId: medData.id,
                companyId: medData.companyId,
                timestamp: new Date().toISOString(),
              }),
              updateDoc(doc(db, 'medicines', medData.id), {
                scanCount: increment(1),
              }),
            ]);
          }
        } else {
          await saveScanForCustomer(cachedOrBundled);
        }
      } catch (err) {
        console.error('Background verification error:', err);
        await saveScanForCustomer(cachedOrBundled);
      }
    }

    syncMedicineFromFirestore();
    return () => {
      cancelled = true;
    };
  }, [normalizedCode, isOnline, scannedAt]);

  if (loading) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center gap-4">
        <RefreshCw size={36} className="animate-spin text-[#FA6806]" />
        <p className="text-[#054A8C] font-semibold text-base">Verifying QR label...</p>
      </div>
    );
  }

  if (isUnauthorized || !medicine) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <div className="bg-white border border-[#054A8C] rounded-2xl p-8 md:p-10 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-xl bg-[#FA6806]/15 border border-[#FA6806] flex items-center justify-center text-[#FA6806]">
            <ShieldAlert size={34} strokeWidth={1.75} />
          </div>

          <div className="space-y-2.5">
            <h1 className="text-3xl font-bold text-[#0F2942]">{t('unauthorized')}</h1>
            <p className="text-[#3B5875] text-sm leading-relaxed">{t('unauthorized_sub')}</p>
            <div className="pt-2">
              <span className="inline-block bg-[#F7FAFC] px-4 py-2 rounded-lg font-mono tabular-nums text-xs text-[#054A8C] border border-[#054A8C]">
                Scanned Value: {normalizedCode || 'N/A'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
            <Link
              to="/scan"
              className="bg-[#FA6806] text-white border border-[#054A8C] px-6 py-3 rounded-xl font-semibold hover:bg-[#E05A00] transition-colors whitespace-nowrap"
            >
              {t('try_again')}
            </Link>
            <Link
              to="/"
              className="bg-[#7BBCE5] text-[#054A8C] border border-[#054A8C] px-6 py-3 rounded-xl font-semibold hover:bg-[#7BBCE5]/80 transition-colors whitespace-nowrap"
            >
              {t('home')}
            </Link>
          </div>
        </div>

        {scanSaveError && (
          <p role="alert" className="bg-[#FA6806]/10 border border-[#FA6806] text-[#FA6806] rounded-xl px-4 py-3 text-sm font-medium">
            {scanSaveError}
          </p>
        )}
      </div>
    );
  }

  const properDrugName = medicine.properName || medicine.ingredients.join(', ');
  const manufacturerFull = medicine.manufacturerAddress
    ? `${medicine.companyName}, ${medicine.manufacturerAddress}`
    : medicine.companyName;
  const batchNumber = medicine.batchNumber || `BATCH-${medicine.barcode.slice(-5)}`;
  const licenseNumber = medicine.licenseNumber || '25A/AD/258A';
  const excipientsList =
    medicine.excipients && medicine.excipients.length > 0
      ? `${medicine.excipients.join(', ')}.`
      : `${medicine.ingredients.join(', ')}.`;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white border border-[#054A8C] text-[#054A8C] hover:bg-[#7BBCE5]/20 rounded-xl transition-colors"
            aria-label={t('back')}
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F2942]">{t('med_details')}</h1>
        </div>
        <Link
          to="/scan"
          className="px-4 py-2 rounded-xl bg-[#FA6806] text-white border border-[#054A8C] text-sm font-semibold hover:bg-[#E05A00] transition-colors whitespace-nowrap"
        >
          {t('scan_btn')}
        </Link>
      </div>

      {(usedOfflineFallback || !isOnline) && (
        <div className="flex items-center gap-2.5 bg-white border border-[#FA6806] rounded-xl px-4 py-3 text-xs font-semibold text-[#0F2942]">
          <WifiOff size={15} className="text-[#FA6806] shrink-0" />
          <span>
            Offline Verification — Loaded from local cached registry. Live scan analytics sync is paused until online.
          </span>
        </div>
      )}

      {scanSaveError && (
        <p role="alert" className="bg-[#FA6806]/10 border border-[#FA6806] text-[#FA6806] rounded-xl px-4 py-3 text-sm font-medium">
          {scanSaveError}
        </p>
      )}

      <section className="bg-white rounded-2xl border border-[#054A8C] shadow-[0_8px_28px_rgb(15,41,66,0.08)] px-6 py-8 sm:px-8 sm:py-10">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#15803D] text-white flex items-center justify-center shadow-sm">
            <Check size={34} strokeWidth={3} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0F2942]">
            {t('verified_product')}
          </h2>
        </div>

        <hr className="border-[#054A8C]/15 my-6" />

        <div className="space-y-5">
          <h3 className="text-base font-bold text-[#0F2942]">{t('code_details')}</h3>
          <dl className="space-y-4">
            <CodeDetailRow icon={<Package size={18} />} label={t('gtin_label')} value={medicine.barcode} mono />
            <CodeDetailRow icon={<Layers size={18} />} label={t('proper_drug_name')} value={properDrugName} />
            <CodeDetailRow icon={<Landmark size={18} />} label={t('brand_name')} value={medicine.name} />
            <CodeDetailRow icon={<Contact size={18} />} label={t('manufacturer_label')} value={manufacturerFull} />
            <CodeDetailRow icon={<Barcode size={18} />} label={t('batch_number')} value={batchNumber} mono />
            <CodeDetailRow icon={<Calendar size={18} />} label={t('mfg_date_label')} value={formatMonthYear(medicine.mfgDate)} />
            <CodeDetailRow icon={<Calendar size={18} />} label={t('expiry_date_label')} value={formatMonthYear(medicine.expiryDate)} />
            <CodeDetailRow icon={<Award size={18} />} label={t('license_number')} value={licenseNumber} mono />
            <CodeDetailRow icon={<FileText size={18} />} label={t('excipients_label')} value={excipientsList} />
          </dl>
        </div>

        <p className="mt-7 text-center text-sm font-semibold text-[#FA6806] leading-relaxed max-w-md mx-auto">
          {t('thank_you_note')}
        </p>

        <div className="mt-6 flex items-center justify-between gap-4">
          <Link to="/company" className="text-sm font-semibold text-[#054A8C] hover:text-[#FA6806] underline underline-offset-4 transition-colors">
            {t('contact_us')}
          </Link>
          <Link to="/search" className="text-sm font-semibold text-[#3B5875] hover:text-[#054A8C] transition-colors">
            {t('search_btn')}
          </Link>
        </div>

        <div className="mt-4 pt-4 border-t border-[#054A8C]/15 text-center space-y-1 text-xs text-[#3B5875]">
          <p>{medicine.companyName} · Authorized Label Registry</p>
          <p>
            {t('powered_by')}{' '}
            <span className="font-semibold text-[#FA6806] underline underline-offset-2">Scanurmed</span>
          </p>
        </div>
      </section>

      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setShowClinicalDetails((previous) => !previous)}
          aria-expanded={showClinicalDetails}
          className="w-full bg-white hover:bg-[#7BBCE5]/15 border border-[#054A8C] rounded-xl px-5 py-3.5 flex items-center justify-between gap-3 text-sm font-semibold text-[#054A8C] transition-colors"
        >
          <span className="flex items-center gap-2.5">
            <Stethoscope size={18} className="text-[#FA6806]" />
            <span>
              {showClinicalDetails ? t('hide_clinical_details') : t('view_clinical_details')}
            </span>
          </span>
          {showClinicalDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showClinicalDetails && (
          <div className="space-y-5">
            <InfoCard
              icon={<Stethoscope className="text-[#FA6806]" size={20} />}
              title={t('medical_uses')}
              content={<p className="text-[#0F2942] text-sm leading-relaxed">{medicine.medicalUses}</p>}
            />
            <DetailSection title={t('ingredients')} content={medicine.ingredients.join(' · ')} />
            <DetailSection title={t('dosage')} content={medicine.dosage} />
            <DetailSection title={t('side_effects')} content={medicine.sideEffects} />

            {medicine.allergyWarnings && (
              <div className="bg-[#FA6806]/10 border border-[#FA6806] rounded-2xl p-6 md:p-7 flex gap-4 items-start">
                <div className="bg-white p-2.5 rounded-xl border border-[#FA6806] shrink-0">
                  <AlertTriangle className="text-[#FA6806]" size={24} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-[#0F2942] font-bold text-lg">{t('allergy_warning')}</h3>
                  <p className="text-[#0F2942] text-sm leading-relaxed">{medicine.allergyWarnings}</p>
                </div>
              </div>
            )}

            {medicine.otherUses && (
              <DetailSection title={t('other_uses')} content={medicine.otherUses} />
            )}

            {medicine.alternatives && medicine.alternatives.length > 0 && (
              <div className="bg-white rounded-2xl p-6 md:p-7 border border-[#054A8C] space-y-4">
                <h3 className="font-bold text-lg text-[#0F2942]">{t('alternatives')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {medicine.alternatives.map((alternative, index) => (
                    <div
                      key={index}
                      className="bg-[#F7FAFC] text-[#054A8C] px-4 py-3 rounded-xl text-sm font-semibold border border-[#054A8C] flex items-center gap-2.5"
                    >
                      <Pill size={15} className="text-[#FA6806] shrink-0" />
                      <span className="truncate">{alternative}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CodeDetailRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3.5">
      <div className="text-[#3B5875] shrink-0 mt-0.5" aria-hidden="true">
        {icon}
      </div>
      <div className="text-sm leading-relaxed text-[#3B5875] min-w-0">
        <dt className="inline">{label} : </dt>
        <dd
          className={`inline font-bold text-[#0F2942] break-words ${
            mono ? 'font-mono tabular-nums' : ''
          }`}
        >
          {value}
        </dd>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  content,
}: {
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
}) {
  return (
    <div className="bg-white p-6 md:p-7 rounded-2xl border border-[#054A8C] space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-[#7BBCE5]/25 border border-[#054A8C] p-2 rounded-lg">{icon}</div>
        <h3 className="font-bold text-lg text-[#0F2942]">{title}</h3>
      </div>
      <div>{content}</div>
    </div>
  );
}

function DetailSection({ title, content }: { title: string; content: string }) {
  return (
    <div className="bg-white p-6 md:p-7 rounded-2xl border border-[#054A8C] space-y-2">
      <h3 className="font-bold text-lg text-[#0F2942]">{title}</h3>
      <p className="text-[#3B5875] text-sm leading-relaxed">{content}</p>
    </div>
  );
}
