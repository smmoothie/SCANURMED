import { FormEvent, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import {
  AlertCircle,
  CheckCircle2,
  HeartPulse,
  Loader2,
  MessageSquareText,
  PhoneCall,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { db } from '../firebase';

type ContactFormValues = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

type ContactField = keyof ContactFormValues;
type ContactFieldErrors = Partial<Record<ContactField, string>>;

const EMPTY_FORM: ContactFormValues = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_PHONE_PATTERN = /^(?:\+?91)?[6-9]\d{9}$/;

const CONTACT_NUMBERS = ['+91 7488152499', '+91 8093387542'] as const;

function validateForm(values: ContactFormValues): ContactFieldErrors {
  const errors: ContactFieldErrors = {};
  const email = values.email.trim();
  const normalizedPhone = values.phone.replace(/[\s().-]/g, '');

  if (!values.name.trim()) errors.name = 'Enter your full name.';
  if (!email) {
    errors.email = 'Enter your email address.';
  } else if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (values.phone.trim() && !INDIAN_PHONE_PATTERN.test(normalizedPhone)) {
    errors.phone = 'Enter a valid 10-digit Indian number, with optional +91.';
  }
  if (!values.subject.trim()) errors.subject = 'Enter a subject.';
  if (!values.message.trim()) errors.message = 'Enter your message.';

  return errors;
}

export function ReachOutSection() {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const submittingRef = useRef(false);
  const [values, setValues] = useState<ContactFormValues>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (location.hash !== '#reachout') return;

    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById('reachout')
        ?.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, shouldReduceMotion]);

  const updateField = (field: ContactField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setSubmissionError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const errors = validateForm(values);
    setFieldErrors(errors);
    setSubmissionError('');
    setSuccessMessage('');

    const firstInvalidField = Object.keys(errors)[0] as ContactField | undefined;
    if (firstInvalidField) {
      document.getElementById(`contact-${firstInvalidField}`)?.focus();
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    const normalizedPhone = values.phone.replace(/[\s().-]/g, '');
    const message = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      ...(normalizedPhone ? { phone: normalizedPhone } : {}),
      subject: values.subject.trim(),
      message: values.message.trim(),
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'contact_messages'), message);
      setValues(EMPTY_FORM);
      setFieldErrors({});
      setSuccessMessage('Thank you — your message has been received.');
    } catch (error) {
      console.error('Contact message submission failed:', error);
      setSubmissionError(
        'We could not send your message right now. Please try again or call us using one of the numbers provided.'
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const revealProps = {
    initial: shouldReduceMotion ? false : { opacity: 0, y: 18 },
    whileInView: shouldReduceMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.18 },
    transition: { duration: 0.5, ease: 'easeOut' as const },
  };

  const fieldClassName =
    'w-full rounded-xl border border-[#054A8C]/30 bg-white px-4 py-3 text-sm text-[#0F2942] outline-none transition focus:border-[#16734B] focus:ring-2 focus:ring-[#16734B]/20 placeholder:text-[#3B5875]/65';

  return (
    <section
      id="reachout"
      aria-labelledby="reachout-title"
      className="scroll-mt-36 overflow-hidden rounded-2xl border border-[#054A8C]/25 bg-white p-6 shadow-[0_12px_36px_rgba(15,41,66,0.07)] sm:p-8 md:scroll-mt-24 lg:p-10"
    >
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <motion.div
          {...revealProps}
          className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#F7FAFC] p-6 sm:p-8"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full border-[24px] border-[#16734B]/[0.07]"
          />
          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#16734B]/20 bg-[#E8F3ED] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#16734B]">
              <HeartPulse size={14} />
              Here for you
            </div>
            <div className="space-y-3">
              <h2
                id="reachout-title"
                className="text-3xl font-bold leading-tight text-[#0F2942] sm:text-4xl"
                style={{ textWrap: 'balance' }}
              >
                Let&apos;s Connect!
              </h2>
              <p className="max-w-xl text-sm leading-7 text-[#3B5875] sm:text-base">
                Your health, trust and feedback matter to us. Whether you have questions,
                suggestions, partnership opportunities or simply want to know more about
                SCANURMED, we&apos;re here to help.
              </p>
            </div>
          </div>

          <div className="relative mt-8 rounded-xl border border-[#054A8C]/15 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3FA] text-[#1461A0]">
                <PhoneCall size={19} />
              </span>
              <div>
                <h3 className="font-bold text-[#0F2942]">Call Us</h3>
                <p className="text-xs text-[#3B5875]">Speak directly with our team</p>
              </div>
            </div>

            <div className="space-y-2">
              {CONTACT_NUMBERS.map((number) => (
                <a
                  key={number}
                  href={`tel:${number.replace(/\s/g, '')}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[#054A8C]/10 px-4 py-3 hover:border-[#16734B]/40 hover:bg-[#E8F3ED]/60"
                >
                  <span className="font-mono text-base font-bold tracking-wide text-[#054A8C] sm:text-lg">
                    {number}
                  </span>
                  <PhoneCall
                    size={17}
                    className="shrink-0 text-[#16734B]"
                  />
                </a>
              ))}
            </div>

            <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#16734B]">
              <ShieldCheck size={16} />
              We&apos;re just a call away!
            </p>
          </div>

        </motion.div>

        <motion.div
          {...revealProps}
          transition={{
            duration: 0.5,
            delay: shouldReduceMotion ? 0 : 0.1,
            ease: 'easeOut',
          }}
          className="rounded-2xl border border-[#054A8C]/15 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="mb-6 space-y-2">
            <div className="flex items-center gap-2 text-[#16734B]">
              <MessageSquareText size={19} />
              <span className="text-xs font-bold uppercase tracking-[0.12em]">
                We&apos;d love to hear from you
              </span>
            </div>
            <h3 className="text-2xl font-bold text-[#0F2942]">Send Us a Message</h3>
            <p className="text-sm leading-6 text-[#3B5875]">
              Have something to share? Drop us a message and we&apos;ll get back to you.
            </p>
          </div>

          {successMessage && (
            <div
              role="status"
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-[#16734B]/25 bg-[#E8F3ED] p-3.5 text-sm text-[#16734B]"
            >
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {submissionError && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-[#FA6806]/40 bg-[#FA6806]/10 p-3.5 text-sm text-[#0F2942]"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#FA6806]" />
              <span>{submissionError}</span>
            </div>
          )}

          {Object.keys(fieldErrors).length > 0 && (
            <p role="alert" className="mb-4 text-sm font-medium text-[#B54708]">
              Please correct the highlighted fields.
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="contact-name" className="text-sm font-semibold text-[#0F2942]">
                  Full Name <span className="text-[#FA6806]">*</span>
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  maxLength={150}
                  value={values.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? 'contact-name-error' : undefined}
                  className={fieldClassName}
                />
                {fieldErrors.name && (
                  <p id="contact-name-error" className="text-xs text-[#B54708]">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-email" className="text-sm font-semibold text-[#0F2942]">
                  Email Address <span className="text-[#FA6806]">*</span>
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={values.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'contact-email-error' : undefined}
                  className={fieldClassName}
                />
                {fieldErrors.email && (
                  <p id="contact-email-error" className="text-xs text-[#B54708]">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-phone" className="text-sm font-semibold text-[#0F2942]">
                  Phone Number <span className="font-normal text-[#3B5875]">(Optional)</span>
                </label>
                <input
                  id="contact-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  maxLength={20}
                  placeholder="+91 98765 43210"
                  value={values.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  aria-invalid={Boolean(fieldErrors.phone)}
                  aria-describedby={fieldErrors.phone ? 'contact-phone-error' : undefined}
                  className={fieldClassName}
                />
                {fieldErrors.phone && (
                  <p id="contact-phone-error" className="text-xs text-[#B54708]">
                    {fieldErrors.phone}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-subject" className="text-sm font-semibold text-[#0F2942]">
                  Subject <span className="text-[#FA6806]">*</span>
                </label>
                <input
                  id="contact-subject"
                  name="subject"
                  type="text"
                  required
                  maxLength={200}
                  value={values.subject}
                  onChange={(event) => updateField('subject', event.target.value)}
                  aria-invalid={Boolean(fieldErrors.subject)}
                  aria-describedby={fieldErrors.subject ? 'contact-subject-error' : undefined}
                  className={fieldClassName}
                />
                {fieldErrors.subject && (
                  <p id="contact-subject-error" className="text-xs text-[#B54708]">
                    {fieldErrors.subject}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="contact-message" className="text-sm font-semibold text-[#0F2942]">
                Message <span className="text-[#FA6806]">*</span>
              </label>
              <textarea
                id="contact-message"
                name="message"
                required
                maxLength={5000}
                rows={5}
                value={values.message}
                onChange={(event) => updateField('message', event.target.value)}
                aria-invalid={Boolean(fieldErrors.message)}
                aria-describedby={fieldErrors.message ? 'contact-message-error' : undefined}
                className={`${fieldClassName} min-h-32 resize-y`}
              />
              {fieldErrors.message && (
                <p id="contact-message-error" className="text-xs text-[#B54708]">
                  {fieldErrors.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#054A8C] bg-[#FA6806] px-6 py-3.5 text-sm font-bold text-white hover:bg-[#E05A00] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={17} />
                  Send Message
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
