# TAMP Monorepo

This repo contains the React frontend and a lightweight Express backend prepared for Supabase + EmailJS integration.

## Project structure

- `src/` — Vite React frontend
- `public/site/` — original student site files preserved from the static project
- `public/admin/` — original admin site files preserved from the static project
- `backend/` — Express API for auth, onboarding, dashboard data, and admin endpoints
- `vercel.json` — deployment rewrite rules for SPA routing

## Frontend

```bash
npm install
npm run dev
```

## Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

## Required backend environment values

See `backend/.env.example` and fill in:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `EMAILJS_SERVICE_ID`
- `EMAILJS_TEMPLATE_ID`
- `EMAILJS_PUBLIC_KEY`
- `EMAILJS_PRIVATE_KEY`
- `JWT_SECRET`
- `FRONTEND_URL`
- `ALLOWED_ORIGINS` (comma-separated exact frontend origins; required in production)

## Current implementation notes

- Email verification is wired to EmailJS
- Phone verification is intentionally left as `coming_soon`
- Supabase is supported as the persistence layer, but the app is still compatible with the local in-memory fallback during setup
- The admin route is available at `/ADMIN19841812`

## Deployment

- Frontend: Vercel
- Backend: deploy `backend/` as a persistent Node.js service with a stable HTTPS URL. Do not rely on in-memory registration/reset state in a serverless deployment.
- Set the backend environment variables from `backend/.env.example` in the backend host. Production must have `JWT_SECRET`, `ALLOWED_ORIGINS`, Supabase credentials and EmailJS credentials configured.
- Set `window.TAMP_CONFIG.apiBase` in `public/site/config.js` to the backend URL ending in `/api` (for example, `https://api.example.com/api`). Do not put EmailJS private keys or the Supabase service-role key in frontend files.
- Verify signup with a real inbox, then verify login, expired/incorrect code handling and provider errors before inviting students.
- SPA routing is handled in `vercel.json`; it does not automatically deploy the Express backend.

## GitHub push

This repo has already been initialized with an initial Git commit and is ready to push to a remote repository.

```bash
git remote add origin <your-github-repository-url>
git push -u origin master
```
