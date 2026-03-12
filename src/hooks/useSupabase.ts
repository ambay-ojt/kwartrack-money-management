import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Transaction, Balance, RecurringPayment } from '../types';
import { startOfWeek, format } from 'date-fns';

export function useSupabase() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [budgets, setBudgets] = useState<any[]>([]);
    const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
    const [settings, setSettings] = useState<any[]>([]);
    const [balance, setBalance] = useState<Balance | null>(null);

    const settingsRef = useRef<any[]>([]);
    const budgetsRef = useRef<any[]>([]);
    const balanceRef = useRef<Balance | null>(null);

    useEffect(() => {
        settingsRef.current = settings;
    }, [settings]);

    useEffect(() => {
        budgetsRef.current = budgets;
    }, [budgets]);

    useEffect(() => {
        balanceRef.current = balance;
    }, [balance]);

    const calculateBalance = (txs: Transaction[]) => {
        const totalIncome = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const totalSavings = txs.filter(t => t.type === 'savings').reduce((sum, t) => sum + t.amount, 0);
        const totalPayment = txs.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0);

        const now = new Date();
        const startOfWk = new Date(now);
        startOfWk.setDate(startOfWk.getDate() - startOfWk.getDay());
        startOfWk.setHours(0, 0, 0, 0);

        const weeklyExpense = txs
            .filter(t => t.type === 'expense' && new Date(t.date) >= startOfWk)
            .reduce((sum, t) => sum + t.amount, 0);

        const weeklySavings = txs
            .filter(t => t.type === 'savings' && new Date(t.date) >= startOfWk)
            .reduce((sum, t) => sum + t.amount, 0);

        const newBalance = {
            remaining: totalIncome - totalExpense - totalSavings - totalPayment,
            totalIncome,
            totalExpense,
            weeklyExpense,
            totalSavings,
            totalPayment
        };
        setBalance(newBalance);

        // Check savings reminder
        const webhookSetting = settingsRef.current.find(s => s.key === 'n8n_webhook_url');
        if (webhookSetting?.value && weeklySavings === 0 && now.getDay() === 5) {
            const lastChecked = localStorage.getItem('savings_reminder_checked');
            const today = format(now, 'yyyy-MM-dd');
            if (lastChecked !== today) {
                fetch(webhookSetting.value, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'savings_reminder',
                        message: "You haven't allotted money for savings this week."
                    })
                }).catch(err => console.error('Failed to trigger webhook:', err));
                localStorage.setItem('savings_reminder_checked', today);
            }
        }
    };

    const fetchData = async () => {
        if (!user) return;

        const [
            { data: txs },
            { data: bdgs },
            { data: pays },
            { data: sets }
        ] = await Promise.all([
            supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
            supabase.from('budgets').select('*').eq('user_id', user.id),
            supabase.from('recurring_payments').select('*').eq('user_id', user.id),
            supabase.from('settings').select('*').eq('user_id', user.id)
        ]);

        if (txs) {
            setTransactions(txs);
            calculateBalance(txs);
        }
        if (bdgs) setBudgets(bdgs);
        if (pays) setRecurringPayments(pays);
        if (sets) setSettings(sets);
    };

    useEffect(() => {
        if (!user) return;

        fetchData();

        const channel = supabase
            .channel('db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', filter: `user_id=eq.${user.id}` }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
        if (!user) return;
        const { error } = await supabase.from('transactions').insert([{ ...tx, user_id: user.id }]);
        if (error) {
            console.error('Error adding transaction:', error);
            throw error;
        }

        // Webhook logic
        if (tx.type === 'expense') {
            const webhookSetting = settingsRef.current.find(s => s.key === 'n8n_webhook_url');
            const weeklyBudget = budgetsRef.current.find(b => b.type === 'weekly');

            if (webhookSetting?.value && weeklyBudget?.amount && balanceRef.current) {
                const newWeeklyExpense = balanceRef.current.weeklyExpense + tx.amount;
                const percentage = (newWeeklyExpense / weeklyBudget.amount) * 100;

                if (percentage >= 85) {
                    fetch(webhookSetting.value, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'budget_alert',
                            message: `Warning: You have spent ${percentage.toFixed(1)}% of your weekly budget.`,
                            current_spend: newWeeklyExpense,
                            budget_limit: weeklyBudget.amount
                        })
                    }).catch(err => console.error('Failed to trigger webhook:', err));
                }
            }
        } else if (tx.type === 'savings') {
            const webhookSetting = settingsRef.current.find(s => s.key === 'n8n_webhook_url');
            const goalAmount = settingsRef.current.find(s => s.key === 'savings_goal_amount');

            if (webhookSetting?.value && goalAmount?.value && balanceRef.current) {
                const newTotalSavings = balanceRef.current.totalSavings + tx.amount;
                const target = parseFloat(goalAmount.value);

                if (newTotalSavings >= target) {
                    fetch(webhookSetting.value, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'savings_goal_reached',
                            message: `Congratulations! You have reached your savings goal of ₱${target}.`,
                            current_savings: newTotalSavings,
                            goal_amount: target
                        })
                    }).catch(err => console.error('Failed to trigger webhook:', err));
                }
            }
        }
    };

    const deleteTransaction = async (id: string) => {
        if (!user) return;
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) {
            console.error('Error deleting transaction:', error);
            throw error;
        }
    };

    const addRecurringPayment = async (payment: Omit<RecurringPayment, 'id'>) => {
        if (!user) return;
        const { error } = await supabase.from('recurring_payments').insert([{ ...payment, user_id: user.id }]);
        if (error) {
            console.error('Error adding recurring payment:', error);
            throw error;
        }
    };

    const deleteRecurringPayment = async (id: string) => {
        if (!user) return;
        const { error } = await supabase.from('recurring_payments').delete().eq('id', id);
        if (error) {
            console.error('Error deleting recurring payment:', error);
            throw error;
        }
    };

    const saveSetting = async (key: string, value: string) => {
        if (!user) return;
        const { error } = await supabase.from('settings').upsert([{
            id: `${user.id}_${key}`,
            key,
            value,
            user_id: user.id
        }]);
        if (error) {
            console.error('Error saving setting:', error);
            throw error;
        }
    };

    const saveBudget = async (type: string, amount: number) => {
        if (!user) return;
        const { error } = await supabase.from('budgets').upsert([{
            id: `${user.id}_${type}`,
            type,
            amount,
            user_id: user.id
        }]);
        if (error) {
            console.error('Error saving budget:', error);
            throw error;
        }
    };

    return {
        transactions,
        balance,
        budgets,
        recurringPayments,
        settings,
        addTransaction,
        deleteTransaction,
        addRecurringPayment,
        deleteRecurringPayment,
        saveSetting,
        saveBudget
    };
}
