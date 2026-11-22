import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase';
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
import { Medicine } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { OperationType, handleFirestoreError } from '../utils/firestoreError';
import {
  getAuthorizedMedicineByCode,
  normalizeScannedCode,
} from '../data/authorizedMedicines';
import {
  Pill,
  Calendar,
  AlertTriangle,
  Stethoscope,
  ArrowLeft,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  WifiOff,
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

export default function ResultPage() {
  const { barcode } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isOnline = useOnlineStatus();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [usedOfflineFallback, setUsedOfflineFallback] = useState(false);

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

      const cachedOrBundled = readCachedMedicine(normalizedCode) || authorizedRecord;

      // Render immediately from cache/registry with zero loading delay
      setMedicine(cachedOrBundled);
      setIsUnauthorized(false);
      setUsedOfflineFallback(!navigator.onLine);
      setLoading(false);

      if (!navigator.onLine) {
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
            medData = { id: docSnap.id, ...docSnap.data() } as Medicine;
            existsInFirestore = true;
          }
        } catch (err) {
          if (isOfflineFirestoreError(err)) {
            if (!cancelled) setUsedOfflineFallback(true);
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
              medData = { id: first.id, ...first.data() } as Medicine;
              existsInFirestore = true;
            }
          } catch (err) {
            if (isOfflineFirestoreError(err)) {
              if (!cancelled) setUsedOfflineFallback(true);
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
        }
      } catch (err) {
        console.error('Background verification error:', err);
      }
    }

    syncMedicineFromFirestore();
    return () => {
      cancelled = true;
    };
  }, [normalizedCode, isOnline]);

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
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
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

      {/* Primary Header Card */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#054A8C]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <div className="bg-[#7BBCE5]/25 text-[#054A8C] p-4 rounded-xl border border-[#054A8C] shrink-0">
              <Pill size={32} strokeWidth={1.75} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#054A8C]">
                <ShieldCheck size={15} className="text-[#FA6806]" />
                <span>Authorized QR Label</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{medicine.barcode}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0F2942]">{medicine.name}</h2>
              <p className="text-sm text-[#3B5875] font-medium">{medicine.companyName}</p>
            </div>
          </div>

          <div className="bg-[#F7FAFC] border border-[#054A8C] rounded-xl px-5 py-3.5 shrink-0">
            <div className="text-xs font-semibold text-[#3B5875]">Label Barcode</div>
            <div className="font-mono tabular-nums text-lg font-bold text-[#054A8C]">
              {medicine.barcode}
            </div>
          </div>
        </div>
      </div>

      {/* Key Dates & Primary Use */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoCard
          icon={<Calendar className="text-[#054A8C]" size={20} />}
          title={t('expiry')}
          content={
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between border-b border-[#054A8C]/15 pb-2">
                <span className="text-xs font-semibold text-[#3B5875]">{t('mfg')}</span>
                <span className="font-mono tabular-nums text-sm font-bold text-[#0F2942]">
                  {medicine.mfgDate}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#3B5875]">{t('expiry')}</span>
                <span className="font-mono tabular-nums text-sm font-bold text-[#FA6806]">
                  {medicine.expiryDate}
                </span>
              </div>
            </div>
          }
        />
        <InfoCard
          icon={<Stethoscope className="text-[#FA6806]" size={20} />}
          title={t('medical_uses')}
          content={<p className="text-[#0F2942] text-sm leading-relaxed">{medicine.medicalUses}</p>}
        />
      </div>

      {/* Detailed Clinical Specification */}
      <div className="space-y-6">
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
              {medicine.alternatives.map((alt, i) => (
                <div
                  key={i}
                  className="bg-[#F7FAFC] text-[#054A8C] px-4 py-3 rounded-xl text-sm font-semibold border border-[#054A8C] flex items-center gap-2.5"
                >
                  <Pill size={15} className="text-[#FA6806] shrink-0" />
                  <span className="truncate">{alt}</span>
                </div>
              ))}
            </div>
          </div>
        )}
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
