import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { HOLDINGS } from '../data/holdings';
import { MAX_AMOUNT_CENTS, sortedNewestFirst } from '../data/amounts';
import { cashCentsFor, validateStoredBudget } from '../data/budget';

const STORAGE_KEY = '@dineromio/cortes-v1';
const SnapshotContext = createContext(null);

function validateStoredSnapshots(value) {
  if (!Array.isArray(value)) {
    throw new Error('El historial tiene un formato inesperado.');
  }

  return value.map((snapshot) => {
    if (
      !snapshot
      || typeof snapshot.id !== 'string'
      || typeof snapshot.createdAt !== 'string'
      || Number.isNaN(new Date(snapshot.createdAt).getTime())
      || !snapshot.values
      || typeof snapshot.values !== 'object'
    ) {
      throw new Error('Uno de los cortes guardados no se puede leer.');
    }

    const values = {};

    for (const holding of HOLDINGS) {
      const amount = snapshot.values[holding.key];

      if (!Number.isSafeInteger(amount) || amount < 0 || amount > MAX_AMOUNT_CENTS) {
        throw new Error('Uno de los saldos guardados no es válido.');
      }

      values[holding.key] = amount;
    }

    return {
      id: snapshot.id,
      createdAt: snapshot.createdAt,
      updatedAt: typeof snapshot.updatedAt === 'string' ? snapshot.updatedAt : snapshot.createdAt,
      values,
      budget: validateStoredBudget(snapshot.budget, cashCentsFor(values)),
    };
  });
}

function createSnapshotId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function SnapshotProvider({ children }) {
  const [snapshots, setSnapshots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState('');

  const reload = useCallback(async () => {
    setIsLoading(true);
    setStorageError('');

    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      setSnapshots(sortedNewestFirst(validateStoredSnapshots(parsed)));
    } catch {
      setStorageError('No pudimos leer los cortes guardados. Intenta cargar el historial otra vez.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const saveSnapshot = useCallback(async ({ id, values, budget = null }) => {
    if (isLoading || storageError) {
      throw new Error('Espera a que el historial esté listo antes de guardar.');
    }

    const now = new Date().toISOString();
    for (const { key } of HOLDINGS) {
      if (!Number.isSafeInteger(values[key]) || values[key] < 0 || values[key] > MAX_AMOUNT_CENTS) {
        throw new Error('Revisa los saldos antes de guardar el corte.');
      }
    }
    const validBudget = validateStoredBudget(budget, cashCentsFor(values));
    const current = id ? snapshots.find((snapshot) => snapshot.id === id) : null;

    if (id && !current) {
      throw new Error('No encontramos ese corte. Regresa al historial y vuelve a intentarlo.');
    }

    const nextSnapshot = current
      ? { ...current, values, budget: validBudget, updatedAt: now }
      : { id: createSnapshotId(), createdAt: now, updatedAt: now, values, budget: validBudget };
    const nextSnapshots = sortedNewestFirst([
      nextSnapshot,
      ...snapshots.filter((snapshot) => snapshot.id !== nextSnapshot.id),
    ]);

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextSnapshots));
    setSnapshots(nextSnapshots);

    return nextSnapshot;
  }, [isLoading, snapshots, storageError]);

  const deleteSnapshot = useCallback(async (snapshotId) => {
    if (isLoading || storageError) {
      throw new Error('Espera a que el historial esté listo antes de eliminar un corte.');
    }

    const nextSnapshots = snapshots.filter((snapshot) => snapshot.id !== snapshotId);

    if (nextSnapshots.length === snapshots.length) {
      return;
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextSnapshots));
    setSnapshots(nextSnapshots);
  }, [isLoading, snapshots, storageError]);

  const value = useMemo(() => ({
    snapshots,
    isLoading,
    storageError,
    reload,
    saveSnapshot,
    deleteSnapshot,
  }), [deleteSnapshot, isLoading, reload, saveSnapshot, snapshots, storageError]);

  return (
    <SnapshotContext.Provider value={value}>
      {children}
    </SnapshotContext.Provider>
  );
}

export function useSnapshots() {
  const context = useContext(SnapshotContext);

  if (!context) {
    throw new Error('useSnapshots debe usarse dentro de SnapshotProvider.');
  }

  return context;
}
