import 'react-native-url-polyfill/auto';
import { createClient, type Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const allowedDomain = (process.env.EXPO_PUBLIC_ALLOWED_DOMAIN || 'hbplus.fit').toLowerCase();
export const serviceUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
export const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const storage = Platform.OS === 'web' ? {
  getItem: (key: string) => globalThis.sessionStorage.getItem(key),
  setItem: (key: string, value: string) => globalThis.sessionStorage.setItem(key, value),
  removeItem: (key: string) => globalThis.sessionStorage.removeItem(key),
} : {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};

const ready = serviceUrl?.startsWith('https://') && publishableKey?.startsWith('sb_publishable_');
export const client = ready ? createClient(serviceUrl!, publishableKey!, {
  auth: { storage, flowType: 'pkce', detectSessionInUrl: false, persistSession: true },
}) : null;

export type WorkspaceProfile = { email: string; role: 'admin' | 'user'; created_at: string };

// The request is bound to this specific session, even if another auth event fires meanwhile.
export async function fetchProfile(session: Session, signal: AbortSignal): Promise<WorkspaceProfile> {
  const response = await fetch(`${serviceUrl}/rest/v1/rpc/workspace_profile`, {
    method: 'POST',
    headers: {
      apikey: publishableKey!,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
    signal,
  });
  if (!response.ok) throw new Error(response.status === 403 ? 'restricted' : 'profile_unavailable');
  const rows: WorkspaceProfile[] = await response.json();
  if (rows.length !== 1) throw new Error('profile_unavailable');
  return rows[0];
}
