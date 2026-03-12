import React, { useState, useEffect } from 'react';
import { Plus, Trash2, PiggyBank, Target, AlertCircle } from 'lucide-react';
import { Transaction } from '../types';
import { format, differenceInDays, isPast, isToday } from 'date-fns';
import { useSupabase } from '../hooks/useSupabase';

export default function Savings() {
  const { transactions, settings, addTransaction, deleteTransaction, saveSetting } = useSupabase();
  const savings = transactions.filter(tx => tx.type === 'savings');
  const totalSavings = savings.reduce((acc, curr) => acc + curr.amount, 0);

  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Goal State
  const [showGoalSettings, setShowGoalSettings] = useState(false);
  const [goalAmount, setGoalAmount] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [savedGoalAmount, setSavedGoalAmount] = useState(0);
  const [savedGoalDeadline, setSavedGoalDeadline] = useState('');

  useEffect(() => {
    const gAmount = settings.find((s: any) => s.key === 'savings_goal_amount');
    const gDeadline = settings.find((s: any) => s.key === 'savings_goal_deadline');

    if (gAmount && gAmount.value) {
      setSavedGoalAmount(parseFloat(gAmount.value));
      setGoalAmount(gAmount.value);
    }
    if (gDeadline && gDeadline.value) {
      setSavedGoalDeadline(gDeadline.value);
      setGoalDeadline(gDeadline.value);
    }
  }, [settings]);

  const handleAddSavings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date) return;

    await addTransaction({
      type: 'savings',
      amount: parseFloat(amount),
      description: description || 'Savings Deposit',
      category: null,
      date: new Date(date).toISOString()
    });

    setAmount('');
    setDescription('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setShowAdd(false);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    await Promise.all([
      saveSetting('savings_goal_amount', goalAmount),
      saveSetting('savings_goal_deadline', goalDeadline)
    ]);
    setShowGoalSettings(false);
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
  };

  const renderGoalAlert = () => {
    if (!savedGoalAmount || !savedGoalDeadline) return null;

    const deadlineDate = new Date(savedGoalDeadline);
    const daysLeft = differenceInDays(deadlineDate, new Date());
    const isMissed = isPast(deadlineDate) && !isToday(deadlineDate);
    const isNear = daysLeft > 0 && daysLeft <= 7;
    const isAchieved = totalSavings >= savedGoalAmount;

    if (isAchieved) {
      return (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl flex items-center gap-3 mb-6">
          <Target className="w-5 h-5" />
          <p className="font-medium">Congratulations! You have reached your savings goal of ₱{savedGoalAmount.toFixed(2)}!</p>
        </div>
      );
    }

    if (isMissed) {
      return (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3 mb-6">
          <AlertCircle className="w-5 h-5" />
          <p className="font-medium">You missed your savings goal deadline on {format(deadlineDate, 'MMM dd, yyyy')}. Keep saving to reach ₱{savedGoalAmount.toFixed(2)}!</p>
        </div>
      );
    }

    if (isNear) {
      return (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-4 rounded-2xl flex items-center gap-3 mb-6">
          <AlertCircle className="w-5 h-5" />
          <p className="font-medium">Your savings goal deadline is approaching in {daysLeft} days! You need ₱{(savedGoalAmount - totalSavings).toFixed(2)} more.</p>
        </div>
      );
    }

    return null;
  };

  const goalProgress = savedGoalAmount > 0 ? Math.min((totalSavings / savedGoalAmount) * 100, 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold text-white">Savings Tracker</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowGoalSettings(!showGoalSettings)}
            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors border border-white/10"
          >
            <Target className="w-5 h-5" />
            Goal
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-[#E5D3B3] hover:bg-[#d4c3a3] text-[#1A1C20] px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Savings
          </button>
        </div>
      </div>

      {renderGoalAlert()}

      {showGoalSettings && (
        <div className="bg-[#1A1C20] p-6 lg:p-8 rounded-3xl border border-white/5 mb-8">
          <h2 className="text-lg font-medium mb-6 text-white">Set Savings Goal</h2>
          <form onSubmit={handleSaveGoal} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Target Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                className="w-full bg-[#0D0D0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E5D3B3] focus:ring-1 focus:ring-[#E5D3B3] outline-none transition-all"
                placeholder="10000.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Deadline</label>
              <input
                type="date"
                required
                value={goalDeadline}
                onChange={(e) => setGoalDeadline(e.target.value)}
                className="w-full bg-[#0D0D0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E5D3B3] focus:ring-1 focus:ring-[#E5D3B3] outline-none transition-all"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setShowGoalSettings(false)} className="px-6 py-3 rounded-xl font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button type="submit" className="bg-[#E5D3B3] text-[#1A1C20] px-6 py-3 rounded-xl font-medium hover:bg-[#d4c3a3] transition-colors">
                Save Goal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-[#1A1C20] p-8 rounded-3xl border border-white/5 flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <div className="flex justify-between items-center relative z-10 mb-6">
          <div>
            <p className="text-zinc-400 font-medium mb-2">Total Savings Balance</p>
            <h2 className="text-5xl lg:text-6xl font-medium text-white tracking-tight">₱{totalSavings.toFixed(2)}</h2>
          </div>
          <PiggyBank className="w-24 h-24 text-white/5" />
        </div>

        {savedGoalAmount > 0 && (
          <div className="relative z-10 mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-400">Progress to Goal (₱{savedGoalAmount.toFixed(2)})</span>
              <span className="text-white font-medium">{goalProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-[#0D0D0F] rounded-full h-3 border border-white/5 overflow-hidden">
              <div
                className="bg-[#E5D3B3] h-3 rounded-full transition-all duration-500"
                style={{ width: `${goalProgress}%` }}
              ></div>
            </div>
            {savedGoalDeadline && (
              <p className="text-xs text-zinc-500 mt-2 text-right">
                Deadline: {format(new Date(savedGoalDeadline), 'MMM dd, yyyy')}
              </p>
            )}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="bg-[#1A1C20] p-6 lg:p-8 rounded-3xl border border-white/5">
          <h2 className="text-lg font-medium mb-6 text-white">Add to Savings</h2>
          <form onSubmit={handleAddSavings} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#0D0D0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E5D3B3] focus:ring-1 focus:ring-[#E5D3B3] outline-none transition-all"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#0D0D0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E5D3B3] focus:ring-1 focus:ring-[#E5D3B3] outline-none transition-all"
                placeholder="e.g., Emergency Fund"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#0D0D0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E5D3B3] focus:ring-1 focus:ring-[#E5D3B3] outline-none transition-all"
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 rounded-xl font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button type="submit" className="bg-[#E5D3B3] text-[#1A1C20] px-6 py-3 rounded-xl font-medium hover:bg-[#d4c3a3] transition-colors">
                Save Deposit
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-[#1A1C20] rounded-3xl border border-white/5 p-6 lg:p-8">
        <h3 className="text-lg font-medium text-white mb-6">Savings History</h3>
        <div className="space-y-3">
          {savings.length === 0 ? (
            <div className="p-6 text-center text-zinc-500">No savings recorded yet.</div>
          ) : (
            savings.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#22252A] border border-white/5 hover:bg-[#2A2D35] transition-colors">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-white font-medium">{tx.description}</p>
                    <p className="text-zinc-500 text-sm">{format(new Date(tx.date), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 lg:gap-8">
                  <span className="text-emerald-400 font-medium w-24 text-right">
                    +₱{tx.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
