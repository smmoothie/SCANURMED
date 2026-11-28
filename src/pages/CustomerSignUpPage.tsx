import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential,
} from 'firebase/auth';
import { auth } from '../firebase';
import { saveCustomerProfile } from '../utils/customerAuth';
import { UserPlus, Phone, Mail, Lock, User, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';

type Step = 'details' | 'otp';

function normalizePhoneNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  const normalized = phone.trim().startsWith('+')
    ? `+${digits}`
    : `+91${digits.replace(/^0/, '')}`;
  return /^\+[1-9]\d{7,14}$/.test(normalized) ? normalized : null;
}

function firebaseErrorMessage(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String(error.code)
      : '';
  if (code === 'auth/operation-not-allowed') {
    return 'Phone verification is not enabled for this Firebase project. Enable the Phone provider in Firebase Authentication.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'This site domain is not authorized for Firebase Phone Authentication. Add it in Firebase Authentication settings.';
  }
  if (code === 'auth/invalid-phone-number') {
    return 'Enter a valid phone number with its country code.';
  }
  if (code === 'auth/invalid-verification-code') {
    return 'That OTP is incorrect. Check the message and try again.';
  }
  if (code === 'auth/code-expired') {
    return 'That OTP has expired. Request a new code and try again.';
  }
  const message = error instanceof Error ? error.message : 'Registration failed. Please try again.';
  return message.replace('Firebase: ', '').replace(/\(auth\/.*?\)\.?/, '').trim();
}

