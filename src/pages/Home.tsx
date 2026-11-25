import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from 'firebase/auth';
import { AppUser } from '../types';
import {
  Scan,
  Search,
  DatabaseZap,
  CheckCircle2,
  Loader2,
  ChevronRight,
  AlertCircle,
  FileText
} from 'lucide-react';
import { seedDatabase } from '../utils/seedData';
import { useLanguage } from '../context/LanguageContext';
import { AUTHORIZED_MEDICINES } from '../data/authorizedMedicines';
import { isApprovedCompanyEmail } from '../data/approvedCompanies';
import { PWAInstallButton } from '../components/PWAInstallButton';

export default function Home({ user }: { user: AppUser | User | null }) {
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const { t } = useLanguage();

  const handleSeed = async () => {
    setSeeding(true);
    setSeedError(null);
    try {
      await seedDatabase();
      setSeeded(true);
      setTimeout(() => setSeeded(false), 3500);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unable to sync database.';
      setSeedError(msg);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-16">
      {/* Hero Split */}
      <section className="bg-white border border-[#054A8C] rounded-2xl p-8 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
            <div className="space-y-5">
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0F2942] leading-[1.1]"
                style={{ textWrap: 'balance' }}
              >
                {t('verify_title')}
              </h1>
              <p className="text-[#3B5875] text-base md:text-lg max-w-2xl leading-relaxed">
                {t('hero_sub')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/scan"
                className="bg-[#FA6806] text-white border border-[#054A8C] px-7 py-3.5 rounded-xl text-base font-semibold hover:bg-[#E05A00] transition-colors inline-flex items-center gap-2.5 whitespace-nowrap shrink-0"
              >
                <Scan size={20} />
                <span>{t('scan_btn')}</span>
                <ChevronRight size={18} />
              </Link>
              <Link
                to="/search"
                className="bg-[#7BBCE5] text-[#054A8C] border border-[#054A8C] px-7 py-3.5 rounded-xl text-base font-semibold hover:bg-[#7BBCE5]/80 transition-colors inline-flex items-center gap-2.5 whitespace-nowrap shrink-0"
              >
                <Search size={20} />
                <span>{t('search_btn')}</span>
              </Link>
              <PWAInstallButton />
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#F7FAFC] border border-[#054A8C] rounded-xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#054A8C]/25 pb-3">
                <span className="text-sm font-bold text-[#054A8C]">Authorized Label Sample</span>
                <span className="text-xs font-mono tabular-nums text-[#3B5875]">20 / 20 Active</span>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {AUTHORIZED_MEDICINES.slice(0, 6).map((med) => (
                  <Link
                    key={med.barcode}
                    to={`/result/${med.barcode}`}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-white border border-[#054A8C]/40 hover:border-[#FA6806] rounded-lg transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0F2942] group-hover:text-[#FA6806] truncate">
                        {med.name}
                      </p>
                      <p className="text-xs text-[#3B5875] truncate">{med.companyName}</p>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-[#054A8C] shrink-0">
                      {med.barcode}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[#054A8C]/25 flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <a
                  href="/assets/aistudio/medicine_qr_labels_99682484.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-[#054A8C] hover:text-[#FA6806] inline-flex items-center gap-1.5"
                >
                  <FileText size={14} />
                  <span>Open Label Sheet PDF</span>
                </a>

                {user && isApprovedCompanyEmail(user.email) && (
                  <button
                    type="button"
                    onClick={handleSeed}
                    disabled={seeding}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[#054A8C] bg-white hover:bg-[#7BBCE5]/20 text-[#054A8C] transition-colors whitespace-nowrap"
                  >
                    {seeding ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : seeded ? (
                      <CheckCircle2 size={14} className="text-[#FA6806]" />
                    ) : (
                      <DatabaseZap size={14} className="text-[#FA6806]" />
                    )}
                    <span>{seeding ? t('seeding') : seeded ? t('seeded') : t('seed_data')}</span>
                  </button>
                )}
              </div>

              {seedError && (
                <div className="flex items-start gap-2 text-xs text-[#FA6806] bg-white border border-[#FA6806] rounded-lg p-2.5">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{seedError}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Verification Workflow */}
      <section className="bg-white border border-[#054A8C] rounded-2xl p-8 md:p-12 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#054A8C]/25 pb-6">
          <h2 className="text-3xl font-bold text-[#0F2942]">{t('how_it_works')}</h2>
          <span className="text-sm text-[#3B5875]">
            Strict 20-label allowlist enforcement across camera, upload, and search
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <Step number="01" title={t('step1_title')} description={t('step1_sub')} />
          <Step number="02" title={t('step2_title')} description={t('step2_sub')} />
          <Step number="03" title={t('step3_title')} description={t('step3_sub')} />
          <Step number="04" title={t('step4_title')} description={t('step4_sub')} />
        </div>
      </section>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2.5">
      <div className="text-2xl font-mono font-bold tabular-nums text-[#FA6806]">{number}</div>
      <h4 className="font-bold text-lg text-[#054A8C]">{title}</h4>
      <p className="text-[#3B5875] text-sm leading-relaxed">{description}</p>
    </div>
  );
}
