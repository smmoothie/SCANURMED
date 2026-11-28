import type { User } from 'firebase/auth';
import type { AppUser } from '../types';

export async function hasAdminClaim(user: AppUser | User | null): Promise<boolean> {
  if (!user || !('getIdTokenResult' in user) || typeof user.getIdTokenResult !== 'function') {
    return false;
  }

  const tokenResult = await user.getIdTokenResult();
  return tokenResult.claims.admin === true;
}
