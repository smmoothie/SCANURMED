import React, { useEffect, useRef, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  deleteObject,
  getBlob,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { AlertCircle, CalendarDays, ImagePlus, Loader2, Pill, RotateCcw, Upload } from 'lucide-react';
import { db, storage } from '../firebase';
import type { CompanyMedicineRecord, MedicineRegistrationHistory } from '../types';

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function CompanyMedicineRegistry({
  companyId,
  companyName,
  licenseNumber,
  licenseType,
  licenseDetails,
  showRegistrationForm = true,
}: {
  companyId: string;
  companyName: string;
  licenseNumber: string;
  licenseType: string;
  licenseDetails: string;
  showRegistrationForm?: boolean;
}) {
  const [records, setRecords] = useState<CompanyMedicineRecord[]>([]);
  const [history, setHistory] = useState<MedicineRegistrationHistory[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [activeComponent, setActiveComponent] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [manufacturingDate, setManufacturingDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  async function loadRecords() {
    setLoadingRecords(true);
    setRecordsError(null);
    try {
      const recordsQuery = query(
        collection(db, 'company_medicines'),
        where('companyId', '==', companyId),
      );
      const snapshot = await getDocs(recordsQuery);
      const savedRecords = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }) as CompanyMedicineRecord)
        .sort((a, b) => timestampMillis(b.registeredAt) - timestampMillis(a.registeredAt));
      const historySnapshot = await getDocs(
        query(
          collection(db, 'medicineRegistrationHistory'),
          where('companyId', '==', companyId),
        ),
      );
      const savedHistory = historySnapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }) as MedicineRegistrationHistory)
        .sort((a, b) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt));
      setRecords(savedRecords);
      setHistory(savedHistory);
    } catch (error) {
      console.error('Unable to load company medicine records:', error);
      setRecordsError('Your medicine records could not be loaded. Check your connection and retry.');
    } finally {
      setLoadingRecords(false);
    }
  }

  useEffect(() => {
    void loadRecords();
  }, [companyId]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  function resetForm() {
    setName('');
    setActiveComponent('');
    setBatchNumber('');
    setManufacturingDate('');
    setExpiryDate('');
    setPhoto(null);
    setFormError(null);
    setSuccessMessage(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFormError(null);
    setSuccessMessage(null);
    if (!selected) {
      setPhoto(null);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
      return;
    }
    if (!ALLOWED_PHOTO_TYPES.includes(selected.type)) {
      setPhoto(null);
      event.target.value = '';
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
      setFormError('Choose a JPEG, PNG, or WebP medicine photograph.');
      return;
    }
    if (selected.size > MAX_PHOTO_SIZE) {
      setPhoto(null);
      event.target.value = '';
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
      setFormError('The medicine photograph must be 5 MB or smaller.');
      return;
    }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(selected);
    setPhotoPreview(URL.createObjectURL(selected));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const cleanName = name.trim();
    const cleanComponent = activeComponent.trim();
    const cleanBatch = batchNumber.trim();
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (!cleanName || !cleanComponent || !cleanBatch || !manufacturingDate || !expiryDate || !photo) {
      setFormError('Complete all fields and choose a medicine photograph.');
      return;
    }
    if (expiryDate <= manufacturingDate) {
      setFormError('Expiry date must be later than the manufacturing date.');
      return;
    }
    if (manufacturingDate > today) {
      setFormError('Manufacturing date cannot be in the future.');
      return;
    }
    if (expiryDate < today) {
      setFormError('An already-expired medicine cannot be registered.');
      return;
    }
    if (!ALLOWED_PHOTO_TYPES.includes(photo.type) || photo.size > MAX_PHOTO_SIZE) {
      setFormError('Choose a JPEG, PNG, or WebP photograph no larger than 5 MB.');
      return;
    }

    setSubmitting(true);
    let uploadedPhotoPath: string | null = null;
    try {
      const medicineRef = doc(collection(db, 'company_medicines'));
      uploadedPhotoPath = `company-medicine-photos/${companyId}/${medicineRef.id}/photo`;
      await uploadBytes(ref(storage, uploadedPhotoPath), photo, {
        contentType: photo.type,
      });

      const record: Omit<CompanyMedicineRecord, 'id'> = {
        companyId,
        companyName,
        manufacturerName: companyName,
        licenseNumber,
        licenseType,
        licenseDetails,
        name: cleanName,
        activeComponent: cleanComponent,
        batchNumber: cleanBatch,
        manufacturingDate,
        expiryDate,
        imagePath: uploadedPhotoPath,
        registeredAt: Timestamp.now(),
      };
      const historyRef = doc(collection(db, 'medicineRegistrationHistory'));
      const historyEntry: MedicineRegistrationHistory = {
        id: historyRef.id,
        companyId,
        medicineId: medicineRef.id,
        medicineName: cleanName,
        eventType: 'REGISTERED',
        performedByUid: companyId,
        createdAt: Timestamp.now(),
      };
      const batch = writeBatch(db);
      batch.set(medicineRef, { ...record, registeredAt: serverTimestamp() });
      batch.set(historyRef, { ...historyEntry, createdAt: serverTimestamp() });
      await batch.commit();
      setRecords((current) =>
        [{ id: medicineRef.id, ...record }, ...current].sort(
          (a, b) => timestampMillis(b.registeredAt) - timestampMillis(a.registeredAt),
        ),
      );
      setHistory((current) =>
        [historyEntry, ...current].sort(
          (a, b) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt),
        ),
      );
      resetForm();
      setSuccessMessage('Medicine registered successfully.');
    } catch (error) {
      console.error('Unable to register company medicine:', error);
      if (uploadedPhotoPath) {
        try {
          await deleteObject(ref(storage, uploadedPhotoPath));
        } catch (cleanupError) {
          console.error('Unable to remove the unreferenced medicine photograph:', cleanupError);
        }
      }
      setFormError(error instanceof Error ? error.message : 'Medicine registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {showRegistrationForm && (
        <section className="bg-white border border-[#054A8C] rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex items-start gap-3 border-b border-[#054A8C]/20 pb-5">
          <div className="w-11 h-11 rounded-xl bg-[#7BBCE5]/25 border border-[#054A8C] flex items-center justify-center text-[#054A8C] shrink-0">
            <Pill size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#0F2942]">Register New Medicine</h2>
            <p className="text-sm text-[#3B5875] mt-1">
              Register a medicine batch for {companyName}. All information and the photograph are stored with your company account.
            </p>
          </div>
        </div>

        {formError && (
          <p role="alert" className="flex items-start gap-2 rounded-xl border border-[#FA6806] bg-[#FA6806]/10 px-4 py-3 text-sm text-[#0F2942]">
            <AlertCircle size={17} className="mt-0.5 shrink-0 text-[#FA6806]" />
            <span>{formError}</span>
          </p>
        )}
        {successMessage && (
          <p role="status" className="rounded-xl border border-[#16734B] bg-[#E8F3ED] px-4 py-3 text-sm font-semibold text-[#16734B]">
            {successMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <MedicineField label="Medicine Name">
              <input required maxLength={200} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Paracetamol Tablets" className={inputClassName} />
            </MedicineField>
            <MedicineField label="Active / Allergic Component">
              <input required maxLength={500} value={activeComponent} onChange={(event) => setActiveComponent(event.target.value)} placeholder="Active ingredient and known allergen information" className={inputClassName} />
            </MedicineField>
            <MedicineField label="Batch Number">
              <input required maxLength={100} value={batchNumber} onChange={(event) => setBatchNumber(event.target.value)} placeholder="Enter the batch number" className={inputClassName} />
            </MedicineField>
            <MedicineField label="Manufacturing Date">
              <input required type="date" max={expiryDate || undefined} value={manufacturingDate} onChange={(event) => setManufacturingDate(event.target.value)} className={inputClassName} />
            </MedicineField>
            <MedicineField label="Expiry Date">
              <input required type="date" min={manufacturingDate || undefined} value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} className={inputClassName} />
            </MedicineField>
            <MedicineField label="Medicine Photograph">
              <input
                ref={photoInputRef}
                required
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="block w-full text-sm text-[#3B5875] file:mr-3 file:rounded-lg file:border file:border-[#054A8C] file:bg-[#7BBCE5]/30 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#054A8C] hover:file:bg-[#7BBCE5]/50"
              />
              <p className="mt-1 text-xs text-[#3B5875]">JPEG, PNG, or WebP; maximum 5 MB.</p>
            </MedicineField>
          </div>

          {photoPreview && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-[#054A8C]/30 bg-[#F7FAFC] p-4">
              <img src={photoPreview} alt="Medicine upload preview" className="h-36 w-36 rounded-lg border border-[#054A8C]/30 bg-white object-contain" />
              <div className="text-sm text-[#3B5875]">
                <p className="font-semibold text-[#0F2942]">{photo?.name}</p>
                <p>{photo ? `${(photo.size / 1024 / 1024).toFixed(2)} MB` : ''}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <button type="button" onClick={resetForm} disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#054A8C] bg-white px-5 py-3 text-sm font-semibold text-[#054A8C] hover:bg-[#7BBCE5]/20 disabled:opacity-50">
              <RotateCcw size={16} /> Reset
            </button>
            <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#054A8C] bg-[#FA6806] px-6 py-3 text-sm font-semibold text-white hover:bg-[#E05A00] disabled:opacity-50">
              {submitting ? <Loader2 size={17} className="animate-spin" /> : <Upload size={17} />}
              {submitting ? 'Saving medicine…' : 'Register Medicine'}
            </button>
          </div>
        </form>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold text-[#0F2942]">Registered Medicines</h2>
            <p className="text-sm text-[#3B5875] mt-1">Persistent records for this company account.</p>
          </div>
          <span className="w-fit rounded-full bg-[#7BBCE5]/30 px-3 py-1 text-xs font-bold text-[#054A8C]">
            {records.length} {records.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {recordsError && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#FA6806] bg-[#FA6806]/10 px-4 py-3 text-sm text-[#0F2942]">
            <span>{recordsError}</span>
            <button type="button" onClick={() => void loadRecords()} className="font-semibold text-[#054A8C] underline">Retry</button>
          </div>
        )}

        {loadingRecords ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-[#054A8C] bg-white p-10 text-sm font-semibold text-[#054A8C]">
            <Loader2 size={20} className="animate-spin text-[#FA6806]" /> Loading registered medicines…
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-2xl border border-[#054A8C] bg-white p-10 text-center text-sm text-[#3B5875]">
            No medicines registered yet. Your registration history will appear here.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {records.map((record) => (
              <article key={record.id} className="overflow-hidden rounded-2xl border border-[#054A8C] bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-[10rem_1fr]">
                  <CompanyMedicineImage imagePath={record.imagePath} medicineName={record.name} />
                  <div className="space-y-4 p-5">
                    <div className="flex items-start gap-2">
                      <Pill size={18} className="mt-1 shrink-0 text-[#FA6806]" />
                      <div className="min-w-0">
                        <h3 className="break-words text-lg font-bold text-[#0F2942]">{record.name}</h3>
                        <p className="break-all font-mono text-xs text-[#3B5875]">Batch {record.batchNumber}</p>
                      </div>
                    </div>
                    <Detail label="Manufacturer" value={record.manufacturerName} />
                    <Detail
                      label="Company License"
                      value={`${record.licenseType} · ${record.licenseNumber}`}
                    />
                    <Detail label="License Details" value={record.licenseDetails} />
                    <Detail label="Active / Allergic Component" value={record.activeComponent} />
                    <div className="grid grid-cols-2 gap-3">
                      <Detail label="Manufactured" value={record.manufacturingDate} />
                      <Detail label="Expires" value={record.expiryDate} />
                    </div>
                    <div className="flex items-center gap-2 border-t border-[#054A8C]/15 pt-3 text-xs text-[#3B5875]">
                      <CalendarDays size={14} className="text-[#054A8C]" />
                      <span>Registered {formatTimestamp(record.registeredAt)}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F2942]">Medicine Registration History</h2>
          <p className="text-sm text-[#3B5875] mt-1">Immutable record of medicine registrations for this company.</p>
        </div>
        {loadingRecords ? (
          <div className="rounded-2xl border border-[#054A8C] bg-white p-6 text-center text-sm text-[#3B5875]">
            Loading registration history…
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-2xl border border-[#054A8C] bg-white p-6 text-center text-sm text-[#3B5875]">
            No registration events yet.
          </div>
        ) : (
          <ol className="space-y-3">
            {history.map((entry) => (
              <li key={entry.id} className="flex flex-col gap-1 rounded-xl border border-[#054A8C]/30 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-semibold text-sm text-[#0F2942]">
                  {entry.medicineName} registered
                </span>
                <time className="text-xs text-[#3B5875]">
                  {formatTimestamp(entry.createdAt)}
                </time>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function timestampMillis(value: string | Timestamp): number {
  return typeof value === 'string' ? new Date(value).getTime() : value.toMillis();
}

function formatTimestamp(value: string | Timestamp): string {
  const date = typeof value === 'string' ? new Date(value) : value.toDate();
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString('en-IN');
}

function CompanyMedicineImage({
  imagePath,
  medicineName,
}: {
  imagePath: string;
  medicineName: string;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    setImageUrl(null);
    setImageError(false);
    getBlob(ref(storage, imagePath))
      .then((imageBlob) => {
        const createdUrl = URL.createObjectURL(imageBlob);
        if (cancelled) {
          URL.revokeObjectURL(createdUrl);
          return;
        }
        objectUrl = createdUrl;
        setImageUrl(createdUrl);
      })
      .catch((error: unknown) => {
        console.error('Unable to load company medicine photograph:', error);
        if (!cancelled) setImageError(true);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imagePath]);

  return imageUrl ? (
    <img src={imageUrl} alt={`${medicineName} photograph`} className="h-52 w-full bg-[#F7FAFC] object-contain sm:h-full" />
  ) : (
    <div className="flex min-h-44 flex-col items-center justify-center gap-2 bg-[#F7FAFC] p-4 text-center text-xs text-[#3B5875]">
      {imageError ? <AlertCircle size={24} className="text-[#FA6806]" /> : <ImagePlus size={24} className="text-[#054A8C]" />}
      <span>{imageError ? 'Photograph unavailable' : 'Loading photograph…'}</span>
    </div>
  );
}

function MedicineField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5 text-sm font-semibold text-[#0F2942]">
      <span>{label} <span className="text-[#FA6806]">*</span></span>
      {children}
    </label>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#3B5875]">{label}</p>
      <p className="break-words text-sm text-[#0F2942]">{value}</p>
    </div>
  );
}

const inputClassName =
  'w-full rounded-xl border border-[#054A8C] bg-[#F7FAFC] px-4 py-3 text-sm font-normal text-[#0F2942] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FA6806]';
