export interface ApprovedCompanyMember {
  email: string;
  name: string;
  roleLabel: string;
}

export const COMPANY_PORTAL_NAME = 'Admin of Scanurmed';
export const COMPANY_PORTAL_PASSCODE = '4679';

export const APPROVED_COMPANY_MEMBERS: readonly ApprovedCompanyMember[] = [
  {
    email: 'smrutisikha4679@gmail.com',
    name: 'Smruti Sikha Nag',
    roleLabel: 'Authorized Lead & Admin',
  },
  {
    email: 'avishekraul1@gmail.com',
    name: 'Abhishek Raul',
    roleLabel: 'Authorized Representative',
  },
  {
    email: 'alankritaprakash44@gmail.com',
    name: 'Alankrita',
    roleLabel: 'Authorized Representative',
  },
] as const;

export const APPROVED_COMPANY_EMAILS = [
  'alankritaprakash44@gmail.com',
  'avishekraul1@gmail.com',
  'smrutisikha4679@gmail.com',
] as const;

export const ADMIN_EMAIL = 'smrutisikha4679@gmail.com';

export function isApprovedCompanyEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return (APPROVED_COMPANY_EMAILS as readonly string[]).includes(normalized);
}

export function getApprovedCompanyMember(email?: string | null): ApprovedCompanyMember | undefined {
  if (!email) return undefined;
  const normalized = email.trim().toLowerCase();
  return APPROVED_COMPANY_MEMBERS.find((m) => m.email === normalized);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}
