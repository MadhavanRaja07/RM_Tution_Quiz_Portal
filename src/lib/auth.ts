import { cookies } from 'next/headers';
import { getSettings } from './db';

const ADMIN_COOKIE_NAME = 'admin_session_token';

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const settings = getSettings();
  
  if (!token) return false;
  
  // Simple token check matching hash/password or admin token
  const expectedToken = Buffer.from(settings.adminPasswordHash + '_session_secret').toString('base64');
  return token === expectedToken;
}

export function createAdminSessionToken(password: string): string | null {
  const settings = getSettings();
  if (password === settings.adminPasswordHash) {
    return Buffer.from(settings.adminPasswordHash + '_session_secret').toString('base64');
  }
  return null;
}

export { ADMIN_COOKIE_NAME };
