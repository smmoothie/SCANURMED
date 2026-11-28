import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from '../firebase';
import { db } from '../firebase';
import {
  getCustomerProfile,
  getCustomerScans,
  CustomerProfile,
  CustomerScan,
} from '../utils/customerAuth';
import {
  User,
  Pill,
  Calendar,
  LogOut,
  Loader2,
  ShieldCheck,
  QrCode,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';

export default function CustomerDashboardPage() {
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [scans, setScans] = useState<CustomerScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  /* Redirect if not authenticated */
  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true, state: { from: '/dashboard' } });
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const [companyProfile, companyApplication] = await Promise.all([
          getDoc(doc(db, 'companies', currentUser.uid)),
          getDoc(doc(db, 'companyApplications', currentUser.uid)),
        ]);
        if (
          companyProfile.exists() &&
          companyProfile.data().status === 'APPROVED' &&
          companyApplication.exists() &&
          companyApplication.data().status === 'APPROVED'
        ) {
          navigate('/company', { replace: true });
          return;
        }
        const [prof, savedScans] = await Promise.all([
          getCustomerProfile(currentUser.uid),
          getCustomerScans(currentUser.uid),
        ]);
        if (cancelled) return;
        setProfile(prof);
        setScans(savedScans);
      } catch (error) {
        console.error('Unable to load customer dashboard:', error);
        if (!cancelled) setLoadError('Unable to load your account information. Check your connection and try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [currentUser, navigate, reloadCount]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut(auth);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Unable to sign out:', error);
      setLogoutError('Unable to sign out. Please try again.');
      setLoggingOut(false);
    }
  }

  if (!currentUser) return null;

  if (loading) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center gap-4">
        <RefreshCw size={36} className="animate-spin text-[#FA6806]" />
        <p className="text-[#054A8C] font-semibold text-base">
          Loading your dashboard…
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div role="alert" className="max-w-lg mx-auto bg-white rounded-2xl border border-[#054A8C] p-8 text-center space-y-4">
        <p className="text-sm text-[#3B5875]">{loadError}</p>
        <button
          type="button"
          onClick={() => setReloadCount((count) => count + 1)}
          className="inline-flex items-center gap-2 bg-[#FA6806] text-white font-semibold px-5 py-2.5 rounded-xl border border-[#054A8C]"
        >
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  const displayName =
    profile?.fullName ?? currentUser.displayName ?? currentUser.email ?? 'Customer';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ── Profile card ── */}
      <div className="bg-white rounded-2xl border border-[#054A8C] p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-16 h-16 rounded-xl bg-[#7BBCE5]/25 border border-[#054A8C] flex items-center justify-center text-[#054A8C] shrink-0">
          <User size={30} />
        </div>

        <div className="flex-1 space-y-1">
          <h1
            className="text-2xl font-bold text-[#0F2942]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {displayName}
          </h1>
          <p className="text-sm text-[#3B5875]">{currentUser.email}</p>
          {profile?.phone && (
            <p className="text-sm text-[#3B5875] flex items-center gap-1.5">
              {profile.phone}
              {profile.phoneVerified && (
                <ShieldCheck size={14} className="text-green-600" />
              )}
            </p>
          )}
          <p className="text-xs text-[#3B5875]">
            Member since{' '}
            {profile?.createdAt
              ? new Date(profile.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : '—'}
          </p>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-2 bg-[#FA6806] text-white font-semibold px-5 py-2.5 rounded-xl border border-[#054A8C] disabled:opacity-60 shrink-0 text-sm"
        >
          {loggingOut ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <LogOut size={16} />
          )}
          Log Out
        </button>
      </div>
      {logoutError && (
        <p role="alert" className="bg-[#FA6806]/10 border border-[#FA6806] text-[#FA6806] rounded-xl px-4 py-3 text-sm font-medium">
          {logoutError}
        </p>
      )}

      {/* ── Saved Medicines ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            className="text-xl font-bold text-[#0F2942] flex items-center gap-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <Pill size={20} className="text-[#FA6806]" />
            Saved Medicines
            <span className="bg-[#FA6806] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {scans.length}
            </span>
          </h2>
          <Link
            to="/scan"
            className="flex items-center gap-1.5 text-sm font-semibold text-[#FA6806]"
          >
            Scan a medicine <ChevronRight size={14} />
          </Link>
        </div>

        {scans.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#054A8C] p-10 text-center space-y-3">
            <QrCode size={40} className="text-[#054A8C]/40 mx-auto" />
            <p className="text-[#3B5875] text-sm">
              No medicines scanned yet. Every medicine you scan will be automatically
              saved here for future reference.
            </p>
            <Link
              to="/scan"
              className="inline-flex items-center gap-2 bg-[#FA6806] text-white font-semibold px-6 py-2.5 rounded-xl border border-[#054A8C] text-sm"
            >
              Scan your first medicine
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {scans.map((scan) => (
              <div key={scan.id}>
                <ScanCard scan={scan} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Saved QR Codes ── */}
      <section className="space-y-4">
        <h2
          className="text-xl font-bold text-[#0F2942] flex items-center gap-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <QrCode size={20} className="text-[#FA6806]" />
          Saved QR Codes
          <span className="bg-[#7BBCE5] text-[#054A8C] text-xs font-bold px-2 py-0.5 rounded-full">
            {scans.filter((scan) => scan.qrCode || scan.barcode).length}
          </span>
        </h2>
        {scans.some((scan) => scan.qrCode || scan.barcode) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scans.filter((scan) => scan.qrCode || scan.barcode).map((scan) => {
              const qrCode = scan.qrCode || scan.barcode;
              return (
                <Link
                  key={scan.id}
                  to={`/result/${encodeURIComponent(qrCode)}`}
                  className="flex items-center gap-3 bg-white rounded-xl border border-[#054A8C] p-4 hover:border-[#FA6806] transition-colors"
                >
                  <QrCode size={20} className="text-[#FA6806] shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[#0F2942] truncate">{scan.medicineName}</span>
                    <span className="block text-xs font-mono text-[#3B5875] truncate">{qrCode}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="bg-white rounded-xl border border-[#054A8C] p-5 text-sm text-[#3B5875]">
            QR codes from your scans will be saved here.
          </p>
        )}
      </section>
    </div>
  );
}

function ScanCard({ scan }: { scan: CustomerScan }) {
  const [expanded, setExpanded] = useState(false);

  const scannedDate = new Date(scan.scannedAt);
  const dateStr = scannedDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = scannedDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-white rounded-2xl border border-[#054A8C] overflow-hidden">
      {/* Header row */}
      <button
        className="w-full flex items-start gap-4 p-5 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="w-10 h-10 rounded-xl bg-[#FA6806]/10 border border-[#FA6806] flex items-center justify-center shrink-0">
          <Pill size={18} className="text-[#FA6806]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#0F2942] truncate">{scan.medicineName}</p>
          <p className="text-xs text-[#3B5875]">{scan.companyName}</p>
        </div>
        <div className="text-right shrink-0 space-y-0.5">
          <div className="flex items-center gap-1 text-xs text-[#3B5875] justify-end">
            <Calendar size={12} />
            {dateStr}
          </div>
          <p className="text-xs text-[#3B5875]">{timeStr}</p>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-[#054A8C]/20 px-5 pb-5 pt-4 space-y-3">
          {scan.qrCode && (
            <Detail label="QR / Barcode" value={scan.qrCode} mono />
          )}
          {scan.barcode && scan.barcode !== scan.qrCode && (
            <Detail label="Barcode" value={scan.barcode} mono />
          )}
          {scan.mfgDate && <Detail label="Mfg. Date" value={scan.mfgDate} />}
          {scan.expiryDate && (
            <Detail label="Expiry Date" value={scan.expiryDate} />
          )}
          {scan.medicalUses && (
            <Detail label="Medical Uses" value={scan.medicalUses} />
          )}
          {scan.dosage && <Detail label="Dosage" value={scan.dosage} />}
          {scan.sideEffects && (
            <Detail label="Side Effects" value={scan.sideEffects} />
          )}
          {scan.allergyWarnings && (
            <Detail label="Allergy Warnings" value={scan.allergyWarnings} />
          )}
          {scan.ingredients && scan.ingredients.length > 0 && (
            <Detail label="Ingredients" value={scan.ingredients.join(' · ')} />
          )}
          {scan.alternatives && scan.alternatives.length > 0 && (
            <Detail label="Alternatives" value={scan.alternatives.join(', ')} />
          )}
          {scan.otherUses && (
            <Detail label="Other Uses" value={scan.otherUses} />
          )}
        </div>
      )}
    </div>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-semibold text-[#3B5875] uppercase tracking-wide">
        {label}
      </p>
      <p
        className={`text-sm text-[#0F2942] leading-relaxed ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </p>
    </div>
  );
}
