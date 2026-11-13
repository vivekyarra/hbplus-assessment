export const RESTRICTED = 'Access restricted. Please login using your official domain email.';

export function matchesDomain(email: string, domain: string) {
  return /^[^@\s]+@[^@\s]+$/u.test(email) &&
    email.split('@')[1].toLowerCase() === domain.toLowerCase();
}

export function callbackParams(url: URL) {
  const fragment = new URLSearchParams(url.hash.slice(1));
  const read = (key: string) => url.searchParams.get(key) ?? fragment.get(key);
  return { code: read('code'), error: read('error'), description: read('error_description') };
}

export function callbackError(code: string | null, description: string | null) {
  if (description?.includes(RESTRICTED)) return RESTRICTED;
  if (code === 'access_denied') return 'Google sign-in was cancelled. Please try again.';
  return 'Google sign-in could not be completed. Please try again.';
}
