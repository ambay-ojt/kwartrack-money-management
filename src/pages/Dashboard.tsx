import React, { useState, useEffect } from 'react';
import { Plus, Minus, PiggyBank, CreditCard, Bell, TrendingUp, Wallet, Receipt, Utensils, Car, Zap, Film, ShoppingBag, MoreHorizontal, Briefcase, ShoppingCart } from 'lucide-react';
import { Balance, Transaction } from '../types';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFirestore } from '../hooks/useFirestore';

export default function Dashboard() {
  const { user, displayName: localName } = useAuth();
  const { balance, transactions, addTransaction } = useFirestore();
  const recentTransactions = transactions.slice(0, 5);
  const [showAddBalance, setShowAddBalance] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleAddBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    await addTransaction({
      type: 'income',
      amount: parseFloat(amount),
      description: description || 'Added Balance',
      category: null,
      date: new Date().toISOString()
    });

    setAmount('');
    setDescription('');
    setShowAddBalance(false);
  };

  const getCategoryIcon = (tx: Transaction) => {
    if (tx.type === 'income') return <Briefcase className="w-5 h-5 text-[#E5D3B3]" />;
    if (tx.type === 'savings') return <PiggyBank className="w-5 h-5 text-emerald-400" />;
    
    const desc = (tx.description || '').toLowerCase();
    const cat = (tx.category || '').toLowerCase();
    
    if (desc.includes('amazon') || cat.includes('shopping')) return <ShoppingCart className="w-5 h-5 text-zinc-400" />;
    if (cat.includes('food')) return <Utensils className="w-5 h-5 text-zinc-400" />;
    if (cat.includes('transport')) return <Car className="w-5 h-5 text-zinc-400" />;
    if (cat.includes('utilities') || desc.includes('electric')) return <Zap className="w-5 h-5 text-zinc-400" />;
    if (cat.includes('entertainment')) return <Film className="w-5 h-5 text-zinc-400" />;
    
    return <Wallet className="w-5 h-5 text-zinc-400" />;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (!balance) return <div className="p-8 text-zinc-500 flex justify-center items-center min-h-[50vh]">Loading...</div>;

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden border border-white/10">
            <img src={user?.photoURL || "https://picsum.photos/seed/avatar/100/100"} alt="User Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">{getGreeting()},</p>
            <h2 className="text-lg font-semibold text-white">{user?.displayName || localName || 'User'}</h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors relative"
            >
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#E5D3B3] rounded-full"></span>
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-[#1A1C20] border border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="p-4 border-b border-white/5">
                  <h3 className="font-medium text-white">Notifications</h3>
                </div>
                <div className="p-4 text-sm text-zinc-400 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-[#E5D3B3] shrink-0"></div>
                    <p>Welcome to KwarTrack! Start tracking your expenses today.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-emerald-400 shrink-0"></div>
                    <p>Your weekly allowance has been set to ₱{balance.totalIncome.toFixed(2)}.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddBalance && (
        <div className="bg-[#1A1C20] p-6 rounded-3xl border border-white/5 mb-8">
          <h2 className="text-lg font-medium text-white mb-4">Add Balance (Income)</h2>
          <form onSubmit={handleAddBalance} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full bg-[#0D0D0F] rounded-xl p-2 border border-white/5">
              <label className="block text-xs font-medium text-zinc-500 px-2 pt-1">Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent px-2 py-1 text-white focus:outline-none"
                placeholder="0.00"
              />
            </div>
            <div className="flex-1 w-full bg-[#0D0D0F] rounded-xl p-2 border border-white/5">
              <label className="block text-xs font-medium text-zinc-500 px-2 pt-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-transparent px-2 py-1 text-white focus:outline-none"
                placeholder="e.g., Salary, Bonus"
              />
            </div>
            <div className="flex gap-3 w-full md:w-auto pb-1">
              <button type="button" onClick={() => setShowAddBalance(false)} className="flex-1 md:flex-none px-6 py-2 rounded-xl font-medium text-zinc-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button type="submit" className="flex-1 md:flex-none bg-[#E5D3B3] text-[#1A1C20] px-6 py-2 rounded-xl font-medium hover:bg-[#d4c3a3] transition-colors">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Balance Area */}
      <div className="flex flex-col items-center justify-center py-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#E5D3B3]/10 rounded-full blur-3xl pointer-events-none"></div>
        <span className="text-zinc-400 font-medium mb-2 relative z-10">Available Balance</span>
        <h3 className="text-6xl md:text-7xl lg:text-8xl font-semibold text-white tracking-tight relative z-10">
          ₱{balance.remaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h3>
        <p className="text-[#E5D3B3] text-sm font-medium mt-3 relative z-10">
          Allowance for the week: ₱{balance.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        
        <div className="flex gap-4 mt-8 w-full max-w-md relative z-10">
          <button 
            onClick={() => setShowAddBalance(true)}
            className="flex-1 bg-transparent border border-white/10 text-white py-4 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
          >
            <Plus size={18} />
            Add Money
          </button>
          <Link 
            to="/expenses"
            className="flex-1 bg-[#E5D3B3] text-[#1A1C20] py-4 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-[#d4c3a3] transition-colors"
          >
            <Minus size={18} />
            Log Expense
          </Link>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Quick Access</h3>
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <Link to="/expenses" className="bg-gradient-to-b from-[#1A1C20] to-[#2A2515] p-4 md:p-6 rounded-3xl border border-white/5 flex flex-col items-start hover:brightness-110 transition-all">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Receipt className="w-5 h-5 text-zinc-300" />
            </div>
            <span className="text-zinc-400 text-xs md:text-sm font-medium mb-1">Weekly Expenses</span>
            <span className="text-white font-medium text-sm md:text-lg">₱{balance.weeklyExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </Link>
          <Link to="/savings" className="bg-gradient-to-b from-[#1A1C20] to-[#2A2515] p-4 md:p-6 rounded-3xl border border-white/5 flex flex-col items-start hover:brightness-110 transition-all">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <PiggyBank className="w-5 h-5 text-zinc-300" />
            </div>
            <span className="text-zinc-400 text-xs md:text-sm font-medium mb-1">Total Savings</span>
            <span className="text-white font-medium text-sm md:text-lg">₱{balance.totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </Link>
          <Link to="/payments" className="bg-gradient-to-b from-[#1A1C20] to-[#2A2515] p-4 md:p-6 rounded-3xl border border-white/5 flex flex-col items-start hover:brightness-110 transition-all">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <CreditCard className="w-5 h-5 text-zinc-300" />
            </div>
            <span className="text-zinc-400 text-xs md:text-sm font-medium mb-1">Total Payments</span>
            <span className="text-white font-medium text-sm md:text-lg">₱{balance.totalPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </Link>
        </div>
      </div>

      {/* Transactions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Recent Transactions</h3>
          <Link to="/expenses" className="text-sm text-zinc-400 hover:text-white transition-colors">See all</Link>
        </div>
        <div className="space-y-3">
          {recentTransactions.length === 0 ? (
            <div className="p-6 text-center text-zinc-500 bg-[#1A1C20] rounded-3xl border border-white/5">No transactions yet.</div>
          ) : (
            recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 md:p-5 rounded-3xl bg-gradient-to-r from-[#1A1C20] to-[#222015] border border-white/5 hover:brightness-110 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                    {getCategoryIcon(tx)}
                  </div>
                  <div>
                    <p className="text-white font-medium">{tx.description}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{format(new Date(tx.date), 'h:mm a')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={clsx(
                    "w-1.5 h-1.5 rounded-full",
                    tx.type === 'income' ? "bg-[#E5D3B3]" : "bg-red-400"
                  )}></div>
                  <span className={clsx(
                    "font-medium",
                    tx.type === 'income' ? "text-white" : "text-white"
                  )}>
                    {tx.type === 'income' ? '+' : '-'}₱{tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
