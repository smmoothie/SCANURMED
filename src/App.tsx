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
import { clearLocalAuthUser } from './utils/authSession';
import {
  Scan,
  Search,
  CircleHelp,
  Phone,
  LogIn,
  LogOut,
  Info,
  Languages,
  Building2,
  Moon,
  Sun,
  User as UserIcon,
  LayoutDashboard,
  ChevronDown,
  UserPlus,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineIndicator } from './components/OfflineIndicator';

import Home from './pages/Home';
import ScannerPage from './pages/ScannerPage';
import ResultPage from './pages/ResultPage';
import CompanyPortalPage from './pages/CompanyPortalPage';
import SearchPage from './pages/SearchPage';
import CustomerSignUpPage from './pages/CustomerSignUpPage';
import CustomerLoginPage from './pages/CustomerLoginPage';
import CustomerDashboardPage from './pages/CustomerDashboardPage';

const LOGO_SRC = '/assets/aistudio/image_79859417.png';
const THEME_STORAGE_KEY = 'scanurmed_theme';
type Theme = 'light' | 'dark';

function getSavedTheme(): Theme {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch (error) {
    console.warn('Unable to read saved theme:', error);
    return 'light';
  }
}

function AppContent() {
  const [user, setUser] = useState<AppUser | User | null>(null);
  const [theme, setTheme] = useState<Theme>(getSavedTheme);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showIntroRoll, setShowIntroRoll] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.warn('Unable to save theme preference:', error);
    }
  }, [theme]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntroRoll(false);
    }, shouldReduceMotion ? 200 : 1100);
    return () => clearTimeout(timer);
  }, [shouldReduceMotion]);

  useEffect(() => {
    const unsubscribeFirebase = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });

    return () => {
      unsubscribeFirebase();
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
      <Navbar
        user={user}
        theme={theme}
        onToggleTheme={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
      />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/scan" element={<ScannerPage user={user} />} />
            <Route path="/result/:barcode" element={<ResultPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/company/*" element={<CompanyPortalPage user={user} />} />
            <Route path="/signup" element={<CustomerSignUpPage />} />
            <Route path="/login" element={<CustomerLoginPage />} />
            <Route path="/dashboard" element={<CustomerDashboardPage />} />
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

function Navbar({
  user,
  theme,
  onToggleTheme,
}: {
  user: AppUser | User | null;
  theme: Theme;
  onToggleTheme: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage } = useLanguage();
  const shouldReduceMotion = useReducedMotion();
  const [dashboardMenuOpen, setDashboardMenuOpen] = useState(false);

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

  const handleReachOutClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (location.pathname === '/' && location.hash === '#reachout') {
      event.preventDefault();
      document
        .getElementById('reachout')
        ?.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth' });
    }
  };

  return (
    <header className="bg-white border-b border-[#054A8C] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2 sm:gap-8">
        <Link
          to="/"
          className="text-lg sm:text-2xl font-bold tracking-tight text-[#054A8C] whitespace-nowrap shrink-0 flex items-center gap-2 sm:gap-3 group"
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
            className="w-8 h-8 sm:w-14 sm:h-14 object-contain shrink-0"
          />
          <span>Scanurmed</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
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
          <NavLink
            to="/#reachout"
            icon={<Phone size={16} />}
            label="Reach Out"
            active={location.pathname === '/' && location.hash === '#reachout'}
            onClick={handleReachOutClick}
          />
        </nav>

        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={language === 'en' ? 'Switch language to Hindi' : 'Switch language to English'}
            title={language === 'en' ? 'Switch language to Hindi' : 'Switch language to English'}
            className="px-2 sm:px-3 py-2 rounded-lg border border-[#054A8C] bg-white hover:bg-[#7BBCE5]/20 text-[#054A8C] transition-colors text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Languages size={14} />
            <span className="hidden sm:inline">{language === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            aria-pressed={theme === 'dark'}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#054A8C]/40 bg-white text-[#054A8C] transition-colors hover:bg-[#7BBCE5]/20"
          >
            {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
          </button>

          {user ? (
            <>
              <div className="relative">
                <button
                  type="button"
                  aria-expanded={dashboardMenuOpen}
                  aria-haspopup="menu"
                  onClick={() => setDashboardMenuOpen((open) => !open)}
                  className="px-3.5 py-2 rounded-lg border border-[#054A8C] bg-white text-[#054A8C] hover:bg-[#7BBCE5]/20 transition-colors flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap shrink-0"
                >
                  <LayoutDashboard size={16} className="text-[#FA6806]" />
                  <span>Dashboard</span>
                  <ChevronDown size={14} />
                </button>
                {dashboardMenuOpen && (
                  <div role="menu" className="absolute right-0 top-full mt-2 min-w-52 rounded-xl border border-[#054A8C] bg-white p-2 shadow-lg">
                    <Link
                      role="menuitem"
                      to="/dashboard"
                      onClick={() => setDashboardMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#054A8C] hover:bg-[#7BBCE5]/20"
                    >
                      <UserIcon size={16} className="text-[#FA6806]" />
                      Customer Dashboard
                    </Link>
                    <Link
                      role="menuitem"
                      to="/company"
                      onClick={() => setDashboardMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#054A8C] hover:bg-[#7BBCE5]/20"
                    >
                      <Building2 size={16} className="text-[#FA6806]" />
                      Company Portal
                    </Link>
                  </div>
                )}
              </div>
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
            <>
              <Link
                to="/login"
                className="px-3 py-2 rounded-lg border border-[#054A8C] bg-white text-[#054A8C] hover:bg-[#7BBCE5]/20 transition-colors flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap shrink-0"
              >
                <LogIn size={16} />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
              <Link
                to="/signup"
                className="bg-[#FA6806] text-white border border-[#054A8C] px-2 sm:px-4 py-2 rounded-lg hover:bg-[#E05A00] transition-colors flex items-center gap-2 text-sm font-semibold whitespace-nowrap shrink-0"
              >
                <UserPlus size={16} />
                <span className="hidden sm:inline">Sign Up</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Compact mobile nav strip */}
      <div className="lg:hidden border-t border-[#054A8C]/20 bg-white px-2 sm:px-4 py-2 flex items-center justify-around gap-1 sm:gap-2">
        <NavLink compact to="/search" icon={<Search size={15} />} label={t('search')} active={location.pathname === '/search'} />
        <NavLink compact to="/scan" icon={<Scan size={15} />} label={t('scanner')} active={location.pathname === '/scan'} />
        <NavLink
          compact
          to="/#why-scanurmed"
          icon={<CircleHelp size={15} />}
          label="Why Us?"
          active={location.pathname === '/' && location.hash === '#why-scanurmed'}
          onClick={handleWhyUsClick}
        />
        <NavLink
          compact
          to="/#reachout"
          icon={<Phone size={15} />}
          label="Reach Out"
          active={location.pathname === '/' && location.hash === '#reachout'}
          onClick={handleReachOutClick}
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
  compact = false,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  compact?: boolean;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center ${compact ? 'gap-1 text-xs sm:gap-1.5 sm:text-sm' : 'gap-1.5 text-sm'} font-semibold transition-colors relative py-1 whitespace-nowrap shrink-0 ${
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
        <div className="grid grid-cols-1 gap-8 items-start md:grid-cols-2 lg:grid-cols-3">
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

          <nav aria-label="Footer navigation" className="space-y-3">
            <h2 className="font-bold text-[#0F2942]">Quick Links</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <Link to="/search" className="text-[#054A8C] transition-colors hover:text-[#FA6806]">
                {t('search')}
              </Link>
              <Link to="/scan" className="text-[#054A8C] transition-colors hover:text-[#FA6806]">
                {t('scanner')}
              </Link>
              <Link
                to="/#why-scanurmed"
                className="text-[#054A8C] transition-colors hover:text-[#FA6806]"
              >
                Why Us?
              </Link>
              <Link
                to="/#reachout"
                className="text-[#054A8C] transition-colors hover:text-[#FA6806]"
              >
                Reach Out
              </Link>
            </div>
          </nav>

          <div className="space-y-3">
            <h2 className="font-bold text-[#0F2942]">Call Us</h2>
            <div className="space-y-2">
              <a
                href="tel:+917488152499"
                className="flex items-center gap-2 text-sm text-[#054A8C] transition-colors hover:text-[#16734B]"
              >
                <Phone size={15} />
                +91 7488152499
              </a>
              <a
                href="tel:+918093387542"
                className="flex items-center gap-2 text-sm text-[#054A8C] transition-colors hover:text-[#16734B]"
              >
                <Phone size={15} />
                +91 8093387542
              </a>
            </div>
          </div>

          <div className="bg-[#7BBCE5]/15 border border-[#054A8C] rounded-xl p-5 flex gap-3 items-start md:col-span-2 lg:col-span-3">
            <Info className="text-[#054A8C] shrink-0 mt-0.5" size={18} />
            <p className="text-[#0F2942] text-xs leading-relaxed">
              <strong>Educational Disclaimer:</strong> This application provides reference information exclusively for the 20 authorized medicine QR labels. Always consult a qualified healthcare professional before taking any medication.
            </p>
          </div>
        </div>
        <div className="mt-8 border-t border-[#054A8C]/20 pt-5 text-xs text-[#3B5875]">
          &copy; {new Date().getFullYear()} SCANURMED. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
