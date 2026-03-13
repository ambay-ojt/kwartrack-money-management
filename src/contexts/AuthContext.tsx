import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  displayName: string | null;
  setDisplayName: (name: string) => void;
  signInGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
}

const BYPASS_AUTH = false; // Set to true to disable authentication for UI editing

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  displayName: null,
  setDisplayName: () => { },
  signInGuest: async () => { },
  signOut: async () => { },
  authError: null
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayNameState] = useState<string | null>(localStorage.getItem('kwartrack_name'));

  const [authError, setAuthError] = useState<string | null>(null);

  const setDisplayName = (name: string) => {
    localStorage.setItem('kwartrack_name', name);
    setDisplayNameState(name);
  };

  const signInGuest = async () => {
    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      setUser(data.user);
    } catch (error: any) {
      console.error("Failed to sign in anonymously:", error);
      setAuthError(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        setLoading(false);
      } else {
        signInGuest();
      }
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, displayName, setDisplayName, signInGuest, signOut, authError }}>
      {loading ? (
        <div className="min-h-screen bg-[#0D0D0F] flex items-center justify-center text-white">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 bg-[#E5D3B3] rounded-full mb-4"></div>
            <p className="text-zinc-400">Loading KwarTrack...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
