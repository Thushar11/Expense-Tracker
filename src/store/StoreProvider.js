import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';

import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS, OTHER_EXPENSE_ID, OTHER_INCOME_ID } from '../constants/defaults';
import { uid } from '../lib/format';

/*
 * Data model (persisted as one JSON object under STORAGE_KEY):
 *
 * Transaction: { id, type: 'expense' | 'income', amount: number, categoryId, note,
 *                date: 'YYYY-MM-DD' (local), paymentMethod: 'cash' | 'card' | 'upi' | 'bank' | 'wallet',
 *                createdAt: ms timestamp }
 * Category:    { id, name, icon: Ionicons name, color: hex, type: 'expense' | 'income', builtIn?: true }
 *              Built-in categories can be edited but not deleted.
 * budgets:     { [categoryId | OVERALL_BUDGET]: monthly limit }
 * settings:    { currency: ISO code, theme: 'system' | 'light' | 'dark' }
 */
const STORAGE_KEY = 'expense-tracker/data/v1';

const initialData = {
  version: 1,
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  budgets: {},
  settings: DEFAULT_SETTINGS,
};

function sortTxs(txs) {
  return [...txs].sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1));
}

function reducer(state, action) {
  switch (action.type) {
    case 'hydrate': {
      const d = action.data ?? {};
      // Make sure built-in categories always exist, even after an app update adds new ones.
      const stored = d.categories ?? [];
      const missing = DEFAULT_CATEGORIES.filter((c) => !stored.some((s) => s.id === c.id));
      return {
        ...initialData,
        ...d,
        version: 1,
        categories: [...stored, ...missing],
        settings: { ...DEFAULT_SETTINGS, ...d.settings },
        transactions: sortTxs(d.transactions ?? []),
        loaded: true,
      };
    }
    case 'addTx':
      return { ...state, transactions: sortTxs([action.tx, ...state.transactions]) };
    case 'addTxs':
      return { ...state, transactions: sortTxs([...action.txs, ...state.transactions]) };
    case 'updateTx':
      return {
        ...state,
        transactions: sortTxs(state.transactions.map((t) => (t.id === action.tx.id ? action.tx : t))),
      };
    case 'deleteTx':
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) };
    case 'upsertCategory': {
      const exists = state.categories.some((c) => c.id === action.category.id);
      return {
        ...state,
        categories: exists
          ? state.categories.map((c) => (c.id === action.category.id ? action.category : c))
          : [...state.categories, action.category],
      };
    }
    case 'deleteCategory': {
      const cat = state.categories.find((c) => c.id === action.id);
      if (!cat || cat.builtIn) return state;
      const fallback = cat.type === 'expense' ? OTHER_EXPENSE_ID : OTHER_INCOME_ID;
      const { [action.id]: _removed, ...budgets } = state.budgets;
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.id),
        transactions: state.transactions.map((t) => (t.categoryId === action.id ? { ...t, categoryId: fallback } : t)),
        budgets,
      };
    }
    case 'setBudget': {
      const budgets = { ...state.budgets };
      if (action.amount && action.amount > 0) budgets[action.key] = action.amount;
      else delete budgets[action.key];
      return { ...state, budgets };
    }
    case 'updateSettings':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'reset':
      return { ...initialData, settings: state.settings, loaded: true };
  }
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { ...initialData, loaded: false });
  const skipNextSave = useRef(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => dispatch({ type: 'hydrate', data: raw ? JSON.parse(raw) : null }))
      .catch(() => dispatch({ type: 'hydrate', data: null }));
  }, []);

  useEffect(() => {
    if (!state.loaded) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const { loaded: _loaded, ...data } = state;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch((e) => console.warn('Failed to save data', e));
  }, [state]);

  const addTransaction = useCallback(
    (tx) => dispatch({ type: 'addTx', tx: { ...tx, id: uid(), createdAt: Date.now() } }),
    [],
  );
  const addTransactions = useCallback(
    (txs) => dispatch({ type: 'addTxs', txs: txs.map((t, i) => ({ ...t, id: uid() + i, createdAt: Date.now() + i })) }),
    [],
  );
  const updateTransaction = useCallback((tx) => dispatch({ type: 'updateTx', tx }), []);
  const deleteTransaction = useCallback((id) => dispatch({ type: 'deleteTx', id }), []);
  const saveCategory = useCallback(
    (c) => dispatch({ type: 'upsertCategory', category: { ...c, id: c.id ?? uid() } }),
    [],
  );
  const deleteCategory = useCallback((id) => dispatch({ type: 'deleteCategory', id }), []);
  const setBudget = useCallback((key, amount) => dispatch({ type: 'setBudget', key, amount }), []);
  const updateSettings = useCallback((patch) => dispatch({ type: 'updateSettings', patch }), []);
  const resetData = useCallback(() => dispatch({ type: 'reset' }), []);

  const categoryById = useMemo(() => new Map(state.categories.map((c) => [c.id, c])), [state.categories]);

  const value = useMemo(
    () => ({
      ...state,
      categoryById,
      addTransaction,
      addTransactions,
      updateTransaction,
      deleteTransaction,
      saveCategory,
      deleteCategory,
      setBudget,
      updateSettings,
      resetData,
    }),
    [
      state,
      categoryById,
      addTransaction,
      addTransactions,
      updateTransaction,
      deleteTransaction,
      saveCategory,
      deleteCategory,
      setBudget,
      updateSettings,
      resetData,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
