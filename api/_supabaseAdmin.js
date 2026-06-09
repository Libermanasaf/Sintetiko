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

const ADMIN_EMAIL = 'libermanasaf@gmail.com';

// Verifies the caller's Supabase JWT from the Authorization header and returns
// the authenticated user (or null). supabase-js sends this header automatically
// on fetch when a session exists. Without this, the api/ endpoints are open to
// anyone on the internet. Pass the admin client (service_role) to validate.
export async function getCallerUser(req, supabase) {
  try {
    const auth = req.headers?.authorization || req.headers?.Authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token || !supabase) return null;
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

export const isAdminUser = (user) =>
  !!user && (user.email || '').toLowerCase() === ADMIN_EMAIL;