export default function CustomerSignUpPage() {
  const navigate = useNavigate();
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [accountReady, setAccountReady] = useState(false);
  const [phoneLinked, setPhoneLinked] = useState(false);
  const [step, setStep] = useState<Step>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<
    Awaited<ReturnType<typeof signInWithPhoneNumber>> | null
  >(null);

  async function sendOtp(phoneNumber: string) {
    recaptchaVerifier.current?.clear();
    recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    });
    const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier.current);
    setConfirmationResult(result);
  }

  async function handleDetailsSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!fullName.trim() || fullName.trim().length > 150) {
      setError('Enter your full name (up to 150 characters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.trim().length > 254) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!normalizedPhone) {
      setError('Enter a valid phone number, including the country code if outside India.');
      return;
    }

    setLoading(true);
    try {
      if (!accountReady) {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        setAccountReady(true);
        const accountCreatedAt = new Date().toISOString();
        setCreatedAt(accountCreatedAt);
        setVerifiedPhoneNumber(normalizedPhone);
        await updateProfile(credential.user, { displayName: fullName.trim() });
      } else {
        const currentUser = auth.currentUser;
        if (!currentUser || currentUser.email?.toLowerCase() !== email.trim().toLowerCase()) {
          throw new Error('Your account session expired. Please sign in and restart registration.');
        }
        await updateProfile(currentUser, { displayName: fullName.trim() });
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Unable to access the new account. Please try signing in again.');
      }
      const profileCreatedAt = createdAt || new Date().toISOString();
      setCreatedAt(profileCreatedAt);
      setVerifiedPhoneNumber(normalizedPhone);
      await saveCustomerProfile(currentUser.uid, {
        uid: currentUser.uid,
        fullName: fullName.trim(),
        email: currentUser.email || email.trim(),
        phone: normalizedPhone,
        phoneVerified: false,
        createdAt: profileCreatedAt,
      });

      setStep('otp');
      await sendOtp(normalizedPhone);
    } catch (submitError: unknown) {
      setError(firebaseErrorMessage(submitError));
      if (accountReady) setStep('otp');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setError(null);
    setLoading(true);
    try {
      await sendOtp(verifiedPhoneNumber);
    } catch (sendError: unknown) {
      setError(firebaseErrorMessage(sendError));
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit OTP sent to your phone.');
      return;
    }
    if (!confirmationResult) {
      setError('Request a new OTP before continuing.');
      return;
    }

    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Your account session expired. Please sign in and restart registration.');
      }
      if (!phoneLinked) {
        const phoneCredential = PhoneAuthProvider.credential(
          confirmationResult.verificationId,
          otp,
        );
        await linkWithCredential(currentUser, phoneCredential);
        setPhoneLinked(true);
      }

      await currentUser.getIdToken(true);
      await saveCustomerProfile(currentUser.uid, {
        uid: currentUser.uid,
        fullName: fullName.trim(),
        email: currentUser.email || email.trim(),
        phone: verifiedPhoneNumber,
        phoneVerified: true,
        createdAt: createdAt || new Date().toISOString(),
      });
      navigate('/dashboard', { replace: true });
    } catch (verificationError: unknown) {
      setError(firebaseErrorMessage(verificationError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div id="recaptcha-container" />

      <div className="w-full max-w-md">
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#7BBCE5]/25 border border-[#054A8C] text-[#054A8C] mb-2">
            <UserPlus size={26} />
          </div>
          <h1 className="text-3xl font-bold text-[#0F2942]" style={{ fontFamily: 'var(--font-display)' }}>
            Create Account
          </h1>
          <p className="text-[#3B5875] text-sm">
            {step === 'details'
              ? 'Register to scan and save medicines to your personal history.'
              : 'Enter the OTP sent to your mobile number to finish registration.'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#054A8C] shadow-sm p-8 space-y-6">
          {error && (
            <div role="alert" className="bg-[#FA6806]/10 border border-[#FA6806] text-[#FA6806] rounded-xl px-4 py-3 text-sm font-medium">
              {error}
            </div>
          )}

          {step === 'details' ? (
            <form onSubmit={handleDetailsSubmit} className="space-y-5">
              <Field label="Full Name" icon={<User size={16} />} type="text" placeholder="Ravi Kumar" value={fullName} onChange={setFullName} autoComplete="name" required disabled={loading} />
              <Field label="Email Address" icon={<Mail size={16} />} type="email" placeholder="ravi@example.com" value={email} onChange={setEmail} autoComplete="email" required disabled={loading} />
              <Field label="Password" icon={<Lock size={16} />} type="password" placeholder="At least 8 characters" value={password} onChange={setPassword} autoComplete="new-password" required minLength={8} disabled={loading} />
              <Field label="Phone Number" icon={<Phone size={16} />} type="tel" placeholder="+91 9876543210" value={phone} onChange={setPhone} autoComplete="tel" required disabled={loading} />

              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-[#FA6806] text-white font-semibold py-3 px-6 rounded-xl border border-[#054A8C] disabled:opacity-60">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <>Continue <ArrowRight size={16} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div className="bg-[#7BBCE5]/15 border border-[#054A8C] rounded-xl p-4 text-sm text-[#054A8C]">
                <ShieldCheck size={16} className="inline mr-1 text-[#FA6806]" />
                A verification code was requested for <strong>{verifiedPhoneNumber}</strong>.
                Registration completes only after Firebase verifies the code.
              </div>

              <div className="space-y-1.5">
                <label htmlFor="signup-otp" className="block text-sm font-semibold text-[#0F2942]">
                  One-Time Password
                </label>
                <input
                  id="signup-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full border border-[#054A8C] rounded-xl px-4 py-3 text-[#0F2942] font-mono tracking-widest text-xl text-center focus:outline-none focus:ring-2 focus:ring-[#FA6806]/40"
                />
              </div>

              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-[#FA6806] text-white font-semibold py-3 px-6 rounded-xl border border-[#054A8C] disabled:opacity-60">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <>Verify & Complete <ShieldCheck size={16} /></>}
              </button>
              <button type="button" onClick={handleResendOtp} disabled={loading} className="w-full text-sm text-[#054A8C] font-medium underline disabled:opacity-60">
                Resend OTP
              </button>
            </form>
          )}

          <p className="text-center text-sm text-[#3B5875]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#FA6806] font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
  required = false,
  minLength,
  disabled = false,
}: {
  label: string;
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  disabled?: boolean;
}) {
  const id = `signup-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-[#0F2942]">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#054A8C]">{icon}</span>
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          disabled={disabled}
          className="w-full pl-9 pr-4 py-3 border border-[#054A8C] rounded-xl text-[#0F2942] text-sm focus:outline-none focus:ring-2 focus:ring-[#FA6806]/40 disabled:bg-[#F7FAFC]"
        />
      </div>
    </div>
  );
}
