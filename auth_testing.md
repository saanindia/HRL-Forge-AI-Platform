# Auth Testing Playbook (Emergent Google Auth)

## How the bridge works in HRL Forge AI
The Emergent Google OAuth flow is bridged into our existing JWT auth:
1. User clicks "Continue with Google" on `/login` or `/register`
2. Redirected to `https://auth.emergentagent.com/?redirect=<origin>/auth/callback`
3. Emergent redirects back to `/auth/callback#session_id=X`
4. Frontend AuthCallback route reads `session_id` and POSTs to backend
5. Backend calls Emergent `/auth/v1/env/oauth/session-data` to fetch user info
6. Backend creates/updates the user in our `users` collection (empty password_hash)
7. Backend issues the SAME JWT `hrl_token` that email/password flow uses
8. Frontend stores JWT in localStorage and redirects to `/app/dashboard`

## Test Google accounts
- Use any Google account for interactive testing (no allowlist enforced yet)

## Backend endpoint
- POST `/api/v1/auth/google` with body `{ "session_id": "<from-fragment>" }`
  Returns: standard `TokenResponse { access_token, user }` — identical to `/auth/login`
