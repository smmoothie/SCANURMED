import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#054A8C] px-5 py-3.5 text-sm font-semibold text-[#054A8C] hover:bg-[#7BBCE5]/25 transition-colors whitespace-nowrap shrink-0"
      >
        <Download size={16} className="text-[#FA6806]" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#054A8C] px-5 py-3.5 text-sm font-semibold text-[#054A8C] hover:bg-[#7BBCE5]/25 transition-colors whitespace-nowrap shrink-0"
        >
          <Smartphone size={16} className="text-[#FA6806]" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F2942]/60 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white border border-[#054A8C] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#0F2942]">Install Scanurmed on iOS</h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 rounded-lg border border-[#054A8C] text-[#054A8C] hover:bg-[#7BBCE5]/20"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-sm text-[#3B5875] leading-relaxed">
                1. Tap the <strong>Share</strong> button in Safari&apos;s toolbar.
                <br />
                2. Scroll down and select <strong>Add to Home Screen</strong> for offline QR scanning.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-[#FA6806] text-white border border-[#054A8C] py-2.5 text-sm font-semibold hover:bg-[#E05A00] transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
