import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, ArrowLeft, Loader2, Pill, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Medicine } from '../types';
import { AUTHORIZED_BARCODES, AUTHORIZED_MEDICINES } from '../data/authorizedMedicines';
import { OperationType, handleFirestoreError } from '../utils/firestoreError';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [catalog, setCatalog] = useState<Medicine[]>(AUTHORIZED_MEDICINES);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    async function loadAuthorizedCatalog() {
      if (!navigator.onLine) {
        setCatalog(AUTHORIZED_MEDICINES);
        setLoading(false);
        return;
      }

      if (!db) {
        setCatalog(AUTHORIZED_MEDICINES);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const q = query(collection(db, 'medicines'), limit(50));
        const snap = await getDocs(q);

        const byCode = new Map<string, Medicine>();
        for (const item of AUTHORIZED_MEDICINES) {
          byCode.set(item.barcode, item);
        }

        // Only merge Firestore records whose barcode is in the 20 authorized labels
        snap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const code = String(data.barcode || docSnap.id);
          if (AUTHORIZED_BARCODES.has(code)) {
            byCode.set(code, { id: docSnap.id, ...data } as Medicine);
          }
        });

        setCatalog(Array.from(byCode.values()));
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.LIST, 'medicines');
        } catch {
          setCatalog(AUTHORIZED_MEDICINES);
        }
      } finally {
        setLoading(false);
      }
    }

    loadAuthorizedCatalog();
  }, []);

  const results = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (med) =>
        med.name.toLowerCase().includes(q) ||
        med.barcode.toLowerCase().includes(q) ||
        med.companyName.toLowerCase().includes(q) ||
        med.ingredients.some((ing) => ing.toLowerCase().includes(q)) ||
        med.medicalUses.toLowerCase().includes(q)
    );
  }, [searchTerm, catalog]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl bg-white border border-[#054A8C] text-[#054A8C] hover:bg-[#7BBCE5]/20 transition-colors"
          aria-label={t('back')}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-[#0F2942]">{t('search_btn')}</h1>
          <p className="text-sm text-[#3B5875]">{t('search_instruction')}</p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#054A8C]">
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
        </div>
        <input
          type="text"
          placeholder={t('search_placeholder')}
          className="w-full pl-14 pr-5 py-4 bg-white border border-[#054A8C] rounded-xl text-base text-[#0F2942] placeholder:text-[#3B5875]/70 focus:outline-none focus:ring-2 focus:ring-[#FA6806]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between text-xs font-semibold text-[#054A8C]">
        <span>Showing Authorized Labels Only</span>
        <span className="font-mono tabular-nums">{results.length} / 20</span>
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((med) => (
            <button
              type="button"
              key={med.barcode}
              onClick={() => navigate(`/result/${med.barcode}`)}
              className="text-left group bg-white p-5 rounded-xl border border-[#054A8C] hover:border-[#FA6806] transition-colors flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-[#7BBCE5]/25 border border-[#054A8C] flex items-center justify-center text-[#054A8C] group-hover:bg-[#FA6806] group-hover:text-white transition-colors shrink-0">
                <Pill size={22} strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-[#0F2942] truncate">{med.name}</h2>
                <div className="flex items-center gap-2 text-xs text-[#3B5875] mt-0.5">
                  <span className="truncate">{med.companyName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums text-[#054A8C] shrink-0">
                    {med.barcode}
                  </span>
                </div>
              </div>
              <ChevronRight
                className="text-[#054A8C] group-hover:text-[#FA6806] shrink-0 transition-colors"
                size={18}
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-[#054A8C] rounded-2xl space-y-3">
          <div className="w-14 h-14 mx-auto rounded-xl bg-[#7BBCE5]/20 border border-[#054A8C] flex items-center justify-center text-[#054A8C]">
            <Search size={24} />
          </div>
          <p className="text-[#0F2942] font-semibold">
            {t('no_results')} "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
}
