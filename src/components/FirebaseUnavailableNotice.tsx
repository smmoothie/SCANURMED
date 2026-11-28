import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export function FirebaseUnavailableNotice({ feature }: { feature: string }) {
  return (
    <div
      role="status"
      className="rounded-xl border border-[#FA6806]/40 bg-[#FA6806]/10 p-4 text-sm text-[#0F2942]"
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#FA6806]" />
        <div className="space-y-2">
          <p>
            {feature} is unavailable because Firebase is not configured for this deployment.
            Add the Firebase <code>VITE_FIREBASE_*</code> environment variables in Vercel and redeploy.
          </p>
          <Link to="/" className="font-semibold text-[#054A8C] underline">
            Return to the website
          </Link>
        </div>
      </div>
    </div>
  );
}
