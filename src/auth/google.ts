import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { client, publishableKey, serviceUrl } from './client';
import { callbackError, callbackParams } from './policy';

const verifierKey = 'hbplus.oauth.verifier';
const nativeCallback = 'fit.hbplus.workspace://auth/callback';

export async function finishWebCallback() {
  if (Platform.OS !== 'web' || location.pathname !== '/auth/callback') return;
  const url = new URL(location.href);
  const verifier = sessionStorage.getItem(verifierKey);
  sessionStorage.removeItem(verifierKey);
  await complete(url, verifier);
}

async function complete(url: URL, verifier: string | null) {
  const { code, error, description } = callbackParams(url);
  if (error) throw new Error(callbackError(error, description));
  if (!code || !verifier) throw new Error('Your sign-in link expired. Please start again.');

  const response = await fetch(`${serviceUrl}/auth/v1/token?grant_type=pkce`, {
    method: 'POST',
    headers: { apikey: publishableKey!, 'Content-Type': 'application/json' },
    body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(callbackError(body.code ?? null, body.msg ?? body.message ?? null));
  // Persist only Supabase credentials. Google provider tokens are never used.
  const { error: sessionError } = await client!.auth.setSession({
    access_token: body.access_token,
    refresh_token: body.refresh_token,
  });
  if (sessionError) throw new Error('Your session could not be saved. Please try again.');
}

export async function startGoogle() {
  const settings = await fetch(`${serviceUrl}/auth/v1/settings`, {
    headers: { apikey: publishableKey! },
  });
  if (!settings.ok || (await settings.json()).external?.google !== true) {
    throw new Error('Google sign-in is unavailable right now. Please try again.');
  }

  const web = Platform.OS === 'web';
  const redirect = web ? `${location.origin}/auth/callback` : nativeCallback;
  const bytes = await Crypto.getRandomBytesAsync(32);
  const verifier = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, {
    encoding: Crypto.CryptoEncoding.BASE64,
  });
  const url = new URL(`${serviceUrl}/auth/v1/authorize`);
  const params = {
    provider: 'google',
    redirect_to: redirect,
    code_challenge: digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
    code_challenge_method: 's256',
    prompt: 'select_account',
  };
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  if (web) {
    sessionStorage.setItem(verifierKey, verifier);
    location.assign(url.toString());
    return true;
  }

  const result = await WebBrowser.openAuthSessionAsync(url.toString(), redirect);
  if (result.type !== 'success') return false;
  const callback = new URL(result.url);
  if (`${callback.protocol}//${callback.host}${callback.pathname}` !== nativeCallback) {
    throw new Error('Google returned an unexpected sign-in link. Please try again.');
  }
  await complete(callback, verifier);
  return true;
}
