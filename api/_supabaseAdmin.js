import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the service_role key, which bypasses
 * Row Level Security entirely. Only ever import this from files under /api
 * — the service_role key must never be prefixed VITE_ or otherwise shipped
 * to the browser.
 */
export function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY on the server.");
  }

  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}
