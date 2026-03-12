import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, setDoc, addDoc, deleteDoc, updateDoc, getDocFromServer } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Transaction, Balance, RecurringPayment } from '../types';
import { startOfWeek, endOfWeek, format } from 'date-fns';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function useFirestore() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

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

  useEffect(() => {
    if (!user) return;

    // Transactions
    const qTx = query(
      collection(db, 'transactions'),
      where('user_id', '==', user.uid),
      orderBy('date', 'desc')
    );
    const unsubTx = onSnapshot(qTx, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setTransactions(txs);
      
      // Calculate balance
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
      if (webhookSetting?.value && weeklySavings === 0 && now.getDay() === 5) { // Check on Friday
        const lastChecked = localStorage.getItem('savings_reminder_checked');
        const today = format(now, 'yyyy-MM-dd');
        if (lastChecked !== today) {
          try {
            fetch(webhookSetting.value, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'savings_reminder',
                message: "You haven't allotted money for savings this week."
              })
            });
            localStorage.setItem('savings_reminder_checked', today);
          } catch (error) {
            console.error('Failed to trigger webhook:', error);
          }
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });

    // Budgets
    const qBudgets = query(collection(db, 'budgets'), where('user_id', '==', user.uid));
    const unsubBudgets = onSnapshot(qBudgets, (snapshot) => {
      setBudgets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'budgets');
    });

    // Recurring Payments
    const qPayments = query(collection(db, 'recurring_payments'), where('user_id', '==', user.uid));
    const unsubPayments = onSnapshot(qPayments, (snapshot) => {
      setRecurringPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'recurring_payments');
    });

    // Settings
    const qSettings = query(collection(db, 'settings'), where('user_id', '==', user.uid));
    const unsubSettings = onSnapshot(qSettings, (snapshot) => {
      setSettings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'settings');
    });

    return () => {
      unsubTx();
      unsubBudgets();
      unsubPayments();
      unsubSettings();
    };
  }, [user]);

  const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'transactions'), {
        ...tx,
        user_id: user.uid
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
    }

    // Webhook logic
    if (tx.type === 'expense') {
      const webhookSetting = settingsRef.current.find(s => s.key === 'n8n_webhook_url');
      const weeklyBudget = budgetsRef.current.find(b => b.type === 'weekly');
      
      if (webhookSetting?.value && weeklyBudget?.amount && balanceRef.current) {
        const newWeeklyExpense = balanceRef.current.weeklyExpense + tx.amount;
        const percentage = (newWeeklyExpense / weeklyBudget.amount) * 100;
        
        if (percentage >= 85) {
          try {
            await fetch(webhookSetting.value, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'budget_alert',
                message: `Warning: You have spent ${percentage.toFixed(1)}% of your weekly budget.`,
                current_spend: newWeeklyExpense,
                budget_limit: weeklyBudget.amount
              })
            });
          } catch (error) {
            console.error('Failed to trigger webhook:', error);
          }
        }
      }
    } else if (tx.type === 'savings') {
      const webhookSetting = settingsRef.current.find(s => s.key === 'n8n_webhook_url');
      const goalAmount = settingsRef.current.find(s => s.key === 'savings_goal_amount');
      
      if (webhookSetting?.value && goalAmount?.value && balanceRef.current) {
        const newTotalSavings = balanceRef.current.totalSavings + tx.amount;
        const target = parseFloat(goalAmount.value);
        
        if (newTotalSavings >= target) {
          try {
            await fetch(webhookSetting.value, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'savings_goal_reached',
                message: `Congratulations! You have reached your savings goal of ₱${target}.`,
                current_savings: newTotalSavings,
                goal_amount: target
              })
            });
          } catch (error) {
            console.error('Failed to trigger webhook:', error);
          }
        }
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
    }
  };

  const addRecurringPayment = async (payment: Omit<RecurringPayment, 'id'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'recurring_payments'), {
        ...payment,
        user_id: user.uid
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'recurring_payments');
    }
  };

  const deleteRecurringPayment = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'recurring_payments', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `recurring_payments/${id}`);
    }
  };

  const saveSetting = async (key: string, value: string) => {
    if (!user) return;
    const path = `settings/${user.uid}_${key}`;
    try {
      const settingDoc = doc(db, 'settings', `${user.uid}_${key}`);
      await setDoc(settingDoc, {
        key,
        value,
        user_id: user.uid
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const saveBudget = async (type: string, amount: number) => {
    if (!user) return;
    const path = `budgets/${user.uid}_${type}`;
    try {
      const budgetDoc = doc(db, 'budgets', `${user.uid}_${type}`);
      await setDoc(budgetDoc, {
        type,
        amount,
        user_id: user.uid
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
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

