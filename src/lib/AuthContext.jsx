import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

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

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        const email = session.user.email?.toLowerCase();
        const detectedRole = email === 'libermanasaf@gmail.com' ? 'admin' : 'player';
        setRole(detectedRole);
      }
      setIsInitializing(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const email = session.user.email?.toLowerCase();
        const detectedRole = email === 'libermanasaf@gmail.com' ? 'admin' : 'player';
        setRole(detectedRole);
      } else {
        setUser(null);
        setRole(null);
      }
      setIsInitializing(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (selectedRole, email, password) => {
    // If Supabase is not configured, fall back to simulated login
    if (!supabase) {
      sessionStorage.setItem('sintetiko_role', selectedRole);
      setRole(selectedRole);
      return { error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error };

    const user = data.user;
    const userEmail = email.toLowerCase();

    // If not admin, check if they are approved by admin in players table
    if (userEmail !== 'libermanasaf@gmail.com') {
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('is_approved')
        .or(`user_id.eq.${user.id},email.eq.${userEmail}`)
        .maybeSingle();

      if (playerError || !player || !player.is_approved) {
        await supabase.auth.signOut();
        return { error: { message: 'החשבון שלך ממתין לאישור מנהל המערכת (יו"ר ההתאחדות).' } };
      }
    }

    const detectedRole = userEmail === 'libermanasaf@gmail.com' ? 'admin' : 'player';
    setRole(detectedRole);
    return { error: null };
  };

  const register = async (email, password, playerId) => {
    if (!supabase) {
      // Mock register successful
      return { error: null };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) return { error };

    // Link this auth user with the selected existing player profile in the database
    if (data?.user && playerId) {
      const { error: updateError } = await supabase
        .from('players')
        .update({
          user_id: data.user.id,
          email: email.toLowerCase(),
          is_approved: false
        })
        .eq('id', playerId);

      if (updateError) {
        console.error('Error linking player profile during sign up:', updateError.message);
      }
    }

    return { data, error: null };
  };

  const logout = async () => {
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
    <AuthContext.Provider value={{ user, role, login, register, logout, isAdmin, isPlayer, isInitializing }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
