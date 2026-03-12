import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Transaction } from '../types';
import { format } from 'date-fns';
import { useFirestore } from '../hooks/useFirestore';

export default function Expenses() {
  const { transactions, addTransaction, deleteTransaction } = useFirestore();
  const expenses = transactions.filter(tx => tx.type === 'expense');
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !date) return;

    await addTransaction({
      type: 'expense',
      amount: parseFloat(amount),
      category,
      description,
      date: new Date(date).toISOString()
    });

    setAmount('');
    setCategory('');
    setDescription('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setShowAdd(false);
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold text-white">Expenses</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-[#E5D3B3] hover:bg-[#d4c3a3] text-[#1A1C20] px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Expense
        </button>
      </div>

      {showAdd && (
        <div className="bg-[#1A1C20] p-6 lg:p-8 rounded-3xl border border-white/5">
          <h2 className="text-lg font-medium mb-6 text-white">New Expense</h2>
          <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Item Name / Description</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#0D0D0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E5D3B3] focus:ring-1 focus:ring-[#E5D3B3] outline-none transition-all"
                placeholder="e.g., Groceries"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Category</label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0D0D0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E5D3B3] focus:ring-1 focus:ring-[#E5D3B3] outline-none transition-all appearance-none"
              >
                <option value="" className="bg-[#0D0D0F]">Select a category</option>
                <option value="Food" className="bg-[#0D0D0F]">Food & Dining</option>
                <option value="Transport" className="bg-[#0D0D0F]">Transportation</option>
                <option value="Utilities" className="bg-[#0D0D0F]">Utilities</option>
                <option value="Entertainment" className="bg-[#0D0D0F]">Entertainment</option>
                <option value="Shopping" className="bg-[#0D0D0F]">Shopping</option>
                <option value="Other" className="bg-[#0D0D0F]">Other</option>
              </select>
            </div>
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
              <label className="block text-sm font-medium text-zinc-400 mb-2">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#0D0D0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E5D3B3] focus:ring-1 focus:ring-[#E5D3B3] outline-none transition-all"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 rounded-xl font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button type="submit" className="bg-[#E5D3B3] text-[#1A1C20] px-6 py-3 rounded-xl font-medium hover:bg-[#d4c3a3] transition-colors">
                Save Expense
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-[#1A1C20] rounded-3xl border border-white/5 p-6 lg:p-8">
        <h3 className="text-lg font-medium text-white mb-6">Expense History</h3>
        <div className="space-y-3">
          {expenses.length === 0 ? (
            <div className="p-6 text-center text-zinc-500">No expenses recorded yet.</div>
          ) : (
            expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#22252A] border border-white/5 hover:bg-[#2A2D35] transition-colors">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-white font-medium">{expense.description}</p>
                    <p className="text-zinc-500 text-sm">{format(new Date(expense.date), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 lg:gap-8">
                  <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full bg-white/5 text-zinc-300 text-xs font-medium border border-white/10">
                    {expense.category}
                  </span>
                  <span className="text-white font-medium w-24 text-right">
                    ₱{expense.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleDelete(expense.id)}
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
