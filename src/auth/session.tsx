import { type Session } from '@supabase/supabase-js';
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { allowedDomain, client, fetchProfile, type WorkspaceProfile } from './client';
import { finishWebCallback, startGoogle } from './google';
import { matchesDomain, RESTRICTED } from './policy';

type AuthState = {
  profile: WorkspaceProfile | null;
  loading: boolean;
  busy: boolean;
  error: string | null;
  configured: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Auth = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [profile, setProfile] = useState<WorkspaceProfile | null>(null);
  const [verifiedFor, setVerifiedFor] = useState<string | null>(null);
  const [callbackPending, setCallbackPending] = useState(
    () => Platform.OS === 'web' && location.pathname === '/auth/callback',
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const actionPending = useRef(false);
  const callback = useRef<Promise<void> | null>(null);
  const token = session?.access_token;

  useEffect(() => {
    if (!client) {
      setSession(null);
      setCallbackPending(false);
      return;
    }
    const { data } = client.auth.onAuthStateChange((_event, next) => setSession(next));
    const appState = Platform.OS !== 'web' ? AppState.addEventListener('change', (state) => {
      if (state === 'active') void client!.auth.startAutoRefresh();
      else void client!.auth.stopAutoRefresh();
    }) : undefined;
    if (Platform.OS !== 'web' && AppState.currentState === 'active') {
      void client.auth.startAutoRefresh();
    }
    return () => {
      data.subscription.unsubscribe();
      appState?.remove();
      if (Platform.OS !== 'web') void client?.auth.stopAutoRefresh();
    };
  }, []);

  useEffect(() => {
    if (!client) return;
    let current = true;
    callback.current ??= finishWebCallback();
    void callback.current.catch((failure: unknown) => {
      if (current) setError(failure instanceof Error ? failure.message : 'Sign-in failed. Please try again.');
    }).finally(() => {
      if (current) setCallbackPending(false);
    });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    if (!session || !token) {
      setProfile(null);
      setVerifiedFor(null);
      return;
    }

    const request = new AbortController();
    const timeout = setTimeout(() => request.abort('timeout'), 12000);
    const authorize = async () => {
      try {
        const result = await fetchProfile(session, request.signal);
        if (!matchesDomain(result.email, allowedDomain)) throw new Error('restricted');
        if (request.signal.aborted) return;
        setProfile(result);
        setVerifiedFor(token);
        setError(null);
      } catch (failure) {
        if (request.signal.aborted && request.signal.reason !== 'timeout') return;
        setProfile(null);
        setVerifiedFor(null);
        const restricted = failure instanceof Error && failure.message === 'restricted';
        setError(restricted ? RESTRICTED : 'We could not verify access. Please sign in again.');
        setSession((active) => active?.access_token === token ? null : active);
        void client!.auth.signOut({ scope: 'local' }).catch(() => {});
      } finally {
        clearTimeout(timeout);
      }
    };
    void authorize();
    return () => {
      clearTimeout(timeout);
      request.abort();
    };
  }, [session, token]);

  async function signIn() {
    if (!client || actionPending.current) return;
    actionPending.current = true;
    setBusy(true);
    setError(null);
    try {
      if (!(await startGoogle())) setError('Google sign-in was cancelled. Please try again.');
    } catch (failure) {
      setError(failure instanceof Error && failure.message === RESTRICTED
        ? RESTRICTED
        : 'Google sign-in is unavailable right now. Please try again.');
    } finally {
      actionPending.current = false;
      setBusy(false);
    }
  }

  async function signOut() {
    if (!client || actionPending.current) return;
    actionPending.current = true;
    setBusy(true);
    setError(null);
    try {
      const { error: failure } = await client.auth.signOut({ scope: 'local' });
      if (failure) throw failure;
      setSession(null);
    } catch {
      setError('We could not sign you out. Please try again.');
    } finally {
      actionPending.current = false;
      setBusy(false);
    }
  }

  return (
    <Auth.Provider value={{
      profile: token && token === verifiedFor ? profile : null,
      loading: callbackPending || session === undefined || Boolean(token && token !== verifiedFor),
      busy, error, configured: Boolean(client), signIn, signOut,
    }}>
      {children}
    </Auth.Provider>
  );
}

export function useAuth() {
  const state = useContext(Auth);
  if (!state) throw new Error('AuthProvider is required.');
  return state;
}
