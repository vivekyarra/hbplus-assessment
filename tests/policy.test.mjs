import assert from 'node:assert/strict';
import test from 'node:test';
import { callbackError, callbackParams, matchesDomain, RESTRICTED } from '../src/auth/policy.ts';

test('accepts an exact domain case-insensitively', () => {
  assert.equal(matchesDomain('example@hbplus.fit', 'hbplus.fit'), true);
  assert.equal(matchesDomain('Example@HBPLUS.FIT', 'hbplus.fit'), true);
});

for (const email of ['example@gmail.com', 'example@staff.hbplus.fit', 'example@hbplus.fit.evil.test', 'example@@hbplus.fit', '@hbplus.fit', 'a@hbplus.fit ', 'a@hbplus.fit\n']) {
  test(`denies ${JSON.stringify(email)}`, () => {
    assert.equal(matchesDomain(email, 'hbplus.fit'), false);
  });
}

test('reads Supabase callback query and fragment errors', () => {
  const url = new URL('https://example.test/auth/callback?code=abc#error=server_error&error_description=' + encodeURIComponent(RESTRICTED));
  const { code, error, description } = callbackParams(url);
  assert.equal(code, 'abc');
  assert.equal(callbackError(error, description), RESTRICTED);
});

test('never displays arbitrary callback error text', () => {
  assert.equal(callbackError('server_error', 'Private provider details'), 'Google sign-in could not be completed. Please try again.');
});
