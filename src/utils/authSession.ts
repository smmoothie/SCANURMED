import { AppUser, Company, CompanyRegistrationRequest, Medicine, ScanLog } from '../types';
import { AUTHORIZED_MEDICINES } from '../data/authorizedMedicines';

const LOCAL_AUTH_USER_KEY = 'scanurmed_local_auth_user';
const LOCAL_PROFILE_PREFIX = 'scanurmed_profile_';
const LOCAL_MEDICINES_PREFIX = 'scanurmed_medicines_';
const LOCAL_SCANS_PREFIX = 'scanurmed_scans_';
const LOCAL_REQUESTS_KEY = 'scanurmed_requests';

type AuthListener = (user: AppUser | null) => void;
const listeners = new Set<AuthListener>();

export function subscribeToAuthChanges(callback: AuthListener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function notifyAuthChanged(user: AppUser | null): void {
  listeners.forEach((cb) => {
    try {
      cb(user);
    } catch (err) {
      console.warn('Auth listener error:', err);
    }
  });
}

export function getLocalAuthUser(): AppUser | null {
  try {
    const raw = sessionStorage.getItem(LOCAL_AUTH_USER_KEY) || localStorage.getItem(LOCAL_AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

export function setLocalAuthUser(user: AppUser): void {
  try {
    const serialized = JSON.stringify(user);
    sessionStorage.setItem(LOCAL_AUTH_USER_KEY, serialized);
    localStorage.setItem(LOCAL_AUTH_USER_KEY, serialized);
  } catch (e) {
    console.warn('Failed to save local auth user:', e);
  }
  notifyAuthChanged(user);
}

export function clearLocalAuthUser(): void {
  try {
    sessionStorage.removeItem(LOCAL_AUTH_USER_KEY);
    localStorage.removeItem(LOCAL_AUTH_USER_KEY);
  } catch (e) {
    console.warn('Failed to clear local auth user:', e);
  }
  notifyAuthChanged(null);
}

export function getLocalCompanyProfile(uid: string): Company | null {
  try {
    const raw = localStorage.getItem(`${LOCAL_PROFILE_PREFIX}${uid}`);
    if (raw) return JSON.parse(raw) as Company;
  } catch {}
  return null;
}

export function saveLocalCompanyProfile(uid: string, profile: Company): void {
  try {
    localStorage.setItem(`${LOCAL_PROFILE_PREFIX}${uid}`, JSON.stringify(profile));
  } catch {}
}

export function getLocalMedicines(uid: string): Medicine[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_MEDICINES_PREFIX}${uid}`);
    if (raw) {
      const parsed = JSON.parse(raw) as Medicine[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  // Default to preloaded authorized medicines if local storage is empty
  return AUTHORIZED_MEDICINES.map((m) => ({ ...m, companyId: uid }));
}

export function saveLocalMedicines(uid: string, list: Medicine[]): void {
  try {
    localStorage.setItem(`${LOCAL_MEDICINES_PREFIX}${uid}`, JSON.stringify(list));
  } catch {}
}

export function getLocalScanLogs(uid: string): ScanLog[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_SCANS_PREFIX}${uid}`);
    if (raw) return JSON.parse(raw) as ScanLog[];
  } catch {}
  return [];
}

export function saveLocalScanLogs(uid: string, list: ScanLog[]): void {
  try {
    localStorage.setItem(`${LOCAL_SCANS_PREFIX}${uid}`, JSON.stringify(list));
  } catch {}
}

export function getLocalRequests(): CompanyRegistrationRequest[] {
  try {
    const raw = localStorage.getItem(LOCAL_REQUESTS_KEY);
    if (raw) return JSON.parse(raw) as CompanyRegistrationRequest[];
  } catch {}
  return [];
}

export function saveLocalRequests(list: CompanyRegistrationRequest[]): void {
  try {
    localStorage.setItem(LOCAL_REQUESTS_KEY, JSON.stringify(list));
  } catch {}
}
