import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, CreditCard } from 'lucide-react';
import { RecurringPayment, Transaction } from '../types';
import { format } from 'date-fns';
import { useSupabase } from '../hooks/useSupabase';

export default function Payments() {
  const { recurringPayments, transactions, addRecurringPayment, deleteRecurringPayment, addTransaction } = useSupabase();
  const paymentHistory = transactions.filter(tx => tx.type === 'payment');
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('');

  const handleAddRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !dueDay) return;

    await addRecurringPayment({
      name,
      amount: parseFloat(amount),
      due_day: parseInt(dueDay, 10)
    });

    setName('');
    setAmount('');
    setDueDay('');
    setShowAdd(false);
  };

  const handleDeleteRecurring = async (id: string) => {
    await deleteRecurringPayment(id);
  };

  const handleMarkPaid = async (payment: RecurringPayment) => {
    await addTransaction({
      type: 'payment',
      amount: payment.amount,
      description: `Paid: ${payment.name}`,
      category: 'Bills',
      date: new Date().toISOString()
    });
  };

  const totalPhonePaid = paymentHistory
    .filter(tx => tx.description.toLowerCase().includes('phone'))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalGcashPaid = paymentHistory
    .filter(tx => tx.description.toLowerCase().includes('gcash'))
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold text-white">Monthly Payments</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-[#E5D3B3] hover:bg-[#d4c3a3] text-[#1A1C20] px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Bill
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#1A1C20] rounded-3xl p-6 border border-white/5 flex flex-col justify-center">
          <span className="text-zinc-400 text-sm font-medium">Total Paid for Phone</span>
          <h3 className="text-2xl lg:text-3xl font-medium text-white mt-2">₱{totalPhonePaid.toFixed(2)}</h3>
        </div>
        <div className="bg-[#1A1C20] rounded-3xl p-6 border border-white/5 flex flex-col justify-center">
          <span className="text-zinc-400 text-sm font-medium">Total Paid for GCash</span>
          <h3 className="text-2xl lg:text-3xl font-medium text-white mt-2">₱{totalGcashPaid.toFixed(2)}</h3>
        </div>
      </div>

      {showAdd && (
        <div className="bg-[#1A1C20] p-6 lg:p-8 rounded-3xl border border-white/5">
          <h2 className="text-lg font-medium mb-6 text-white">New Recurring Bill</h2>
          <form onSubmit={handleAddRecurring} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Bill Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0D0D0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E5D3B3] focus:ring-1 focus:ring-[#E5D3B3] outline-none transition-all"
                placeholder="e.g., Phone, GCash Loan"
              />
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
              <label className="block text-sm font-medium text-zinc-400 mb-2">Due Day of Month</label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full bg-[#0D0D0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#E5D3B3] focus:ring-1 focus:ring-[#E5D3B3] outline-none transition-all"
                placeholder="1-31"
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 rounded-xl font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button type="submit" className="bg-[#E5D3B3] text-[#1A1C20] px-6 py-3 rounded-xl font-medium hover:bg-[#d4c3a3] transition-colors">
                Save Bill
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recurring Payments List */}
        <div className="bg-[#1A1C20] rounded-3xl border border-white/5 p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="w-5 h-5 text-[#E5D3B3]" />
            <h3 className="text-lg font-medium text-white">Recurring Bills</h3>
          </div>
          <div className="space-y-3">
            {recurringPayments.length === 0 ? (
              <div className="p-6 text-center text-zinc-500">No recurring bills set up.</div>
            ) : (
              recurringPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#22252A] border border-white/5 hover:bg-[#2A2D35] transition-colors">
                  <div>
                    <p className="text-white font-medium">{payment.name}</p>
                    <p className="text-zinc-500 text-sm">Due on day {payment.due_day} of every month</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-white font-medium">₱{payment.amount.toFixed(2)}</span>
                    <button
                      onClick={() => handleMarkPaid(payment)}
                      className="text-emerald-400 hover:text-emerald-300 p-2 rounded-lg hover:bg-emerald-500/10 transition-colors"
                      title="Mark as Paid"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRecurring(payment.id)}
                      className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Delete Bill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-[#1A1C20] rounded-3xl border border-white/5 p-6 lg:p-8">
          <h3 className="text-lg font-medium text-white mb-6">Payment History</h3>
          <div className="space-y-3">
            {paymentHistory.length === 0 ? (
              <div className="p-6 text-center text-zinc-500">No payment history.</div>
            ) : (
              paymentHistory.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#22252A] border border-white/5 hover:bg-[#2A2D35] transition-colors">
                  <div>
                    <p className="text-white font-medium">{tx.description}</p>
                    <p className="text-zinc-500 text-sm">{format(new Date(tx.date), 'MMM dd, yyyy')}</p>
                  </div>
                  <span className="text-white font-medium">-₱{tx.amount.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
