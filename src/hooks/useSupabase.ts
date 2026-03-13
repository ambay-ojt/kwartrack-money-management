import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Transaction, Balance, RecurringPayment, KwarNotification } from '../types';
import { useIndexedDB, OfflineExpense } from './useIndexedDB';
import { format } from 'date-fns';

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

export function useSupabase() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [budgets, setBudgets] = useState<any[]>([]);
    const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
    const [settings, setSettings] = useState<any[]>([]);
    const [balance, setBalance] = useState<Balance | null>(null);
    const [notifications, setNotifications] = useState<KwarNotification[]>([]);

    const settingsRef = useRef<any[]>([]);
    const budgetsRef = useRef<any[]>([]);
    const balanceRef = useRef<Balance | null>(null);
    const notificationsRef = useRef<KwarNotification[]>([]);
    const idb = useIndexedDB();

    useEffect(() => {
        settingsRef.current = settings;
    }, [settings]);

    useEffect(() => {
        budgetsRef.current = budgets;
    }, [budgets]);

    useEffect(() => {
        balanceRef.current = balance;
    }, [balance]);

    useEffect(() => {
        notificationsRef.current = notifications;
    }, [notifications]);

    const loadNotifications = () => {
        if (!user) return;
        const stored = localStorage.getItem(`notifications_${user.id}`);
        if (stored) {
            try { setNotifications(JSON.parse(stored)); } catch (_) {}
        }
    };

    const addNotificationFn = (type: KwarNotification['type'], message: string) => {
        if (!user) return;
        const newNotification: KwarNotification = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            message,
            date: new Date().toISOString(),
            read: false
        };
        const updated = [newNotification, ...notificationsRef.current];
        setNotifications(updated);
        localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
    };

    const markAsRead = (id: string) => {
        if (!user) return;
        const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
        setNotifications(updated);
        localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
    };

    const triggerBudgetWebhook = (alertLevel: string, message: string, newWeeklyExpense: number, budgetAmount: number, percentage: number) => {
        if (!N8N_WEBHOOK_URL) return;
        fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'budget_alert',
                alert_level: alertLevel,
                message,
                current_spend: newWeeklyExpense,
                budget_limit: budgetAmount,
                percentage: percentage.toFixed(1)
            })
        }).catch(err => console.error(`Failed to trigger ${alertLevel} webhook:`, err));
    };

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

        // Check savings reminder (Fridays only)
        if (N8N_WEBHOOK_URL && weeklySavings === 0 && now.getDay() === 5) {
            const lastChecked = localStorage.getItem('savings_reminder_checked');
            const today = format(now, 'yyyy-MM-dd');
            if (lastChecked !== today) {
                fetch(N8N_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'savings_reminder',
                        message: "You haven't allotted money for savings this week."
                    })
                }).catch(err => console.error('Failed to trigger webhook:', err));
                addNotificationFn('warning', "You haven't allotted money for savings this week.");
                localStorage.setItem('savings_reminder_checked', today);
            }
        }
    };

    const syncOfflineExpenses = async () => {
        if (!user || !navigator.onLine) return;
        try {
            const unsynced = await idb.getUnsyncedExpenses();
            for (const expense of unsynced) {
                const { id, synced, ...rest } = expense;
                const { error } = await supabase.from('transactions').insert([{
                    ...rest,
                    user_id: user.id
                }]);
                if (!error) {
                    await idb.markSynced(id);
                }
            }
            if (unsynced.length > 0) {
                addNotificationFn('success', `${unsynced.length} offline expense(s) synced successfully.`);
                fetchData();
            }
        } catch (err) {
            console.error('Failed to sync offline expenses:', err);
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
        loadNotifications();
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

        // Sync offline expenses when back online
        const handleOnline = () => syncOfflineExpenses();
        window.addEventListener('online', handleOnline);

        return () => {
            supabase.removeChannel(channel);
            window.removeEventListener('online', handleOnline);
        };
    }, [user]);

    const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
        if (!user) return;

        const offlineExpense: OfflineExpense = {
            id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            description: tx.description,
            amount: tx.amount,
            category: tx.category,
            type: tx.type,
            date: tx.date,
            synced: navigator.onLine
        };

        // Always save to IndexedDB for offline resilience
        await idb.addOfflineExpense(offlineExpense);

        if (!navigator.onLine) {
            // Offline — update UI immediately from local data
            const fakeTx: Transaction = { ...tx, id: offlineExpense.id };
            setTransactions(prev => [fakeTx, ...prev]);
            calculateBalance([fakeTx, ...transactions]);
            addNotificationFn('info', 'Expense saved offline. It will sync when you reconnect.');
            return;
        }

        // Online — insert to Supabase
        const { error } = await supabase.from('transactions').insert([{ ...tx, user_id: user.id }]);
        if (error) {
            console.error('Error adding transaction:', error);
            throw error;
        }

        // Budget alert logic for expenses
        if (tx.type === 'expense') {
            const weeklyBudget = budgetsRef.current.find(b => b.type === 'weekly');

            if (weeklyBudget?.amount && balanceRef.current) {
                const newWeeklyExpense = balanceRef.current.weeklyExpense + tx.amount;
                const percentage = (newWeeklyExpense / weeklyBudget.amount) * 100;

                let alertLevel: 'warning' | 'risk' | 'exceeded' | '' = '';
                if (percentage >= 100) {
                    alertLevel = 'exceeded';
                } else if (percentage >= 90) {
                    alertLevel = 'risk';
                } else if (percentage >= 75) {
                    alertLevel = 'warning';
                }

                if (alertLevel) {
                    const message = `${alertLevel.toUpperCase()}: You have spent ${percentage.toFixed(1)}% of your weekly budget.`;
                    triggerBudgetWebhook(alertLevel, message, newWeeklyExpense, weeklyBudget.amount, percentage);
                    addNotificationFn(alertLevel, message);
                }
            }
        } else if (tx.type === 'savings') {
            const goalAmount = settingsRef.current.find(s => s.key === 'savings_goal_amount');

            if (goalAmount?.value && balanceRef.current) {
                const newTotalSavings = balanceRef.current.totalSavings + tx.amount;
                const target = parseFloat(goalAmount.value);

                if (newTotalSavings >= target) {
                    const msg = `Congratulations! You have reached your savings goal of \u20B1${target}.`;
                    if (N8N_WEBHOOK_URL) {
                        fetch(N8N_WEBHOOK_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: 'savings_goal_reached', message: msg, current_savings: newTotalSavings, goal_amount: target })
                        }).catch(err => console.error('Failed to trigger webhook:', err));
                    }
                    addNotificationFn('success', msg);
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
        // Persist to localStorage for fast loading
        localStorage.setItem(`kwartrack_budget_${type}`, String(amount));
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
        notifications,
        addTransaction,
        deleteTransaction,
        addRecurringPayment,
        deleteRecurringPayment,
        saveSetting,
        saveBudget,
        markAsRead,
        syncOfflineExpenses
    };
}
