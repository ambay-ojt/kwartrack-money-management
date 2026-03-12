import React, { useState, useEffect } from 'react';
import { Save, Bell, DollarSign, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSupabase } from '../hooks/useSupabase';

export default function Settings() {
  const { displayName, setDisplayName, signOut } = useAuth();
  const { budgets, saveBudget } = useSupabase();
  const [weeklyBudget, setWeeklyBudget] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const budget = budgets.find(b => b.type === 'weekly')?.amount;
    if (budget) setWeeklyBudget(budget.toString());
  }, [budgets]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveBudget('weekly', parseFloat(weeklyBudget) || 0);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Settings</h2>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      <div className="grid gap-6">
        <div className="bg-[#161618] p-6 rounded-xl border border-white/5">
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="w-5 h-5 text-[#E5D3B3]" />
            <h3 className="text-lg font-semibold">Profile Settings</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Display Name</label>
              <input
                type="text"
                value={displayName || ''}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#0D0D0F] border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-[#E5D3B3] transition-colors"
                placeholder="Enter your name"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#161618] p-6 rounded-xl border border-white/5">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5 text-[#E5D3B3]" />
            <h3 className="text-lg font-semibold">Integrations & Budgets</h3>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Weekly Budget (₱)</label>
              <input
                type="number"
                value={weeklyBudget}
                onChange={(e) => setWeeklyBudget(e.target.value)}
                className="w-full bg-[#0D0D0F] border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-[#E5D3B3] transition-colors"
                placeholder="e.g. 2000"
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[#E5D3B3] text-[#0D0D0F] font-semibold py-2 rounded-lg hover:bg-[#d4c2a3] transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saved ? 'Settings Saved!' : 'Save Settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
