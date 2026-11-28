import React, { useState, useEffect } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signOut,
  User,
} from 'firebase/auth';
import { auth, db, getFirebaseAuth, isFirebaseConfigured } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import {
  AppUser,
  Company,
  CompanyRegistrationRequest,
  Medicine,
  ScanLog,
} from '../types';
import {
  clearLocalAuthUser,
  getLocalMedicines,
  saveLocalMedicines,
  getLocalScanLogs,
  saveLocalScanLogs,
} from '../utils/authSession';
import { hasAdminClaim } from '../utils/adminAccess';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Plus,
  Pill,
  BarChart3,
  Trash2,
  X,
  Save,
  Calendar,
  Building2,
  TrendingUp,
  QrCode,
  Loader2,
  Scan,
  AlertCircle,
  LogIn,
  LogOut,
  ClipboardCheck,
  Check,
  CheckCircle2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { OperationType, handleFirestoreError } from '../utils/firestoreError';
import {
  AUTHORIZED_BARCODES,
  AUTHORIZED_MEDICINES,
  normalizeScannedCode,
} from '../data/authorizedMedicines';
import { CompanyRegistrationForm } from '../components/CompanyRegistrationForm';
import { CompanyMedicineRegistry } from '../components/CompanyMedicineRegistry';
import { FirebaseUnavailableNotice } from '../components/FirebaseUnavailableNotice';

type PortalUser = AppUser | User;
const COMPANY_PORTAL_NAME = 'Company Portal';

type LoginError =
  | { kind: 'message'; message: string }
  | { kind: 'domain'; domain: string };

function getAuthErrorCode(error: unknown): string | undefined {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code;
  }
  return undefined;
}

