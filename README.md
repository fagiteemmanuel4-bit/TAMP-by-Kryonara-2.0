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

## Current implementation notes

- Email verification is wired to EmailJS
- Phone verification is intentionally left as `coming_soon`
- Supabase is supported as the persistence layer, but the app is still compatible with the local in-memory fallback during setup
- The admin route is available at `/ADMIN19841812`

## Deployment

- Frontend: Vercel
- Backend: Vercel or another Node-compatible host
- SPA routing is handled in `vercel.json`

## GitHub push

This repo has already been initialized with an initial Git commit and is ready to push to a remote repository.

```bash
git remote add origin <your-github-repository-url>
git push -u origin master
```
