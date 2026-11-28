import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CompanyRegistrationRequest, AppUser } from '../types';
import { saveUserProfile } from '../utils/userProfile';
import {
  Building2,
  CheckCircle2,
  Clock,
  FileCheck2,
  Loader2,
  Send,
  ShieldAlert,
} from 'lucide-react';

export const CompanyRegistrationForm: React.FC<{ user: AppUser | User }> = ({ user }) => {
  const [existingRequest, setExistingRequest] =
    useState<CompanyRegistrationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    companyName: '',
    email: user.email || '',
    phone: '',
    address: '',
    licenseType: '',
    licenseNumber: '',
    licenseDetails: '',
    contactPerson: user.displayName || '',
    notes: '',
  });

  useEffect(() => {
    async function loadExistingRequest() {
      setLoading(true);
      const path = `companyApplications/${user.uid}`;
      try {
        const snap = await getDoc(doc(db, 'companyApplications', user.uid));
        if (snap.exists()) {
          setExistingRequest({
            id: snap.id,
            ...snap.data(),
          } as CompanyRegistrationRequest);
        }
      } catch (err) {
        console.error(`Unable to load company request at ${path}:`, err);
        setErrorMsg('Unable to check your company registration status. Please retry.');
      } finally {
        setLoading(false);
      }
    }

    loadExistingRequest();
  }, [user.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (
      !formData.companyName.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.address.trim() ||
      !formData.licenseType.trim() ||
      !formData.licenseNumber.trim() ||
      !formData.licenseDetails.trim() ||
      !formData.contactPerson.trim()
    ) {
      setErrorMsg('Please complete all required company registration fields.');
      return;
    }

    setSubmitting(true);
    const path = `companyApplications/${user.uid}`;
    const application = {
      uid: user.uid,
      companyName: formData.companyName.trim().slice(0, 200),
      email: formData.email.trim().slice(0, 254),
      phone: formData.phone.trim().slice(0, 40),
      address: formData.address.trim().slice(0, 500),
      licenseType: formData.licenseType.trim().slice(0, 100),
      licenseNumber: formData.licenseNumber.trim().slice(0, 100),
      licenseDetails: formData.licenseDetails.trim().slice(0, 1000),
      contactPerson: formData.contactPerson.trim().slice(0, 150),
      notes: formData.notes.trim().slice(0, 1000),
      status: 'PENDING' as const,
    };

    try {
      await saveUserProfile(user);
      await setDoc(doc(db, 'companyApplications', user.uid), {
        ...application,
        submittedAt: serverTimestamp(),
      });
      setExistingRequest({
        id: user.uid,
        ...application,
        submittedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error(`Unable to submit company request at ${path}:`, err);
      setErrorMsg('Your company registration could not be submitted. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-[#054A8C] rounded-2xl p-10 flex items-center justify-center gap-3 text-[#054A8C]">
        <Loader2 className="animate-spin text-[#FA6806]" size={22} />
        <span className="text-sm font-semibold">Checking registration status...</span>
      </div>
    );
  }

  if (existingRequest) {
    const statusLabel =
      existingRequest.status === 'APPROVED'
        ? 'Approved'
        : existingRequest.status === 'REJECTED'
        ? 'Rejected'
        : 'Pending Review';

    return (
      <div className="max-w-2xl mx-auto bg-white border border-[#054A8C] rounded-2xl p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#7BBCE5]/25 border border-[#054A8C] flex items-center justify-center text-[#054A8C] shrink-0">
            {existingRequest.status === 'APPROVED' ? (
              <CheckCircle2 size={24} className="text-[#054A8C]" />
            ) : existingRequest.status === 'REJECTED' ? (
              <ShieldAlert size={24} className="text-[#FA6806]" />
            ) : (
              <Clock size={24} className="text-[#FA6806]" />
            )}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-[#0F2942]">
              Company Registration {statusLabel}
            </h1>
            <p className="text-sm text-[#3B5875]">
              Signed in as <span className="font-mono">{user.email}</span>.{' '}
              {existingRequest.status === 'APPROVED'
                ? 'Your company access is approved. Sign out and sign in again to open the company dashboard.'
                : existingRequest.status === 'REJECTED'
                ? 'This request was not approved. Contact the Scanurmed team if you believe this decision needs review.'
                : 'Your application is being reviewed. You can return here to check its status.'}
            </p>
          </div>
        </div>

        <div className="bg-[#F7FAFC] border border-[#054A8C] rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs font-semibold text-[#3B5875]">Company Name</div>
            <div className="font-bold text-[#0F2942]">{existingRequest.companyName}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-[#3B5875]">License Number</div>
            <div className="font-mono font-bold text-[#054A8C]">
              {existingRequest.licenseNumber}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-[#3B5875]">License Type</div>
            <div className="font-semibold text-[#0F2942]">{existingRequest.licenseType}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-[#3B5875]">Address</div>
            <div className="font-semibold text-[#0F2942]">{existingRequest.address}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-[#3B5875]">Contact Person</div>
            <div className="font-semibold text-[#0F2942]">{existingRequest.contactPerson}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-[#3B5875]">Application Status</div>
            <div className="font-bold text-[#FA6806]">{statusLabel}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs font-semibold text-[#3B5875]">Submitted</div>
            <div className="font-semibold text-[#0F2942]">
              {formatDate(existingRequest.submittedAt)}
            </div>
          </div>
          {existingRequest.reviewedAt && (
            <div className="sm:col-span-2">
              <div className="text-xs font-semibold text-[#3B5875]">Decision Recorded</div>
              <div className="font-semibold text-[#0F2942]">
                {formatDate(existingRequest.reviewedAt)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-[#7BBCE5]/20 border border-[#054A8C] rounded-2xl p-6 flex items-start gap-4">
        <Building2 size={24} className="text-[#054A8C] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[#0F2942]">Company Registration Required</h1>
          <p className="text-sm text-[#0F2942] leading-relaxed">
            Your account (<span className="font-mono">{user.email}</span>) does not yet have company access. Submit a pharmaceutical company application for review.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#054A8C] rounded-2xl p-6 md:p-8 space-y-6"
      >
        <div className="flex items-center gap-2.5 border-b border-[#054A8C]/20 pb-4">
          <FileCheck2 size={20} className="text-[#FA6806]" />
          <h2 className="text-xl font-bold text-[#0F2942]">Register Pharmaceutical Company</h2>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-[#FA6806]/10 border border-[#FA6806] text-xs font-semibold text-[#0F2942]">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#054A8C]">
              Company Legal Name <span className="text-[#FA6806]">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={200}
              placeholder="e.g. MedCore Biologics Pvt. Ltd."
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-4 py-3 bg-[#F7FAFC] border border-[#054A8C] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FA6806]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#054A8C]">
              Official Business Email <span className="text-[#FA6806]">*</span>
            </label>
            <input
              type="email"
              required
              maxLength={254}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-[#F7FAFC] border border-[#054A8C] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FA6806]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#054A8C]">
              License Type <span className="text-[#FA6806]">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              placeholder="Manufacturing, wholesale, etc."
              value={formData.licenseType}
              onChange={(e) => setFormData({ ...formData, licenseType: e.target.value })}
              className="w-full px-4 py-3 bg-[#F7FAFC] border border-[#054A8C] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FA6806]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#054A8C]">
              Pharma / Drug License Number <span className="text-[#FA6806]">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              placeholder="e.g. DL-20B-44821"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              className="w-full px-4 py-3 bg-[#F7FAFC] border border-[#054A8C] rounded-xl font-mono text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FA6806]"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-[#054A8C]">
              Registered Business Address <span className="text-[#FA6806]">*</span>
            </label>
            <textarea
              required
              maxLength={500}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 bg-[#F7FAFC] border border-[#054A8C] rounded-xl text-sm h-20 resize-y focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FA6806]"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-[#054A8C]">
              License Details <span className="text-[#FA6806]">*</span>
            </label>
            <textarea
              required
              maxLength={1000}
              placeholder="Issuing authority, jurisdiction, validity period, or other license details"
              value={formData.licenseDetails}
              onChange={(e) => setFormData({ ...formData, licenseDetails: e.target.value })}
              className="w-full px-4 py-3 bg-[#F7FAFC] border border-[#054A8C] rounded-xl text-sm h-24 resize-y focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FA6806]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#054A8C]">
              Contact Person <span className="text-[#FA6806]">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={150}
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              className="w-full px-4 py-3 bg-[#F7FAFC] border border-[#054A8C] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FA6806]"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-[#054A8C]">
              Contact Phone <span className="text-[#FA6806]">*</span>
            </label>
            <input
              type="tel"
              required
              maxLength={40}
              placeholder="e.g. +91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 bg-[#F7FAFC] border border-[#054A8C] rounded-xl font-mono text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FA6806]"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-[#054A8C]">
              Verification Notes (Optional)
            </label>
            <textarea
              maxLength={1000}
              placeholder="Products manufactured, regulatory region, or supporting details..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 bg-[#F7FAFC] border border-[#054A8C] rounded-xl text-sm h-24 resize-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FA6806]"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#FA6806] text-white border border-[#054A8C] px-7 py-3.5 rounded-xl font-semibold hover:bg-[#E05A00] transition-colors inline-flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            <span>Submit Company Registration</span>
          </button>
        </div>
      </form>
    </div>
  );
};

function formatDate(value: CompanyRegistrationRequest['submittedAt']): string {
  const date = typeof value === 'string' ? new Date(value) : value.toDate();
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString();
}
