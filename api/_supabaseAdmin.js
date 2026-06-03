import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client. Prefers the service_role key so server functions
// keep working after RLS is enabled (service_role bypasses RLS). Falls back to
// the anon key when the service_role env var isn't set yet, so deploying this
// file before adding the env var doesn't break anything — it just means RLS
// will block these calls until the key is configured in Vercel.
//
// SECURITY: the service_role key must ONLY ever live in server env (Vercel),
// never in VITE_* vars or any client bundle. It is a full-access key.
export function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const key = serviceKey || anonKey;
  if (!url || !key) return null;
  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  // Tag the client so callers can tell whether it can actually bypass RLS.
  // Under RLS, an anon-keyed client reads 0 rows from push_subscriptions etc.,
  // which silently breaks server pushes — callers should treat that as an error.
  client.__isServiceRole = !!serviceKey;
  return client;
}

export const usingServiceRole = () => !!process.env.SUPABASE_SERVICE_ROLE_KEY;
