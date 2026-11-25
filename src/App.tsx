/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './firebase';
import { AppUser } from './types';
import { getLocalAuthUser, subscribeToAuthChanges, clearLocalAuthUser } from './utils/authSession';
import {
  Scan,
  Search,
  CircleHelp,
  LogIn,
  LogOut,
  Info,
  Languages,
  Building2,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineIndicator } from './components/OfflineIndicator';
import { isApprovedCompanyEmail } from './data/approvedCompanies';

import Home from './pages/Home';
import ScannerPage from './pages/ScannerPage';
import ResultPage from './pages/ResultPage';
import CompanyPortalPage from './pages/CompanyPortalPage';
import SearchPage from './pages/SearchPage';

const LOGO_SRC = '/assets/aistudio/image_79859417.png';

function AppContent() {
  const [user, setUser] = useState<AppUser | User | null>(() => getLocalAuthUser());
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showIntroRoll, setShowIntroRoll] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntroRoll(false);
    }, shouldReduceMotion ? 200 : 1100);
    return () => clearTimeout(timer);
  }, [shouldReduceMotion]);

  useEffect(() => {
    const unsubscribeFirebase = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        const localUser = getLocalAuthUser();
        setUser(localUser);
      }
      setIsAuthReady(true);
    });

    const unsubscribeLocal = subscribeToAuthChanges((changedUser) => {
      setUser(changedUser || auth.currentUser);
    });

    return () => {
      unsubscribeFirebase();
      unsubscribeLocal();
    };
  }, []);

  if (!isAuthReady || showIntroRoll) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { x: -220, rotate: -360, opacity: 0, scale: 0.7 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { x: 0, rotate: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          <img
            src={LOGO_SRC}
            alt="Scanurmed Logo"
            referrerPolicy="no-referrer"
            className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 object-contain"
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FAFC] text-[#0F2942] font-sans selection:bg-[#7BBCE5]/30 selection:text-[#054A8C]">
      <Navbar user={user} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/scan" element={<ScannerPage />} />
            <Route path="/result/:barcode" element={<ResultPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/company/*" element={<CompanyPortalPage user={user} />} />
            <Route path="/dashboard/*" element={<Navigate to="/company" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <Router>
          <AppContent />
        </Router>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

function Navbar({ user }: { user: AppUser | User | null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  const handleLogin = () => {
    navigate('/company');
  };

  const handleLogout = async () => {
    if (user?.uid) {
      sessionStorage.removeItem(`scanurmed_unlocked_${user.uid}`);
    }
    clearLocalAuthUser();
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('SignOut warning:', e);
    }
    navigate('/');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const handleWhyUsClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (location.pathname === '/' && location.hash === '#why-scanurmed') {
      event.preventDefault();
      document
        .getElementById('why-scanurmed')
        ?.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth' });
    }
  };

  return (
    <header className="bg-white border-b border-[#054A8C] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-8">
        <Link
          to="/"
          className="text-2xl font-bold tracking-tight text-[#054A8C] whitespace-nowrap shrink-0 flex items-center gap-3 group"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <motion.img
            src={LOGO_SRC}
            alt="Scanurmed"
            referrerPolicy="no-referrer"
            initial={shouldReduceMotion ? undefined : { rotate: -360 }}
            animate={shouldReduceMotion ? undefined : { rotate: 0 }}
            whileHover={shouldReduceMotion ? undefined : { rotate: 360 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="w-14 h-14 object-contain shrink-0"
          />
          <span>Scanurmed</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <NavLink
            to="/search"
            icon={<Search size={16} />}
            label={t('search')}
            active={location.pathname === '/search'}
          />
          <NavLink
            to="/scan"
            icon={<Scan size={16} />}
            label={t('scanner')}
            active={location.pathname === '/scan'}
          />
          <NavLink
            to="/#why-scanurmed"
            icon={<CircleHelp size={16} />}
            label="Why Us?"
            active={location.pathname === '/' && location.hash === '#why-scanurmed'}
            onClick={handleWhyUsClick}
          />
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={toggleLanguage}
            className="px-3 py-2 rounded-lg border border-[#054A8C] bg-white hover:bg-[#7BBCE5]/20 text-[#054A8C] transition-colors text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Languages size={14} />
            <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>

          {user ? (
            <>
              <Link
                to="/company"
                className="px-3.5 py-2 rounded-lg border border-[#054A8C] bg-white text-[#054A8C] hover:bg-[#7BBCE5]/20 transition-colors flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap shrink-0"
              >
                <Building2 size={16} className="text-[#FA6806]" />
                <span className="hidden sm:inline">
                  {isApprovedCompanyEmail(user.email) ? t('company_options') : 'Company Access'}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg border border-[#054A8C] bg-[#7BBCE5] text-[#054A8C] hover:bg-[#7BBCE5]/80 transition-colors flex items-center gap-2 text-sm font-semibold whitespace-nowrap shrink-0"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">{t('logout')}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              className="bg-[#FA6806] text-white border border-[#054A8C] px-4 py-2 rounded-lg hover:bg-[#E05A00] transition-colors flex items-center gap-2 text-sm font-semibold whitespace-nowrap shrink-0"
            >
              <LogIn size={16} />
              <span className="hidden sm:inline">{t('login')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Compact mobile nav strip */}
      <div className="md:hidden border-t border-[#054A8C]/20 bg-white px-4 py-2 flex items-center justify-around gap-2">
        <NavLink to="/search" icon={<Search size={15} />} label={t('search')} active={location.pathname === '/search'} />
        <NavLink to="/scan" icon={<Scan size={15} />} label={t('scanner')} active={location.pathname === '/scan'} />
        <NavLink
          to="/#why-scanurmed"
          icon={<CircleHelp size={15} />}
          label="Why Us?"
          active={location.pathname === '/' && location.hash === '#why-scanurmed'}
          onClick={handleWhyUsClick}
        />
      </div>
    </header>
  );
}

function NavLink({
  to,
  icon,
  label,
  active,
  onClick,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-1.5 text-sm font-semibold transition-colors relative py-1 whitespace-nowrap shrink-0 ${
        active
          ? 'text-[#FA6806] border-b-2 border-[#FA6806]'
          : 'text-[#054A8C] hover:text-[#FA6806]'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-white border-t border-[#054A8C] py-10 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-2">
            <div
              className="flex items-center gap-3 text-[#054A8C] font-bold text-xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <img
                src={LOGO_SRC}
                alt="Scanurmed"
                referrerPolicy="no-referrer"
                className="w-14 h-14 object-contain"
              />
              <span>Scanurmed</span>
            </div>
            <p className="text-[#3B5875] text-sm max-w-md leading-relaxed">
              {t('hero_sub')}
            </p>
          </div>
          <div className="bg-[#7BBCE5]/15 border border-[#054A8C] rounded-xl p-5 flex gap-3 items-start">
            <Info className="text-[#054A8C] shrink-0 mt-0.5" size={18} />
            <p className="text-[#0F2942] text-xs leading-relaxed">
              <strong>Educational Disclaimer:</strong> This application provides reference information exclusively for the 20 authorized medicine QR labels. Always consult a qualified healthcare professional before taking any medication.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
