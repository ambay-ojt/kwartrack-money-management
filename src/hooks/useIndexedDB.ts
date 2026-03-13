/**
 * useIndexedDB - Hook for offline expense storage using IndexedDB (kwartrackDB)
 */

const DB_NAME = 'kwartrackDB';
const DB_VERSION = 1;
const STORE_NAME = 'expenses';

export interface OfflineExpense {
  id: string;
  description: string | null;
  amount: number;
  category: string | null;
  type: 'expense' | 'income' | 'savings' | 'payment';
  date: string;
  synced: boolean;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('synced', 'synced', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const useIndexedDB = () => {
  const addOfflineExpense = async (expense: OfflineExpense): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(expense);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  };

  const getUnsyncedExpenses = async (): Promise<OfflineExpense[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('synced');
      const req = index.getAll(IDBKeyRange.only(false));
      req.onsuccess = () => {
        resolve(req.result);
        db.close();
      };
      req.onerror = () => reject(req.error);
    });
  };

  const getAllExpenses = async (): Promise<OfflineExpense[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        resolve(req.result);
        db.close();
      };
      req.onerror = () => reject(req.error);
    });
  };

  const markSynced = async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const record = getReq.result;
        if (record) {
          record.synced = true;
          store.put(record);
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
      tx.oncomplete = () => db.close();
    });
  };

  const deleteExpense = async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  };

  return {
    addOfflineExpense,
    getUnsyncedExpenses,
    getAllExpenses,
    markSynced,
    deleteExpense,
  };
};
