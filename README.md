# ThikedarApp

A web app with mobile-number OTP login, session-based logout, and a protected dashboard.

- `backend/` — Node.js + Express API (OTP generation/verification, JWT session in an httpOnly cookie)
- `frontend/` — React + Vite app (two-step login form, protected route, logout)

## OTP delivery (development)

No SMS provider is wired up yet. In development, the backend logs the generated OTP to its
console **and** returns it in the API response as `devOtp`, so the frontend can display it on
screen for easy testing. This `devOtp` field is only included when `NODE_ENV !== "production"` —
wire up a real provider (e.g. Twilio, MSG91) in `backend/src/routes/auth.js` before deploying.

## Running locally

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Runs on http://localhost:4000.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on http://localhost:5173 and proxies `/api` requests to the backend.

## Flow

1. Enter a 10-digit mobile number → an OTP is generated (valid 5 minutes, shown on screen in dev
   mode).
2. Enter the OTP → on success, a signed JWT is set as an httpOnly cookie and you're redirected to
   the dashboard.
3. The dashboard is a protected route — it checks `/api/auth/me` and redirects to `/login` if
   there's no valid session.
4. Logout clears the session cookie.

## Next steps for production

- Connect a real SMS provider (Twilio, MSG91, etc.) in `backend/src/routes/auth.js` and remove the
  `devOtp` field.
- Replace the in-memory store (`backend/src/store.js`) with a real database.
- Set a strong, unique `JWT_SECRET` and enable `secure` cookies behind HTTPS.
