# HB+ Workspace

HB+ Workspace is a React Native app for Android, iOS, and the browser. It uses Expo Router, React Native for Web, Google OAuth 2.0, and Supabase Auth and Postgres. Workspace access requires a verified Google identity with an exact `hbplus.fit` email domain.

**Web deployment** · [hbplus-assessment.vercel.app](https://hbplus-assessment.vercel.app)

## Run locally

Use Node.js 24. Android builds require Android Studio, an Android SDK, a JDK, and a running emulator. iOS builds require macOS and Xcode.

```sh
npm ci
cp .env.example .env.local
npm run web
```

Fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` with the dedicated Supabase project's public configuration. `EXPO_PUBLIC_ALLOWED_DOMAIN` controls the displayed domain and the client's secondary check. Keep it consistent with the server policy. Expo embeds `EXPO_PUBLIC_*` values in the bundle.

Run `npm run android` or `npm run ios` to build a development app and launch it on the selected emulator or simulator. Use the development app for OAuth so its callback scheme is registered. The Expo web server runs on port 8081 by default. For Windows PowerShell, use `Copy-Item .env.example .env.local` in place of `cp` if needed.

## Configure Google and Supabase

1. Create a dedicated Supabase project. Link it with `supabase link --project-ref YOUR_REF`, then apply the migration with `supabase db push`.
2. Set the Supabase Auth Site URL to your production origin. Add exact redirect URLs for each deployment, `http://localhost:8081/auth/callback`, and `fit.hbplus.workspace://auth/callback`. The redirect list in `supabase/config.toml` shows the expected format.
3. In Supabase Auth Hooks, enable **Before User Created** with `private.before_user_created` and **Customize Access Token** with `private.before_token_issued`. Disable email, phone, anonymous and other sign-in providers. Keep new user registration enabled for Google. Use a 900-second access-token lifetime.
4. In Google Auth Platform, set up the consent screen and create a **Web application** OAuth client. Add `https://YOUR_REF.supabase.co/auth/v1/callback` as the authorized redirect URI. A single client serves web and mobile because Google redirects to Supabase first.
5. Enable Google in Supabase Auth and enter the Google client ID and secret in the Supabase dashboard. Keep the Google secret and Supabase service role key out of the app, build variables, and Git. An External app in testing mode needs each test account on Google's test-user list. Publish the OAuth app for evaluator accounts to reach the application policy without being on that list.

[Supabase Google provider setup](https://supabase.com/docs/guides/auth/social-sign-in/auth-google) · [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect)

## Authentication and domain enforcement

1. **Login with Google** opens Google's account selector via Supabase. The app uses authorization code flow with a cryptographically random PKCE verifier and an S256 challenge.
2. The signup hook checks the exact domain and provider before creating an account. The token hook independently checks the confirmed email against the verified Google identity on sign-in and refresh. A subdomain, lookalike suffix, unverified address, or different provider is rejected.
3. The app exchanges the authorization code for a Supabase session. The web client stores the verifier and session in tab-scoped session storage. Mobile keeps the in-flight verifier in memory and stores the session in the device's secure storage. Provider tokens are discarded.
4. The app uses the session to request its profile. Postgres checks the caller's identity before creating or returning the profile. Expo Router renders the dashboard only after this check. An unauthenticated visit to `/dashboard` goes to the sign-in screen.
5. **Sign out** ends the current Supabase session and removes its local credentials. Supabase access tokens have a short lifetime. Logout also closes the protected route in the app.

When the Google provider is enabled, a denied account receives “Access restricted. Please login using your official domain email.”

To change the domain, update `private.settings.allowed_domain` in a migration and change `EXPO_PUBLIC_ALLOWED_DOMAIN` before rebuilding. The database policy remains authoritative.

## Profiles and roles

Every verified account starts as a **User**. The dashboard displays the stored role, and the **Admin** role reveals an administration panel with role status. The profile RPC is authenticated and the table has row-level security. App users cannot update roles through the API.

A database operator can promote an existing verified user after their first sign-in.

```sql
update public.profiles p
set role = 'admin'
from auth.users u
where u.id = p.id
  and lower(u.email) = 'example@hbplus.fit';
```

## Deployment

The web build is a single-page application. Netlify can import this repository using the checked-in `netlify.toml`. Set the three public environment variables before building. If using another host, publish `dist/` from `npm run build:web` and ensure `/dashboard` and `/auth/callback` fall back to `index.html`.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run build:web
supabase db query --linked --file supabase/tests/access_policy.sql
```

The database test runs in a transaction and rolls back its fixtures. To verify the real provider flow, use a permitted Google account and a personal Google account on each target. Check acceptance, the exact denial message, cancellation, reload, logout and direct access to `/dashboard` after logout. Google credentials and a real permitted account are needed for that check.

## Project layout

- `src/app` contains the login, OAuth callback, and dashboard routes.
- `src/auth` contains the Google code exchange, session lifecycle, and domain checks.
- `src/ui` contains shared styles and components.
- `supabase` contains backend setup, migrations and policy tests.
- `.github/workflows` contains the checks that run before merges.
