import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { User } from 'firebase/auth';
import { AppUser } from '../types';
import {
  Scan,
  ShieldAlert,
  Info,
  ArrowLeft,
  Upload,
  Loader2,
  Keyboard,
  Search,
  X,
  CheckCircle2,
  RefreshCcw,
  WifiOff,
  Lock,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { isAuthorizedBarcode, normalizeScannedCode } from '../data/authorizedMedicines';

const QR_ENGINE_CONFIG = {
  verbose: false,
  formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
  useBarCodeDetectorIfSupported: true,
  experimentalFeatures: {
    useBarCodeDetectorIfSupported: true,
  },
};

export default function ScannerPage({ user }: { user?: AppUser | User | null }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isOnline = useOnlineStatus();

  /* ── Auth guard ── */
  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-[#054A8C] p-8 text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-xl bg-[#FA6806]/10 border border-[#FA6806] flex items-center justify-center">
            <Lock size={30} className="text-[#FA6806]" />
          </div>
          <h2 className="text-xl font-bold text-[#0F2942]">Sign in to scan</h2>
          <p className="text-sm text-[#3B5875] leading-relaxed">
            You are not logged in. Please sign in to continue.
          </p>
          <Link
            to="/login"
            state={{ from: '/scan' }}
            className="inline-flex items-center gap-2 bg-[#FA6806] text-white font-semibold px-6 py-3 rounded-xl border border-[#054A8C] w-full justify-center"
          >
            Sign in to continue
          </Link>
          <Link
            to="/signup"
            className="block text-sm text-[#054A8C] font-semibold underline"
          >
            Create a free account
          </Link>
        </div>
      </div>
    );
  }
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraUnavailable, setCameraUnavailable] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [manualId, setManualId] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isNavigatingRef = useRef(false);

  const handleDecodedCode = async (rawText: string) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    const scannedAt = new Date().toISOString();

    const code = normalizeScannedCode(rawText);
    if (isAuthorizedBarcode(code)) {
      setScanSuccess(true);
    }

    await stopScanner();
    navigate(`/result/${encodeURIComponent(code)}`, {
      state: { scannedAt },
    });
  };

  const startScanner = async (mode: 'environment' | 'user' = facingMode) => {
    if (scannerRef.current?.isScanning) {
      await stopScanner();
    }

    try {
      const element = document.getElementById('reader');
      if (!element) return;

      const html5QrCode = new Html5Qrcode('reader', QR_ENGINE_CONFIG);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 60,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdge * 0.8);
          return {
            width: qrboxSize,
            height: qrboxSize,
          };
        },
        aspectRatio: 1.0,
        disableFlip: mode === 'user',
        videoConstraints: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      await html5QrCode.start(
        { facingMode: mode },
        config,
        (decodedText) => {
          handleDecodedCode(decodedText);
        },
        () => {
          // Ignore per-frame miss callbacks
        }
      );
      setCameraUnavailable(false);
      setIsCameraActive(true);
    } catch (err) {
      console.error('Unable to start scanner:', err);
      setIsCameraActive(false);
      setCameraUnavailable(true);
    }
  };

  const toggleCamera = async () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    await startScanner(newMode);
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setIsCameraActive(false);
      } catch (err) {
        console.error('Unable to stop scanner:', err);
      }
    }
  };

  useEffect(() => {
    if (!showManual) {
      isNavigatingRef.current = false;
      startScanner();
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [showManual]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      let decodedText: string | null = null;

      type NativeBarcodeDetector = {
        detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
      };
      const DetectorCtor = (
        window as unknown as {
          BarcodeDetector?: new (opts?: { formats?: string[] }) => NativeBarcodeDetector;
        }
      ).BarcodeDetector;

      if (DetectorCtor && typeof createImageBitmap === 'function') {
        try {
          const bitmap = await createImageBitmap(file);
          const detector = new DetectorCtor({ formats: ['qr_code'] });
          const results = await detector.detect(bitmap);
          bitmap.close();
          if (results.length > 0 && results[0].rawValue) {
            decodedText = results[0].rawValue;
          }
        } catch {
          // Fall back to html5-qrcode decoder below
        }
      }

      if (!decodedText) {
        const html5QrCode = new Html5Qrcode('reader-hidden', QR_ENGINE_CONFIG);
        decodedText = await html5QrCode.scanFile(file, false);
      }

      await handleDecodedCode(decodedText);
    } catch (err) {
      console.error('Error scanning file:', err);
      setUploadError(t('upload_error'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim()) {
      const code = normalizeScannedCode(manualId);
      navigate(`/result/${encodeURIComponent(code)}`, {
        state: { scannedAt: new Date().toISOString() },
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-white border border-[#054A8C] text-[#054A8C] hover:bg-[#7BBCE5]/20 transition-colors"
            aria-label={t('back')}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[#0F2942]">{t('scanner')}</h1>
            <p className="text-sm text-[#3B5875]">{t('scan_instruction')}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowManual(!showManual)}
          className={`px-4 py-2.5 rounded-xl border border-[#054A8C] text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
            showManual
              ? 'bg-[#FA6806] text-white'
              : 'bg-white text-[#054A8C] hover:bg-[#7BBCE5]/20'
          }`}
        >
          {showManual ? <X size={18} /> : <Keyboard size={18} />}
          <span className="hidden sm:inline">{showManual ? t('scanner') : t('manual_entry')}</span>
        </button>
      </div>

      {!isOnline && (
        <div className="flex items-start gap-3 p-4 bg-white border-2 border-[#FA6806] rounded-xl text-xs text-[#0F2942]">
          <WifiOff size={16} className="text-[#FA6806] shrink-0 mt-0.5" />
          <span>
            <strong>Offline Mode Active:</strong> QR camera scanning, image decoding, and verification of the 20 authorized medicine labels work offline. Live scan analytics will sync once reconnected.
          </span>
        </div>
      )}

      {showManual ? (
        <div className="bg-white p-8 md:p-10 rounded-2xl border border-[#054A8C] text-center space-y-6">
          <div className="bg-[#7BBCE5]/25 border border-[#054A8C] w-16 h-16 rounded-xl flex items-center justify-center mx-auto text-[#054A8C]">
            <Keyboard size={32} strokeWidth={1.75} />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-[#0F2942]">{t('manual_entry')}</h2>
            <p className="text-sm text-[#3B5875]">{t('enter_code_tip')}</p>
          </div>

          <form onSubmit={handleManualSubmit} className="max-w-sm mx-auto space-y-4">
            <input
              type="text"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="e.g. 8901212121212"
              className="w-full px-5 py-3.5 rounded-xl border border-[#054A8C] bg-[#F7FAFC] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FA6806] font-mono tabular-nums text-center text-lg tracking-wider"
              autoFocus
            />
            <button
              type="submit"
              disabled={!manualId.trim()}
              className="w-full bg-[#FA6806] text-white border border-[#054A8C] py-3.5 rounded-xl font-semibold hover:bg-[#E05A00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Search size={18} />
              <span>{t('verify_code')}</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white p-6 md:p-10 rounded-2xl border border-[#054A8C] space-y-8">
          <div className="relative rounded-xl overflow-hidden border-2 border-[#054A8C] bg-[#0F2942] aspect-square">
            <div id="reader" className="w-full h-full" />

            {isCameraActive && !scanSuccess && (
              <>
                <button
                  type="button"
                  onClick={toggleCamera}
                  className="absolute top-4 right-4 p-2.5 bg-white text-[#054A8C] rounded-lg border border-[#054A8C] hover:bg-[#7BBCE5] transition-colors z-30"
                  title="Switch Camera"
                >
                  <RefreshCcw size={18} />
                </button>

                {/* Crisp Gallery Blue + Orange Reticle */}
                <div className="absolute inset-0 pointer-events-none z-20">
                  <div className="absolute top-10 left-10 w-12 h-12 border-t-4 border-l-4 border-[#FA6806] rounded-tl-lg" />
                  <div className="absolute top-10 right-10 w-12 h-12 border-t-4 border-r-4 border-[#FA6806] rounded-tr-lg" />
                  <div className="absolute bottom-10 left-10 w-12 h-12 border-b-4 border-l-4 border-[#FA6806] rounded-bl-lg" />
                  <div className="absolute bottom-10 right-10 w-12 h-12 border-b-4 border-r-4 border-[#FA6806] rounded-br-lg" />
                </div>
              </>
            )}

            {scanSuccess && (
              <div className="absolute inset-0 bg-[#054A8C] flex flex-col items-center justify-center text-white z-40 p-6 text-center">
                <div className="bg-[#FA6806] text-white p-4 rounded-xl border border-white">
                  <CheckCircle2 size={48} />
                </div>
                <p className="mt-4 text-xl font-bold">{t('scan_success')}</p>
              </div>
            )}

            {!isCameraActive && !scanSuccess && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0F2942] text-white gap-4 z-20 p-6 text-center">
                {cameraUnavailable ? (
                  <>
                    <ShieldAlert size={40} className="text-[#FA6806]" />
                    <div className="space-y-1">
                      <p className="font-bold text-lg">Camera Preview Unavailable</p>
                      <p className="text-sm text-[#7BBCE5]">
                        Upload a QR label image below or enter the 13-digit label code manually.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Loader2 className="animate-spin text-[#FA6806]" size={40} />
                    <div className="space-y-1">
                      <p className="font-bold text-lg">{t('initializing_camera')}</p>
                      <p className="text-xs text-[#7BBCE5]">{t('allow_camera_access')}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div id="reader-hidden" className="hidden" />

          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || scanSuccess}
              className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl border border-[#054A8C] bg-[#7BBCE5] text-[#054A8C] hover:bg-[#7BBCE5]/80 transition-colors font-semibold text-sm disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
              <span>{isUploading ? 'Decoding QR Image...' : t('upload_qr')}</span>
            </button>

            {uploadError && (
              <p className="text-[#FA6806] text-xs font-medium text-center bg-[#FA6806]/10 px-4 py-2.5 rounded-lg border border-[#FA6806]">
                {uploadError}
              </p>
            )}
          </div>

          <div className="flex items-start gap-3 p-4 bg-[#F7FAFC] rounded-xl border border-[#054A8C]">
            <Info className="text-[#054A8C] shrink-0 mt-0.5" size={18} />
            <p className="text-[#0F2942] text-sm leading-relaxed">{t('scan_tip')}</p>
          </div>

          <div className="pt-4 border-t border-[#054A8C]/25 space-y-3">
            <p className="text-xs font-semibold text-[#054A8C] text-center">
              Quick-Verify Authorized Labels
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {[
                { code: '8901212121212', label: 'Cough Syrup DX' },
                { code: '8901414141414', label: 'Digene Tablets' },
                { code: '8903839404142', label: 'Ecosprin 75mg' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.code}
                  onClick={() => {
                    setManualId(item.code);
                    setShowManual(true);
                  }}
                  className="px-3.5 py-2 bg-[#F7FAFC] border border-[#054A8C] rounded-lg text-xs font-mono tabular-nums text-[#054A8C] hover:bg-[#FA6806] hover:text-white transition-colors"
                >
                  {item.label} · {item.code}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
