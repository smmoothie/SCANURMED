import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  FileText,
  BadgeCheck,
  BookOpenCheck,
  HeartPulse,
  Cpu,
  ArrowUpRight,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { seedDatabase } from '../utils/seedData';
import { useLanguage } from '../context/LanguageContext';
import { AUTHORIZED_MEDICINES } from '../data/authorizedMedicines';
import { isApprovedCompanyEmail } from '../data/approvedCompanies';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { ReachOutSection } from '../components/ReachOutSection';

const WHY_US_FEATURES = [
  {
    icon: BadgeCheck,
    number: '01',
    title: 'Authenticity at Your Fingertips',
    description:
      'Verify medicine information through QR-based identification and authorised database checks.',
    accent: 'border-l-[#16734B]',
    iconStyle: 'bg-[#E8F3ED] text-[#16734B]',
  },
  {
    icon: BookOpenCheck,
    number: '02',
    title: 'Transparency You Can Trust',
    description:
      'Access clear and structured medicine information without navigating complicated pharmaceutical terminology.',
    accent: 'border-l-[#1461A0]',
    iconStyle: 'bg-[#EAF3FA] text-[#1461A0]',
  },
  {
    icon: HeartPulse,
    number: '03',
    title: 'Safety Through Awareness',
    description:
      'Help consumers make informed decisions with medicine details, expiry information and relevant safety alerts where available.',
    accent: 'border-l-[#C65A1A]',
    iconStyle: 'bg-[#FFF0E6] text-[#C65A1A]',
  },
  {
    icon: Cpu,
    number: '04',
    title: 'Technology with a Purpose',
    description:
      'Smart scanning, secure data handling and accessible digital experiences make medicine verification easier for everyone.',
    accent: 'border-l-[#367A82]',
    iconStyle: 'bg-[#E9F4F3] text-[#367A82]',
  },
] as const;

export default function Home({ user }: { user: AppUser | User | null }) {
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const { t } = useLanguage();
  const shouldReduceMotion = useReducedMotion();
  const location = useLocation();

  useEffect(() => {
    if (location.hash !== '#why-scanurmed') return;

    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById('why-scanurmed')
        ?.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, shouldReduceMotion]);

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

      <section
        id="why-scanurmed"
        aria-labelledby="why-scanurmed-title"
        className="scroll-mt-36 overflow-hidden rounded-2xl border border-[#054A8C]/30 bg-white p-6 shadow-sm sm:p-8 md:scroll-mt-24 lg:p-10"
      >
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
          <motion.div
            className="space-y-6 lg:col-span-4"
            initial={shouldReduceMotion ? false : { opacity: 0, x: -18 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[#16734B]/20 bg-[#E8F3ED] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#16734B]">
              <BadgeCheck size={14} />
              Why SCANURMED
            </div>
            <div className="space-y-4">
              <h2
                id="why-scanurmed-title"
                className="text-3xl font-bold leading-tight text-[#0F2942] sm:text-4xl"
                style={{ textWrap: 'balance' }}
              >
                Why Choose SCANURMED?
              </h2>
              <p className="text-lg font-semibold leading-relaxed text-[#1461A0]">
                Because your health deserves more than assumptions. It deserves verification.
              </p>
              <p className="text-sm leading-7 text-[#3B5875] sm:text-base">
                SCANURMED bridges the gap between pharmaceutical information and consumer trust,
                making medicine verification simpler, smarter and more accessible.
              </p>
            </div>
            <Link
              to="/scan"
              className="inline-flex items-center gap-2 rounded-xl border border-[#054A8C] bg-[#FA6806] px-5 py-3 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#E05A00] hover:shadow-lg"
            >
              <Scan size={17} />
              Scan a medicine
              <ChevronRight size={16} />
            </Link>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
            {WHY_US_FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.article
                  key={feature.number}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
                  whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  whileHover={shouldReduceMotion ? undefined : { y: -5 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{
                    duration: 0.45,
                    delay: shouldReduceMotion ? 0 : index * 0.07,
                    ease: 'easeOut',
                  }}
                  className={`group rounded-xl border border-[#054A8C]/15 border-l-4 ${feature.accent} bg-[#FBFDFE] p-5 shadow-[0_5px_18px_rgba(15,41,66,0.04)] transition-shadow duration-300 hover:shadow-[0_14px_30px_rgba(15,41,66,0.11)] sm:p-6`}
                >
                  <div className="mb-5 flex items-center justify-between">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${feature.iconStyle} transition-transform duration-300 group-hover:scale-105`}
                    >
                      <Icon size={21} strokeWidth={1.8} />
                    </span>
                    <span className="font-mono text-xs font-bold tracking-widest text-[#3B5875]/55">
                      {feature.number}
                    </span>
                  </div>
                  <h3 className="mb-2 text-base font-bold leading-snug text-[#0F2942] sm:text-lg">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-6 text-[#3B5875]">{feature.description}</p>
                </motion.article>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="mt-8 flex flex-col gap-5 rounded-xl bg-[#0F2942] px-6 py-6 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8"
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A9D9C1]">
              SCANURMED
            </p>
            <p className="text-xl font-bold sm:text-2xl">
              One Scan. More Clarity. Greater Confidence.
            </p>
          </div>
          <Link
            to="/search"
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-white/40 bg-white px-5 py-3 text-sm font-bold text-[#054A8C] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#EAF3FA] hover:shadow-lg sm:self-auto"
          >
            Explore SCANURMED
            <ArrowUpRight size={17} />
          </Link>
        </motion.div>
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

      <ReachOutSection />
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
