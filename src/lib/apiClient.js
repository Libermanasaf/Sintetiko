import { supabase } from './supabase';

// Calls one of our /api/* serverless functions WITH the user's Supabase JWT in
// the Authorization header. The api/ endpoints now verify this token (so they're
// no longer open to the public), and supabase-js does NOT attach it to plain
// fetch() calls — only to its own queries. This helper bridges that gap: every
// privileged endpoint call must go through here so the token rides along.
export async function callApi(path, body) {
  const doFetch = async () => {
    let token = null;
    try {
      const { data } = await supabase.auth.getSession();
      token = data?.session?.access_token || null;
    } catch { /* no session — call will be rejected by the server */ }

    return fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  };

  let res = await doFetch();
  // A long-slept PWA can hold a stale access token — the server then answers
  // 401 and the action silently dies. Refresh the session once and retry.
  if (res.status === 401 && supabase) {
    try { await supabase.auth.refreshSession(); } catch { /* keep original 401 */ }
    res = await doFetch();
  }
  return res;
}