export default function CompanyPortalPage({ user }: { user: PortalUser | null }) {
  const [activeTab, setActiveTab] = useState<
    'profile' | 'manage' | 'add' | 'analytics' | 'registrations' | 'register-medicine' | 'company-medicines'
  >('register-medicine');
  const [companyProfile, setCompanyProfile] = useState<Company | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [scans, setScans] = useState<ScanLog[]>([]);
  const [requests, setRequests] = useState<CompanyRegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [hasCompanyAccess, setHasCompanyAccess] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminClaimLoaded, setAdminClaimLoaded] = useState(!user);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);

  // Login screen state when !user
  const [emailPassInput, setEmailPassInput] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState<LoginError | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const { t } = useLanguage();

  useEffect(() => {
    let cancelled = false;
    setActiveTab('register-medicine');
    setPortalError(null);
    setIsAdmin(false);
    if (!user) {
      setCompanyProfile(null);
      setHasCompanyAccess(false);
      setProfileLoaded(false);
      setAdminClaimLoaded(true);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setProfileLoaded(false);
    setAdminClaimLoaded(false);
    setHasCompanyAccess(false);
    void hasAdminClaim(user)
      .then((admin) => {
        if (!cancelled) setIsAdmin(admin);
      })
      .catch((error: unknown) => {
        console.error('Unable to verify administrator claim:', error);
        if (!cancelled) {
          setPortalError('Administrator access could not be verified. Refresh and try again.');
        }
      })
      .finally(() => {
        if (!cancelled) setAdminClaimLoaded(true);
      });
    void fetchCompanyProfileAndData();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  async function fetchCompanyProfileAndData() {
    if (!user) return;
    setLoading(true);
    setPortalError(null);
    try {
      const [companySnap, applicationSnap] = await Promise.all([
        getDoc(doc(db, 'companies', user.uid)),
        getDoc(doc(db, 'companyApplications', user.uid)),
      ]);
      const profile = companySnap.exists()
        ? (companySnap.data() as Company)
        : null;
      const application = applicationSnap.exists()
        ? (applicationSnap.data() as CompanyRegistrationRequest)
        : null;
      const approved =
        profile?.status === 'APPROVED' && application?.status === 'APPROVED';

      setCompanyProfile(profile);
      setHasCompanyAccess(approved);
      if (approved) {
        setProfileLoaded(true);
        await fetchCatalogData();
      }
    } catch (error) {
      console.error('Unable to verify company account:', error);
      setPortalError('Unable to verify company access. Check your connection and try again.');
    } finally {
      setProfileLoaded(true);
      setLoading(false);
    }
  }

  async function fetchCatalogData() {
    if (!user) return;
    setLoading(true);
    try {
      const medQuery = query(
        collection(db, 'medicines'),
        where('companyId', '==', user.uid)
      );
      try {
        const medSnap = await getDocs(medQuery);
        const medList = medSnap.docs
          .map((docItem) => ({ id: docItem.id, ...docItem.data() } as Medicine))
          .filter((m) => AUTHORIZED_BARCODES.has(m.barcode));
        if (medList.length > 0) {
          setMedicines(medList);
          saveLocalMedicines(user.uid, medList);
        } else {
          setMedicines(getLocalMedicines(user.uid));
        }
      } catch (err) {
        console.warn('Firestore medicines list failed, falling back to local registry:', err);
        setMedicines(getLocalMedicines(user.uid));
      }

      const scanQuery = query(
        collection(db, 'scans'),
        where('companyId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      try {
        const scanSnap = await getDocs(scanQuery);
        const scanList = scanSnap.docs.map(
          (docItem) => ({ id: docItem.id, ...docItem.data() } as ScanLog)
        );
        setScans(scanList);
        saveLocalScanLogs(user.uid, scanList);
      } catch (err) {
        console.warn('Firestore scans query failed, falling back to local scan history:', err);
        setScans(getLocalScanLogs(user.uid));
      }

    } finally {
      setLoading(false);
    }
  }

  async function fetchApplications() {
    if (!user || !isAdmin) return;
    setApplicationsLoading(true);
    setApplicationsError(null);
    try {
      const applicationsQuery = query(
        collection(db, 'companyApplications'),
        orderBy('submittedAt', 'desc'),
      );
      const snapshot = await getDocs(applicationsQuery);
      setRequests(
        snapshot.docs.map(
          (item) => ({ id: item.id, ...item.data() }) as CompanyRegistrationRequest,
        ),
      );
    } catch (error) {
      console.error('Unable to load company applications:', error);
      setApplicationsError('Company applications could not be loaded. Check your connection and retry.');
    } finally {
      setApplicationsLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) {
      void fetchApplications();
    } else {
      setRequests([]);
    }
  }, [isAdmin, user?.uid]);

  useEffect(() => {
    if (isAdmin && !hasCompanyAccess) setActiveTab('registrations');
  }, [isAdmin, hasCompanyAccess]);

  const handleGoogleSignIn = async () => {
    setLoginError(null);
    setSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(getFirebaseAuth(), provider);
    } catch (error: unknown) {
      const code = getAuthErrorCode(error);

      const currentDomain =
        typeof window !== 'undefined' && window.location.hostname
          ? window.location.hostname
          : 'localhost';

      if (code === 'auth/unauthorized-domain') {
        setLoginError({ kind: 'domain', domain: currentDomain });
      } else if (code === 'auth/operation-not-allowed') {
        setLoginError({
          kind: 'message',
          message:
            'Google sign-in is disabled for this Firebase project. Enable the Google provider under Firebase Console > Authentication > Sign-in method.',
        });
      } else {
        setLoginError({
          kind: 'message',
          message: error instanceof Error ? error.message : 'Google sign-in failed.',
        });
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleEmailPassSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setSigningIn(true);
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), loginEmail.trim(), emailPassInput);
      setEmailPassInput('');
    } catch (error: unknown) {
      const code = getAuthErrorCode(error);
      if (code === 'auth/operation-not-allowed') {
        setLoginError({
          kind: 'message',
          message:
            'Email/Password sign-in is disabled for this Firebase project. Enable the Email/Password provider under Firebase Console > Authentication > Sign-in method.',
        });
      } else if (
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password'
      ) {
        setLoginError({
          kind: 'message',
          message: 'The email or password is incorrect for this authorized account.',
        });
      } else {
        setLoginError({
          kind: 'message',
          message:
            error instanceof Error
              ? error.message
              : 'Firebase email/password sign-in failed.',
        });
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    clearLocalAuthUser();
    try {
      if (auth) await signOut(auth);
    } catch (e) {
      console.warn('Sign out notice:', e);
    }
  };

  if (!user && !isFirebaseConfigured) {
    return (
      <div className="max-w-2xl mx-auto">
        <FirebaseUnavailableNotice feature="The pharmaceutical company portal" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-[#1461A0] rounded-2xl p-6 sm:p-8 md:p-10 space-y-6">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#EAF3FA] border border-[#1461A0] flex items-center justify-center text-[#1461A0] shrink-0">
            <Building2 size={24} />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-[#0F2942] leading-tight">Pharmaceutical Company Sign In</h1>
            <p className="text-[#3B5875] text-sm leading-relaxed">
              Sign in with your company account. New companies can continue with Google to submit an access application for review.
            </p>
          </div>
        </div>

        {loginError && (
          loginError.kind === 'domain' ? (
            <div
              className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl bg-[#FFF5F2] border border-[#FA6806] text-xs text-[#0F2942]"
              role="alert"
            >
              <AlertCircle size={18} className="text-[#FA6806] shrink-0" />
              <span className="font-medium">Firebase: Error (auth/unauthorized-domain).</span>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FA6806]/10 border border-[#FA6806] text-xs text-[#0F2942]" role="alert">
              <AlertCircle size={16} className="text-[#FA6806] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span>{loginError.message}</span>
              </div>
            </div>
          )
        )}

        <form onSubmit={handleEmailPassSignIn} className="space-y-4 border-t border-[#054A8C]/20 pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Company Account Email" required>
              <input
                type="email"
                required
                autoComplete="username"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                placeholder="company@example.com"
                className="w-full px-4 py-3 bg-[#F7FAFC] border border-[#054A8C] rounded-xl text-sm text-[#0F2942]"
              />
            </FormField>
            <FormField label="Password" required>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={emailPassInput}
                onChange={(event) => setEmailPassInput(event.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 bg-[#F7FAFC] border border-[#054A8C] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FA6806]"
              />
            </FormField>
          </div>
          <button
            type="submit"
            disabled={signingIn}
            className="w-full bg-[#FA6806] text-white border border-[#054A8C] py-3 px-5 rounded-xl font-semibold hover:bg-[#E05A00] inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {signingIn ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            <span>Sign In to Company Portal</span>
          </button>
        </form>

        <div className="border-t border-[#054A8C]/20 pt-5">
          <button
            type="button"
            disabled={signingIn}
            onClick={() => void handleGoogleSignIn()}
            className="w-full rounded-xl border border-[#054A8C] bg-white px-5 py-3 text-sm font-semibold text-[#054A8C] hover:bg-[#7BBCE5]/20 inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {signingIn ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            Continue with Google / Apply for Company Access
          </button>
        </div>
      </div>
    );
  }

  if (portalError) {
    return (
      <div role="alert" className="max-w-2xl mx-auto bg-white border border-[#FA6806] rounded-2xl p-8 space-y-4">
        <p className="text-sm text-[#3B5875]">{portalError}</p>
        <button
          type="button"
          onClick={() => void fetchCompanyProfileAndData()}
          className="px-5 py-2.5 rounded-xl bg-[#FA6806] text-white border border-[#054A8C] text-sm font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!profileLoaded || !adminClaimLoaded || loading) {
    return (
      <div className="max-w-lg mx-auto bg-white border border-[#054A8C] rounded-2xl p-12 flex items-center justify-center gap-3 text-[#054A8C]">
        <Loader2 className="animate-spin text-[#FA6806]" size={24} />
        <span className="font-semibold text-sm">Verifying company account...</span>
      </div>
    );
  }

  if (!hasCompanyAccess && !isAdmin) {
    return (
      <div className="space-y-6">
        <div className="max-w-2xl mx-auto flex justify-end">
          <button
            type="button"
            onClick={handleSignOut}
            className="px-4 py-2 rounded-lg border border-[#054A8C] bg-white text-[#054A8C] hover:bg-[#7BBCE5]/20 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <LogOut size={14} />
            <span>Switch Account</span>
          </button>
        </div>
        <CompanyRegistrationForm user={user} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="bg-white border border-[#054A8C] rounded-2xl p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 text-[#054A8C]">
            <Building2 size={24} className="text-[#FA6806]" />
            <h1 className="text-3xl font-bold text-[#0F2942]">
              {companyProfile?.name || (isAdmin ? 'Scanurmed Administration' : COMPANY_PORTAL_NAME)}
            </h1>
          </div>
          <p className="text-sm text-[#3B5875]">
            {companyProfile?.representativeName || (isAdmin ? 'Administrator' : '')} ·{' '}
            <span className="font-mono text-[#054A8C]">{user.email}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap bg-[#F7FAFC] p-1 rounded-xl border border-[#054A8C] gap-1">
            {hasCompanyAccess && (
              <>
                <TabButton
                  active={activeTab === 'register-medicine'}
                  onClick={() => setActiveTab('register-medicine')}
                  icon={<Plus size={16} />}
                  label="Register Medicine"
                />
                <TabButton
                  active={activeTab === 'company-medicines'}
                  onClick={() => setActiveTab('company-medicines')}
                  icon={<Pill size={16} />}
                  label="Registered Medicines"
                />
              </>
            )}
            {hasCompanyAccess && (
              <>
                <TabButton
                  active={activeTab === 'manage'}
                  onClick={() => setActiveTab('manage')}
                  icon={<Pill size={16} />}
                  label={t('medicines')}
                />
                <TabButton
                  active={activeTab === 'add'}
                  onClick={() => setActiveTab('add')}
                  icon={<Plus size={16} />}
                  label={t('add_new')}
                />
                <TabButton
                  active={activeTab === 'analytics'}
                  onClick={() => setActiveTab('analytics')}
                  icon={<BarChart3 size={16} />}
                  label={t('analytics')}
                />
              </>
            )}
            {hasCompanyAccess && (
              <TabButton
                active={activeTab === 'profile'}
                onClick={() => setActiveTab('profile')}
                icon={<Building2 size={16} />}
                label="Profile"
              />
            )}
            {isAdmin && (
              <TabButton
                active={activeTab === 'registrations'}
                onClick={() => setActiveTab('registrations')}
                icon={<ClipboardCheck size={16} />}
                label={`Applications (${requests.filter((r) => r.status === 'PENDING').length})`}
              />
            )}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="px-3.5 py-2 rounded-xl border border-[#054A8C] bg-white text-[#054A8C] hover:bg-[#7BBCE5]/20 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
            title="Sign out of the company account"
          >
            <LogOut size={14} />
            <span>Log Out</span>
          </button>
        </div>
      </header>

      {loading ? (
        <div className="bg-white border border-[#054A8C] rounded-2xl p-12 flex items-center justify-center gap-3 text-[#054A8C]">
          <Loader2 className="animate-spin text-[#FA6806]" size={24} />
          <span className="font-semibold text-sm">Loading company options...</span>
        </div>
      ) : (
        <>
          {hasCompanyAccess && activeTab === 'manage' && (
            <MedicineList medicines={medicines} onRefresh={fetchCatalogData} />
          )}
          {hasCompanyAccess && activeTab === 'register-medicine' && companyProfile && (
            <CompanyMedicineRegistry
              companyId={user.uid}
              companyName={companyProfile.name}
              licenseNumber={companyProfile.licenseNumber}
              licenseType={companyProfile.licenseType}
              licenseDetails={companyProfile.licenseDetails}
            />
          )}
          {hasCompanyAccess && activeTab === 'company-medicines' && companyProfile && (
            <CompanyMedicineRegistry
              companyId={user.uid}
              companyName={companyProfile.name}
              licenseNumber={companyProfile.licenseNumber}
              licenseType={companyProfile.licenseType}
              licenseDetails={companyProfile.licenseDetails}
              showRegistrationForm={false}
            />
          )}
          {hasCompanyAccess && activeTab === 'add' && (
            <AddMedicineForm
              user={user}
              companyName={companyProfile?.name || COMPANY_PORTAL_NAME}
              onSuccess={() => {
                setActiveTab('manage');
                fetchCatalogData();
              }}
            />
          )}
          {hasCompanyAccess && activeTab === 'analytics' && (
            <AnalyticsView medicines={medicines} scans={scans} />
          )}
          {hasCompanyAccess && activeTab === 'profile' && (
            <CompanyProfileEditor
              user={user}
              profile={companyProfile}
              defaultRepName=""
              onSaved={(updated) => setCompanyProfile(updated)}
            />
          )}
          {activeTab === 'registrations' && isAdmin && (
            <CompanyRequestsView
              requests={requests}
              adminUid={user.uid}
              loading={applicationsLoading}
              error={applicationsError}
              onRefresh={() => void fetchApplications()}
            />
          )}
        </>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
        active
          ? 'bg-[#FA6806] text-white border border-[#054A8C]'
          : 'text-[#054A8C] hover:bg-[#7BBCE5]/25'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function CompanyProfileEditor({
  user,
  profile,
  defaultRepName,
  onSaved,
}: {
  user: PortalUser;
  profile: Company | null;
  defaultRepName: string;
  onSaved: (updated: Company) => void;
}) {
  const [companyName, setCompanyName] = useState(profile?.name || COMPANY_PORTAL_NAME);
  const [repName, setRepName] = useState(
    profile?.representativeName || defaultRepName
  );
  const [email, setEmail] = useState(profile?.email || user.email || '');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    if (profile) {
      setCompanyName(profile.name);
      setRepName(profile.representativeName || defaultRepName);
      setEmail(profile.email);
    }
  }, [profile, defaultRepName]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repName.trim() || !profile) return;
    setSaving(true);
    setSavedMsg(false);
    const path = `companies/${user.uid}`;
    const updated: Company = {
      ...profile,
      name: companyName.trim().slice(0, 200),
      email: (email.trim() || user.email || '').slice(0, 254),
      representativeName: repName.trim().slice(0, 150),
      updatedAt: new Date().toISOString(),
    };

    try {
      await updateDoc(doc(db, 'companies', user.uid), {
        name: updated.name,
        email: updated.email,
        representativeName: updated.representativeName,
        updatedAt: serverTimestamp(),
      });
      onSaved(updated);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="max-w-2xl bg-white border border-[#054A8C] rounded-2xl p-6 md:p-8 space-y-6"
    >
      <div className="space-y-1 border-b border-[#054A8C]/20 pb-4">
        <h2 className="text-xl font-bold text-[#0F2942]">Company Profile</h2>
        <p className="text-xs text-[#3B5875]">
          Update your company name, representative, and contact email.
        </p>
      </div>

      <div className="space-y-4">
        <FormField label="Representative Full Name" required>
          <input
            type="text"
            required
            maxLength={150}
            value={repName}
            onChange={(e) => setRepName(e.target.value)}
            className="w-full px-4 py-3 bg-[#F7FAFC] border border-[#054A8C] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FA6806]"
          />
        </FormField>

        <FormField label="Company Name" required>
          <input
            type="text"
            required
            maxLength={200}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full px-4 py-3 bg-[#F7FAFC] border border-[#054A8C] rounded-xl text-sm font-bold text-[#0F2942]"
          />
        </FormField>

        <FormField label="Company Contact Email" required>
          <input
            type="email"
            required
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-[#F7FAFC] border border-[#054A8C] rounded-xl font-mono text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FA6806]"
          />
        </FormField>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          {savedMsg && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#054A8C]">
              <CheckCircle2 size={15} className="text-[#FA6806]" />
              <span>Profile saved</span>
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-[#FA6806] text-white border border-[#054A8C] px-7 py-3 rounded-xl font-semibold hover:bg-[#E05A00] transition-colors inline-flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          <span>Save Profile</span>
        </button>
      </div>
    </form>
  );
}

function CompanyRequestsView({
  requests,
  adminUid,
  loading,
  error,
  onRefresh,
}: {
  requests: CompanyRegistrationRequest[];
  adminUid: string;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleStatusChange = async (
    id: string,
    status: 'APPROVED' | 'REJECTED'
  ) => {
    setUpdatingId(id);
    setActionError(null);
    const applicationRef = doc(db, 'companyApplications', id);
    const companyRef = doc(db, 'companies', id);
    try {
      await runTransaction(db, async (transaction) => {
        const [applicationSnapshot, companySnapshot] = await Promise.all([
          transaction.get(applicationRef),
          transaction.get(companyRef),
        ]);
        if (!applicationSnapshot.exists()) {
          throw new Error('The company application no longer exists.');
        }

        const application = applicationSnapshot.data() as CompanyRegistrationRequest;
        if (application.status !== 'PENDING') {
          throw new Error('This application has already been reviewed.');
        }

        transaction.update(applicationRef, {
          status,
          reviewedAt: serverTimestamp(),
          reviewedByUid: adminUid,
        });

        const companyProfile = {
          uid: application.uid,
          name: application.companyName,
          email: application.email,
          phone: application.phone,
          address: application.address,
          licenseNumber: application.licenseNumber,
          licenseType: application.licenseType,
          licenseDetails: application.licenseDetails,
          representativeName: application.contactPerson,
          applicationId: id,
          status,
          updatedAt: serverTimestamp(),
        };

        if (status === 'APPROVED') {
          transaction.set(companyRef, {
            ...companyProfile,
            createdAt: serverTimestamp(),
            approvedAt: serverTimestamp(),
            approvedByUid: adminUid,
          });
        } else if (companySnapshot.exists()) {
          transaction.update(companyRef, companyProfile);
        }
      });
      onRefresh();
    } catch (error) {
      console.error(`Unable to review company application ${id}:`, error);
      setActionError(
        error instanceof Error
          ? error.message
          : 'Unable to save the application decision. Check your connection and try again.',
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-[#054A8C] bg-white p-10 text-sm font-semibold text-[#054A8C]">
        <Loader2 size={20} className="animate-spin text-[#FA6806]" />
        Loading company applications…
      </div>
    );
  }

  const pendingCount = requests.filter((request) => request.status === 'PENDING').length;
  const approvedCount = requests.filter((request) => request.status === 'APPROVED').length;

  if (requests.length === 0) {
    return (
      <div className="space-y-4">
        {error && <p role="alert" className="rounded-xl border border-[#FA6806] bg-[#FA6806]/10 p-4 text-sm">{error}</p>}
        <div className="bg-white border border-[#054A8C] rounded-2xl p-12 text-center space-y-2">
          <p className="font-semibold text-[#0F2942]">No company applications yet.</p>
          <button type="button" onClick={onRefresh} className="text-sm font-semibold text-[#054A8C] underline">Refresh</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ApplicationMetric label="Total Applications" value={requests.length} />
        <ApplicationMetric label="Pending Review" value={pendingCount} />
        <ApplicationMetric label="Approved" value={approvedCount} />
      </div>
      {(error || actionError) && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#FA6806] bg-[#FA6806]/10 px-4 py-3 text-sm text-[#0F2942]">
          <span>{actionError || error}</span>
          {error && <button type="button" onClick={onRefresh} className="font-semibold text-[#054A8C] underline">Retry</button>}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {requests.map((req) => (
        <div
          key={req.id}
          className="bg-white border border-[#054A8C] rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-[#0F2942]">{req.companyName}</h3>
              <p className="text-xs font-mono text-[#054A8C]">{req.email}</p>
            </div>
            <span className="text-xs font-bold uppercase text-[#FA6806]">
              {req.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs border-t border-[#054A8C]/20 pt-3">
            <div>
              <span className="text-[#3B5875] block">Application ID / Owner UID</span>
              <span className="font-mono font-semibold text-[#0F2942] break-all">{req.uid}</span>
            </div>
            <div>
              <span className="text-[#3B5875] block">License</span>
              <span className="font-mono font-semibold text-[#0F2942]">{req.licenseType}: {req.licenseNumber}</span>
            </div>
            <div>
              <span className="text-[#3B5875] block">Contact</span>
              <span className="font-semibold text-[#0F2942]">
                {req.contactPerson} · {req.phone}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-[#3B5875] block">Registered Address</span>
              <span className="font-semibold text-[#0F2942]">{req.address}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[#3B5875] block">License Details</span>
              <span className="font-semibold text-[#0F2942]">{req.licenseDetails}</span>
            </div>
            <div>
              <span className="text-[#3B5875] block">Submitted</span>
              <span className="font-semibold text-[#0F2942]">{formatFirestoreTimestamp(req.submittedAt)}</span>
            </div>
            {req.reviewedAt && (
              <div>
                <span className="text-[#3B5875] block">Decision Recorded</span>
                <span className="font-semibold text-[#0F2942]">{formatFirestoreTimestamp(req.reviewedAt)}</span>
              </div>
            )}
            {req.reviewedByUid && (
              <div className="col-span-2">
                <span className="text-[#3B5875] block">Reviewed By UID</span>
                <span className="font-mono text-[#0F2942] break-all">{req.reviewedByUid}</span>
              </div>
            )}
          </div>

          {req.notes && (
            <p className="text-xs text-[#3B5875] bg-[#F7FAFC] border border-[#054A8C]/30 rounded-lg p-3">
              {req.notes}
            </p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              disabled={updatingId === req.id || req.status !== 'PENDING'}
              onClick={() => void handleStatusChange(req.id, 'APPROVED')}
              className="px-4 py-2 rounded-lg bg-[#7BBCE5] text-[#054A8C] border border-[#054A8C] text-xs font-semibold hover:bg-[#7BBCE5]/80 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>Approve</span>
            </button>
            <button
              type="button"
              disabled={updatingId === req.id || req.status !== 'PENDING'}
              onClick={() => void handleStatusChange(req.id, 'REJECTED')}
              className="px-4 py-2 rounded-lg bg-white text-[#FA6806] border border-[#054A8C] text-xs font-semibold hover:bg-[#FA6806]/10 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <X size={14} />
              <span>Reject</span>
            </button>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}

function ApplicationMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#054A8C]/30 bg-white px-4 py-3">
      <p className="text-xs font-semibold text-[#3B5875]">{label}</p>
      <p className="text-2xl font-bold text-[#054A8C]">{value}</p>
    </div>
  );
}

function formatFirestoreTimestamp(value: string | CompanyRegistrationRequest['submittedAt']): string {
  const date = typeof value === 'string' ? new Date(value) : value.toDate();
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString();
}

function MedicineList({
  medicines,
  onRefresh,
}: {
  medicines: Medicine[];
  onRefresh: () => void;
}) {
  const { t } = useLanguage();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'medicines', id));
      setConfirmDeleteId(null);
      onRefresh();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `medicines/${id}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {medicines.map((med) => (
        <div
          key={med.id}
          className="bg-white p-6 rounded-2xl border border-[#054A8C] space-y-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-[#7BBCE5]/25 border border-[#054A8C] flex items-center justify-center text-[#054A8C] shrink-0">
                <Pill size={22} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-[#0F2942] truncate">{med.name}</h3>
                <p className="text-xs text-[#3B5875] mt-0.5 truncate">{med.companyName}</p>
              </div>
            </div>

            {confirmDeleteId === med.id ? (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDelete(med.id)}
                  disabled={deletingId === med.id}
                  className="px-3 py-1.5 rounded-lg bg-[#FA6806] text-white border border-[#054A8C] text-xs font-semibold hover:bg-[#E05A00]"
                >
                  {deletingId === med.id ? 'Removing...' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-3 py-1.5 rounded-lg bg-white text-[#054A8C] border border-[#054A8C] text-xs font-semibold hover:bg-[#F7FAFC]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDeleteId(med.id)}
                className="p-2 text-[#054A8C] hover:text-[#FA6806] border border-transparent hover:border-[#FA6806] rounded-lg transition-colors shrink-0"
                title="Delete entry"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#054A8C]/20">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#3B5875]">QR Code</span>
              <div className="flex items-center gap-1.5 text-[#054A8C] font-mono tabular-nums text-xs font-bold">
                <QrCode size={14} className="text-[#FA6806]" />
                <span>{med.barcode || med.qr_code}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#3B5875]">Scans</span>
              <div className="flex items-center gap-1.5 text-[#0F2942] font-mono tabular-nums text-xs font-bold">
                <TrendingUp size={14} className="text-[#054A8C]" />
                <span>{med.scanCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {medicines.length === 0 && (
        <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-[#054A8C] space-y-2">
          <p className="text-[#0F2942] font-semibold text-base">{t('no_meds')}</p>
          <p className="text-sm text-[#3B5875]">
            Use the Add Entry tab to register one of the 20 authorized QR labels under your account.
          </p>
        </div>
      )}
    </div>
  );
}

function AddMedicineForm({
  user,
  companyName,
  onSuccess,
}: {
  user: PortalUser;
  companyName: string;
  onSuccess: () => void;
}) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    ingredients: '',
    dosage: '',
    sideEffects: '',
    mfgDate: '',
    expiryDate: '',
    medicalUses: '',
    otherUses: '',
    allergyWarnings: '',
    alternatives: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (isScanning) {
      scanner = new Html5QrcodeScanner(
        'add-scanner',
        {
          fps: 45,
          qrbox: { width: 240, height: 240 },
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          useBarCodeDetectorIfSupported: true,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        },
        false
      );
      scanner.render(
        (decodedText) => {
          const clean = normalizeScannedCode(decodedText);
          setFormData((prev) => ({ ...prev, barcode: clean }));
          setIsScanning(false);
          scanner?.clear();
        },
        () => {}
      );
    }
    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [isScanning]);

  const handleSelectAuthorizedPreset = (code: string) => {
    const preset = AUTHORIZED_MEDICINES.find((m) => m.barcode === code);
    if (!preset) return;
    setFormError(null);
    setFormData({
      name: preset.name,
      barcode: preset.barcode,
      ingredients: preset.ingredients.join(', '),
      dosage: preset.dosage,
      sideEffects: preset.sideEffects,
      mfgDate: preset.mfgDate,
      expiryDate: preset.expiryDate,
      medicalUses: preset.medicalUses,
      otherUses: preset.otherUses,
      allergyWarnings: preset.allergyWarnings,
      alternatives: preset.alternatives.join(', '),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const normalized = normalizeScannedCode(formData.barcode);
    if (!AUTHORIZED_BARCODES.has(normalized)) {
      setFormError(
        'Only the 20 authorized QR label codes from the official label sheet can be registered.'
      );
      return;
    }

    const ingredientsList = formData.ingredients
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (ingredientsList.length === 0) {
      setFormError('Please enter at least one active ingredient.');
      return;
    }

    setSubmitting(true);
    try {
      await setDoc(doc(db, 'medicines', normalized), {
        name: formData.name.trim(),
        barcode: normalized,
        qr_code: normalized,
        ingredients: ingredientsList,
        dosage: formData.dosage.trim(),
        sideEffects: formData.sideEffects.trim(),
        mfgDate: formData.mfgDate,
        expiryDate: formData.expiryDate,
        medicalUses: formData.medicalUses.trim(),
        otherUses: formData.otherUses.trim(),
        allergyWarnings: formData.allergyWarnings.trim(),
        alternatives: formData.alternatives
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        companyId: user.uid,
        companyName,
        scanCount: 0,
        createdAt: new Date().toISOString(),
      });
      onSuccess();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `medicines/${normalized}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-[#054A8C] p-6 md:p-8 space-y-8"
    >
      <div className="bg-[#7BBCE5]/20 border border-[#054A8C] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs text-[#0F2942] leading-relaxed">
          <strong>Authorized Labels Only:</strong> Select a label from the 20 authorized QR codes to prefill or update its catalog entry.
        </div>
        <select
          value={AUTHORIZED_BARCODES.has(formData.barcode) ? formData.barcode : ''}
          onChange={(e) => handleSelectAuthorizedPreset(e.target.value)}
          className="px-3.5 py-2 rounded-lg border border-[#054A8C] bg-white text-xs font-semibold text-[#054A8C] focus:outline-none focus:ring-2 focus:ring-[#FA6806]"
        >
          <option value="">Choose Authorized Label...</option>
          {AUTHORIZED_MEDICINES.map((m) => (
            <option key={m.barcode} value={m.barcode}>
              {m.name} ({m.barcode})
            </option>
          ))}
        </select>
      </div>

      {formError && (
        <div className="flex items-start gap-2.5 p-4 rounded-xl bg-[#FA6806]/10 border border-[#FA6806] text-sm text-[#0F2942]">
          <AlertCircle size={18} className="text-[#FA6806] shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label={t('med_name')} required>
          <input
            type="text"
            required
            className="w-full px-4 py-3 bg-[#F7FAFC] border border-[#054A8C] rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#FA6806] text-sm"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </FormField>

        <FormField label={t('barcode_val')} required>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="e.g. 8901212121212"
              className="w-full px-4 py-3 bg-[#F7FAFC] border border-[#054A8C] rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#FA6806] font-mono tabular-nums text-sm pr-14"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setIsScanning(!isScanning)}
              className={`absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg border border-[#054A8C] transition-colors flex items-center justify-center ${
                isScanning
                  ? 'bg-[#FA6806] text-white'
                  : 'bg-[#7BBCE5] text-[#054A8C] hover:bg-[#7BBCE5]/80'
              }`}
              title="Scan QR"
            >
              {isScanning ? <X size={16} /> : <Scan size={16} />}
            </button>
          </div>
        </FormField>
      </div>

      {isScanning && (
        <div className="space-y-2">
          <div
            id="add-scanner"
            className="rounded-xl border border-[#054A8C] bg-[#F7FAFC] overflow-hidden"
          />
          <p className="text-center text-xs text-[#3B5875]">{t('scan_instruction')}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label={t('ingredients_comma')} required>
          <input
            type="text"
            required
            placeholder="Dextromethorphan 10mg, Chlorpheniramine 2mg"
            className="w-full px-4 py-3 bg-[#F7FAFC] border border-[#054A8C] rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#FA6806] text-sm"
            value={formData.ingredients}
            onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
          />
        </FormField>

        <FormField label={t('dosage_info')}>
          <input
            type="text"
            className="w-full px-4 py-3 bg-[#F7FAFC] border border-[#054A8C] rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#FA6806] text-sm"
            value={formData.dosage}
            onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
          />
        </FormField>

        <FormField label={t('mfg_date')} required>
          <input
            type="date"
            required
            className="w-full px-4 py-3 bg-[#F7FAFC] border border-[#054A8C] rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#FA6806] font-mono tabular-nums text-sm"
            value={formData.mfgDate}
            onChange={(e) => setFormData({ ...formData, mfgDate: e.target.value })}
          />
        </FormField>

        <FormField label={t('expiry_date')} required>
          <input
            type="date"
            required
            className="w-full px-4 py-3 bg-[#F7FAFC] border border-[#054A8C] rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#FA6806] font-mono tabular-nums text-sm"
            value={formData.expiryDate}
            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label={t('medical_uses')}>
          <textarea
            className="w-full px-4 py-3 bg-[#F7FAFC] border border-[#054A8C] rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#FA6806] h-28 resize-none text-sm"
            value={formData.medicalUses}
            onChange={(e) => setFormData({ ...formData, medicalUses: e.target.value })}
          />
        </FormField>

        <FormField label={t('side_effects')}>
          <textarea
            className="w-full px-4 py-3 bg-[#F7FAFC] border border-[#054A8C] rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#FA6806] h-28 resize-none text-sm"
            value={formData.sideEffects}
            onChange={(e) => setFormData({ ...formData, sideEffects: e.target.value })}
          />
        </FormField>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="bg-[#FA6806] text-white border border-[#054A8C] px-8 py-3.5 rounded-xl font-semibold hover:bg-[#E05A00] transition-colors flex items-center gap-2.5 disabled:opacity-50 whitespace-nowrap"
        >
          {submitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          <span>{t('save_med')}</span>
        </button>
      </div>
    </form>
  );
}

function FormField({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-[#054A8C] flex items-center gap-1">
        <span>{label}</span>
        {required && <span className="text-[#FA6806]">*</span>}
      </label>
      {children}
    </div>
  );
}

function AnalyticsView({
  medicines,
  scans,
}: {
  medicines: Medicine[];
  scans: ScanLog[];
}) {
  const { t } = useLanguage();
  const scanData = medicines
    .map((m) => ({
      name: m.name,
      scans: m.scanCount || 0,
    }))
    .sort((a, b) => b.scans - a.scans)
    .slice(0, 5);

  const totalScans = medicines.reduce((acc, m) => acc + (m.scanCount || 0), 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<TrendingUp className="text-[#FA6806]" size={22} />}
          label={t('total_scans')}
          value={totalScans.toString()}
        />
        <StatCard
          icon={<Pill className="text-[#054A8C]" size={22} />}
          label={t('active_meds')}
          value={medicines.length.toString()}
        />
        <StatCard
          icon={<Calendar className="text-[#FA6806]" size={22} />}
          label={t('recent_activity')}
          value={scans.length.toString()}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#054A8C] space-y-6">
          <h3 className="text-xl font-bold text-[#0F2942]">{t('top_scanned')}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scanData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#7BBCE5" />
                <XAxis dataKey="name" fontSize={11} tickLine={false} stroke="#054A8C" />
                <YAxis fontSize={11} tickLine={false} stroke="#054A8C" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #054A8C',
                    backgroundColor: '#FFFFFF',
                    color: '#0F2942',
                  }}
                />
                <Bar dataKey="scans" fill="#FA6806" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#054A8C] space-y-6">
          <h3 className="text-xl font-bold text-[#0F2942]">{t('recent_scan_activity')}</h3>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
            {scans.map((scan) => {
              const med = medicines.find((m) => m.id === scan.medicineId);
              return (
                <div
                  key={scan.id}
                  className="flex items-center justify-between p-4 bg-[#F7FAFC] rounded-xl border border-[#054A8C]/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-[#7BBCE5]/25 border border-[#054A8C] p-2 rounded-lg text-[#054A8C] shrink-0">
                      <Pill size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[#0F2942] truncate">
                        {med?.name || scan.medicineId}
                      </p>
                      <p className="text-xs font-mono tabular-nums text-[#3B5875]">
                        {new Date(scan.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-[#054A8C] shrink-0">
                    {scan.id.slice(0, 8)}
                  </span>
                </div>
              );
            })}
            {scans.length === 0 && (
              <p className="text-center text-[#3B5875] py-10 text-sm">
                {t('no_scan_activity')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#054A8C] flex items-center gap-4">
      <div className="bg-[#7BBCE5]/25 border border-[#054A8C] p-3.5 rounded-xl shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[#3B5875] text-xs font-semibold">{label}</p>
        <p className="text-3xl font-bold font-mono tabular-nums text-[#0F2942]">{value}</p>
      </div>
    </div>
  );
}
