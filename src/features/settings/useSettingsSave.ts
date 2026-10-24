'use client';

import { useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';
import { useData } from '@/features/data/DataContext';
import { messageOf } from '@/lib/errors';

type Action = () => PromiseLike<{ error: { message: string } | null }>;

/**
 * Runs a database change from a settings page, reloads the data, and shows a toast.
 * Returns true when the change worked.
 */
export function useSettingsSave() {
  const { reload } = useData();
  const toast = useToast();

  return useCallback(
    async (action: Action, successMessage: string | null = 'Saved'): Promise<boolean> => {
      try {
        const { error } = await action();
        if (error) throw error;
        await reload();
        if (successMessage) toast.success(successMessage);
        return true;
      } catch (e) {
        toast.error(messageOf(e));
        return false;
      }
    },
    [reload, toast],
  );
}

/** "12.5" -> 12.5 ; "" or "abc" or negative -> null */
export function parseNonNegative(text: string): number | null {
  if (text.trim() === '') return null;
  const n = Number(text);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
