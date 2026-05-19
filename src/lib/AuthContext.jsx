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

    // Check if user confirmed their email address
    if (user && !user.email_confirmed_at) {
      await supabase.auth.signOut();
      return { error: { message: 'אנא אשר את חשבונך באמצעות קישור האימות שנשלח למייל שלך.' } };
    }

    const userEmail = email.toLowerCase();

    // If not admin, check if they are approved by admin in players table
    if (userEmail !== 'libermanasaf@gmail.com') {
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('is_approved')
        .eq('email', userEmail)
        .maybeSingle();

      if (playerError || !player || !player.is_approved) {
        await supabase.auth.signOut();
        return { error: { message: 'החשבון שלך אושר במייל, אך ממתין לאישור מנהל המערכת (יו"ר ההתאחדות).' } };
      }
    }

    const detectedRole = userEmail === 'libermanasaf@gmail.com' ? 'admin' : 'player';
    setRole(detectedRole);
    return { error: null };
  };

  const register = async (email, password) => {
    if (!supabase) {
      // Mock register successful
      return { error: null };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) return { error };

    // Create an unapproved player record in players table
    if (data?.user) {
      const { error: insertError } = await supabase.from('players').insert([
        {
          id: data.user.id,
          name: email.split('@')[0], // Use email prefix as a placeholder name
          email: email.toLowerCase(),
          is_approved: false,
          rating: 7.0, // Default rating
          wins: 0,
          appearances: 0
        }
      ]);
      if (insertError) {
        console.error('Error creating player profile during sign up:', insertError.message);
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
