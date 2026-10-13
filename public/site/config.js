// The API is served by the same Vercel project under /api.
// Auth endpoints stay fail-closed and return a configuration error until server secrets and Supabase are configured.
window.TAMP_CONFIG = {
  mode: 'backend',
  apiBase: '/api',
  demo: false,
};
