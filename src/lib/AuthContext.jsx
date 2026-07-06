import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import { callApi } from './apiClient';
import { recordLogin, recordDailyPresence } from './loginActivity';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loginMode, setLoginMode] = useState(() => localStorage.getItem('sintetiko_login_mode') || null);
  const [isInitializing, setIsInitializing] = useState(true);
  // Admin-imposed "restricted mode" (players.is_restricted): the player only
  // gets the personal area + signup; the route guard and sidebar enforce it.
  const [isRestricted, setIsRestricted] = useState(false);

  useEffect(() => {
    if (!supabase) {
      // Fallback behavior when Supabase is not configured yet
      const savedRole = sessionStorage.getItem('sintetiko_role');
      if (savedRole) {
        setRole(savedRole);
      }
      setIsInitializing(false);
      return;
    }

    const handleSession = async (session) => {
      if (session?.user) {
        const userEmail = session.user.email?.toLowerCase();
        
        // If it's the admin email, role depends on how they logged in
        if (userEmail === 'libermanasaf@gmail.com') {
          setUser(session.user);
          const savedMode = localStorage.getItem('sintetiko_login_mode');
          setRole(savedMode === 'player' ? 'player' : 'admin');
          // Admin browsing in player mode honors their linked player's
          // restriction — so the admin can preview exactly what a restricted
          // player sees. Admin mode itself is never restricted.
          if (savedMode === 'player') {
            try {
              const { data: p } = await supabase
                .from('players')
                .select('is_restricted')
                .eq('user_id', session.user.id)
                .maybeSingle();
              setIsRestricted(!!p?.is_restricted);
            } catch { setIsRestricted(false); }
          } else {
            setIsRestricted(false);
          }
          recordDailyPresence(session.user, 'מנהל המערכת');
          setIsInitializing(false);
          return;
        }

        // Fetch player approval status. Match by user_id only (every approved
        // player is linked to a user_id) — avoids needing read access to the
        // email column, which is now admin-only for privacy.
        let player = null, playerError = null;
        try {
          const res = await supabase
            .from('players')
            .select('is_approved, is_restricted, name')
            .eq('user_id', session.user.id)
            .maybeSingle();
          player = res.data;
          playerError = res.error;
        } catch (e) {
          playerError = e;
        }

        // OFFLINE-SAFE: only log a user out when the server EXPLICITLY says they're
        // not approved / not found. A network error (e.g. airplane mode) must NOT
        // evict an already-signed-in user — keep their session and let the cached
        // role stand, so going offline never throws them back to the login screen.
        const isNetworkError = playerError && (
          playerError.message === 'Load failed' ||
          playerError.message === 'Failed to fetch' ||
          /network|fetch|timeout|offline/i.test(playerError.message || '') ||
          !navigator.onLine
        );

        if (isNetworkError) {
          // Offline / transient: trust the existing session, don't sign out.
          setUser(session.user);
          setRole('player');
        } else if (playerError || !player || !player.is_approved) {
          // Server answered: this user is genuinely not approved → log them out.
          setUser(null);
          setRole(null);
          setIsRestricted(false);
          await supabase.auth.signOut();
        } else {
          // Approved player
          setUser(session.user);
          setRole('player');
          setIsRestricted(!!player.is_restricted);
          recordDailyPresence(session.user, player.name);
        }
      } else {
        setUser(null);
        setRole(null);
        setIsRestricted(false);
      }
      setIsInitializing(false);
    };

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (selectedRole, email, password) => {
    // If Supabase is not configured, fall back to simulated login
    if (!supabase) {
      const userEmail = email.toLowerCase();
      
      // If it's the admin, bypass player approval check
      if (userEmail === 'libermanasaf@gmail.com') {
        sessionStorage.setItem('sintetiko_role', selectedRole);
        localStorage.setItem('sintetiko_login_mode', selectedRole);
        setLoginMode(selectedRole);
        setRole(selectedRole === 'admin' ? 'admin' : 'player');
        setUser({ email: userEmail, id: 'mock-admin' });
        return { error: null };
      }

      // Check if player profile exists and is approved in localStorage
      try {
        const playersKey = 'sintetiko_Player';
        const players = JSON.parse(localStorage.getItem(playersKey) || '[]');
        const player = players.find(p => p.email && p.email.toLowerCase() === userEmail);

        if (!player) {
          return { error: { message: 'אימייל זה אינו רשום במערכת. אנא הירשם תחילה.' } };
        }

        if (!player.is_approved) {
          return { error: { message: 'החשבון שלך ממתין לאישור מנהל המערכת (יו"ר ההתאחדות).' } };
        }

        // Approved player
        sessionStorage.setItem('sintetiko_role', 'player');
        localStorage.setItem('sintetiko_login_mode', 'player');
        setLoginMode('player');
        setRole('player');
        setUser({ email: userEmail, id: player.user_id || `mock-user-${player.id}` });
        return { error: null };
      } catch (err) {
        console.error('Error during mock login check:', err);
        return { error: { message: 'שגיאה באימות המשתמש' } };
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error };

    const user = data.user;
    const userEmail = email.toLowerCase();

    // If not admin, check if they are approved by admin in players table.
    // Match by user_id only (all approved players are linked); email column is
    // now admin-only and not needed for this lookup.
    let playerName = userEmail === 'libermanasaf@gmail.com' ? 'מנהל המערכת' : null;
    if (userEmail !== 'libermanasaf@gmail.com') {
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('is_approved, is_restricted, name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (playerError || !player || !player.is_approved) {
        await supabase.auth.signOut();
        return { error: { message: 'החשבון שלך ממתין לאישור מנהל המערכת (יו"ר ההתאחדות).' } };
      }
      playerName = player.name;
      setIsRestricted(!!player.is_restricted);
    }

    // Admin logging in as a player: apply their linked player's restriction
    // (preview parity with real restricted players); admin mode stays free.
    if (userEmail === 'libermanasaf@gmail.com') {
      if (selectedRole === 'player') {
        const { data: p } = await supabase
          .from('players')
          .select('is_restricted')
          .eq('user_id', user.id)
          .maybeSingle();
        setIsRestricted(!!p?.is_restricted);
      } else {
        setIsRestricted(false);
      }
    }

    const detectedRole = userEmail === 'libermanasaf@gmail.com' ? selectedRole : 'player';
    localStorage.setItem('sintetiko_login_mode', selectedRole);
    setLoginMode(selectedRole);
    setRole(detectedRole);
    // A deliberate login re-arms the player-card pack-opening ceremony.
    localStorage.removeItem('sintetiko_card_ceremony_at');
    // Record this deliberate login (best-effort) for the admin activity screen.
    recordLogin(user, playerName);
    return { error: null };
  };

  const register = async (email, password, playerId) => {
    if (!supabase) {
      // Mock register successful
      try {
        const playersKey = 'sintetiko_Player';
        const players = JSON.parse(localStorage.getItem(playersKey) || '[]');
        const index = players.findIndex(p => p.id === playerId);
        if (index !== -1) {
          players[index].email = email.toLowerCase();
          players[index].user_id = `mock-user-${Date.now()}`;
          players[index].is_approved = false;
          localStorage.setItem(playersKey, JSON.stringify(players));
        }
      } catch (err) {
        console.error('Error updating mock player registration:', err);
      }
      return { error: null };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) return { error };

    // Link this auth user with the selected existing player profile.
    // Done server-side (service_role) so the client never needs UPDATE rights on
    // `players` — the server enforces is_approved=false and the unlinked check.
    let playerName = null;
    if (data?.user && playerId) {
      try {
        const res = await callApi('/api/link-player', {
          playerId,
          userId: data.user.id,
          email: email.toLowerCase(),
        });
        const linkData = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.error('Error linking player profile during sign up:', linkData.error || res.status);
        } else {
          playerName = linkData?.name || null;
        }
      } catch (linkErr) {
        console.error('Error linking player profile during sign up:', linkErr);
      }
    }

    // Fire a push notification to the admin so they can approve the request.
    // Fail-soft: never block registration on a push error.
    try {
      await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetEmail: 'libermanasaf@gmail.com',
          title: '🆕 רישום חדש לסינתטיקו',
          body: playerName
            ? `${playerName} (${email}) ממתין לאישור`
            : `${email} ממתין לאישור`,
          url: '/UserApprovals',
        }),
      });
    } catch (pushErr) {
      console.warn('Admin push notification failed:', pushErr);
    }

    return { data, error: null };
  };

  // Sends a password-reset email. The link returns the user to /ResetPassword
  // with a recovery token, where updatePassword() sets the new password.
  const resetPassword = async (email) => {
    if (!supabase) return { error: { message: 'Supabase לא מוגדר' } };
    const redirectTo = `${window.location.origin}/ResetPassword`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
    return { error };
  };

  // Sets a new password for the currently-recovering session (after the user
  // clicked the email link — Supabase signs them into a temporary session).
  const updatePassword = async (newPassword) => {
    if (!supabase) return { error: { message: 'Supabase לא מוגדר' } };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  };

  const logout = async () => {
    localStorage.removeItem('sintetiko_login_mode');
    // Logging out re-arms the pack-opening ceremony for the next login.
    localStorage.removeItem('sintetiko_card_ceremony_at');
    setLoginMode(null);
    if (supabase) {
      await supabase.auth.signOut();
    } else {
      sessionStorage.removeItem('sintetiko_role');
      setRole(null);
    }
  };

  const isAdmin = role === 'admin';
  const isPlayer = role === 'player';

  return (
    <AuthContext.Provider value={{ user, role, loginMode, login, register, logout, resetPassword, updatePassword, isAdmin, isPlayer, isInitializing, isRestricted }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
