import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '../firebase';
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react';
import { FirebaseUnavailableNotice } from '../components/FirebaseUnavailableNotice';

export default function CustomerLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const requestedDestination = (location.state as { from?: string } | null)?.from;
  const from =
    requestedDestination?.startsWith('/') && !requestedDestination.startsWith('//')
      ? requestedDestination
      : '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err);
      // Provide user-friendly messages
      if (raw.includes('user-not-found') || raw.includes('wrong-password') || raw.includes('invalid-credential')) {
        setError('Invalid email or password. Please try again.');
      } else if (raw.includes('too-many-requests')) {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError(raw.replace('Firebase: ', '').replace(/\(auth\/.*?\)\.?/, '').trim());
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#7BBCE5]/25 border border-[#054A8C] text-[#054A8C] mb-2">
            <LogIn size={26} />
          </div>
          <h1
            className="text-3xl font-bold text-[#0F2942]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Customer Sign In
          </h1>
          <p className="text-[#3B5875] text-sm">
            Sign in to access your saved medicines and scan history.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#054A8C] shadow-sm p-8 space-y-6">
          {!isFirebaseConfigured && (
            <FirebaseUnavailableNotice feature="Customer sign-in" />
          )}

          {error && (
            <div className="bg-[#FA6806]/10 border border-[#FA6806] text-[#FA6806] rounded-xl px-4 py-3 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-[#0F2942]">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#054A8C]">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  placeholder="ravi@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full pl-9 pr-4 py-3 border border-[#054A8C] rounded-xl text-[#0F2942] text-sm focus:outline-none focus:ring-2 focus:ring-[#FA6806]/40"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-[#0F2942]">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#054A8C]">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full pl-9 pr-4 py-3 border border-[#054A8C] rounded-xl text-[#0F2942] text-sm focus:outline-none focus:ring-2 focus:ring-[#FA6806]/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isFirebaseConfigured}
              className="w-full flex items-center justify-center gap-2 bg-[#FA6806] text-white font-semibold py-3 px-6 rounded-xl border border-[#054A8C] disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Sign In <LogIn size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#3B5875]">
            New to Scanurmed?{' '}
            <Link to="/signup" className="text-[#FA6806] font-semibold">
              Create an account
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-[#3B5875] mt-6">
          Are you a company?{' '}
          <Link to="/company" className="text-[#054A8C] font-semibold underline">
            Company Login
          </Link>
        </p>
      </div>
    </div>
  );
}
