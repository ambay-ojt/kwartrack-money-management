export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'savings' | 'payment';
  amount: number;
  category: string | null;
  description: string | null;
  date: string;
}

export interface Budget {
  id: string;
  type: 'weekly' | 'monthly';
  amount: number;
}

export interface RecurringPayment {
  id: string;
  name: string;
  amount: number;
  due_day: number;
}

export interface Setting {
  key: string;
  value: string;
}

export interface KwarNotification {
  id: string;
  type: 'info' | 'warning' | 'risk' | 'exceeded' | 'success';
  message: string;
  date: string;
  read: boolean;
}

export interface Balance {
  remaining: number;
  totalIncome: number;
  totalExpense: number;
  weeklyExpense: number;
  totalSavings: number;
  totalPayment: number;
}
