import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  displayName: string | null;
  setDisplayName: (name: string) => void;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  displayName: null,
  setDisplayName: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayNameState] = useState<string | null>(localStorage.getItem('kwartrack_name'));

  const setDisplayName = (name: string) => {
    localStorage.setItem('kwartrack_name', name);
    setDisplayNameState(name);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Failed to sign in anonymously:", error);
        }
      } else {
        setUser(currentUser);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, displayName, setDisplayName }}>
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
