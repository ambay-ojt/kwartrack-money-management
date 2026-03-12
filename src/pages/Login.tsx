import React, { useState } from 'react';
import { PiggyBank, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const { displayName, setDisplayName } = useAuth();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (displayName) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Please enter a valid name (at least 2 characters)');
      return;
    }
    setDisplayName(name.trim());
  };

  return (
    <div className="min-h-screen bg-[#0D0D0F] flex flex-col items-center justify-center p-4 text-white font-sans selection:bg-[#E5D3B3] selection:text-black">
      <div className="w-full max-w-md bg-[#1A1C20] rounded-3xl border border-white/5 p-8 shadow-2xl flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-[#E5D3B3] flex items-center justify-center text-[#141518] mb-6 shadow-lg shadow-[#E5D3B3]/20">
          <PiggyBank size={32} />
        </div>
        
        <h1 className="text-3xl font-bold mb-2 tracking-tight text-center">Welcome to KwarTrack</h1>
        <p className="text-zinc-400 text-center mb-8">Manage your finances, track expenses, and reach your savings goals.</p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="bg-[#0D0D0F] rounded-2xl p-4 border border-white/5 focus-within:border-[#E5D3B3]/50 transition-all">
            <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">What should we call you?</label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-transparent text-white text-lg font-medium focus:outline-none placeholder:text-zinc-700"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs px-2">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-[#E5D3B3] text-[#1A1C20] font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#d4c3a3] transition-all active:scale-[0.98]"
          >
            Get Started
            <ArrowRight size={20} />
          </button>
        </form>

        <p className="text-xs text-zinc-500 text-center mt-8">
          Your data is stored securely in your browser and synced to our cloud.
        </p>
      </div>
    </div>
  );
}
