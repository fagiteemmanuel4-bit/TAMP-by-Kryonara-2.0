-- The project already contains this SECURITY DEFINER event-trigger helper.
-- It should not be callable by browser roles through the Supabase Data API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
