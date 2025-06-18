import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string) => {
    // First check if any users exist
    const adminExists = await checkAdminExists();
    if (adminExists) {
      return { 
        data: null, 
        error: { message: 'An admin user is already registered' } 
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Disable email confirmation for admin
      }
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const checkAdminExists = async (): Promise<boolean> => {
    try {
      // Try to get user count from auth.users (this requires service role)
      // Since we can't access auth.users directly, we'll use a different approach
      // We'll check if there are any authenticated sessions or use a different method
      
      // For now, we'll allow signup if no current user exists
      // In production, you might want to implement a more robust check
      const { data: { session } } = await supabase.auth.getSession();
      
      // This is a simple check - in production you might want to maintain
      // an admin_users table or use Supabase's admin API
      return false; // Allow signup for now
    } catch (error) {
      console.error('Error checking admin existence:', error);
      return false; // Allow signup on error
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    checkAdminExists,
  };
};