'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { messageOf } from '@/lib/errors';
import type { DiscountSettings } from '@/lib/pricing/discount';
import type { Unit } from '@/lib/pricing/units';
import { supabase } from '@/lib/supabase/client';
import type { Category, ShopProfile, UserSettings, Variant } from '@/types';

interface DataState {
  categories: Category[];
  variants: Variant[];
  settings: UserSettings | null;
  shop: ShopProfile | null;
  loading: boolean;
  error: string | null;
  unit: Unit;
  discount: DiscountSettings;
  /** Re-reads everything from the database. Call after saving in Settings. */
  reload: () => Promise<void>;
}

const DEFAULT_DISCOUNT: DiscountSettings = { startQty: 100, endQty: 1000, startPct: 100, endPct: 50 };

const DataContext = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [categories, setCategories] = useState<Category[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!userId) return;
    try {
      const [cats, vars, sets, shopRow] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order').order('name'),
        supabase.from('variants').select('*').order('sort_order').order('name'),
        supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('shop_profiles').select('*').eq('user_id', userId).maybeSingle(),
      ]);
      const failed = cats.error ?? vars.error ?? sets.error ?? shopRow.error;
      if (failed) throw failed;
      if (!sets.data) {
        throw new Error('Your account has no settings yet. Run the backend migrations (see backend/README.md), then sign up again.');
      }
      setCategories((cats.data ?? []) as Category[]);
      setVariants((vars.data ?? []) as Variant[]);
      setSettings(sets.data as UserSettings);
      setShop((shopRow.data as ShopProfile | null) ?? null);
      setError(null);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    void reload();
  }, [reload]);

  const value = useMemo<DataState>(
    () => ({
      categories,
      variants,
      settings,
      shop,
      loading,
      error,
      unit: settings?.unit ?? 'cm',
      discount: settings
        ? {
            startQty: settings.discount_start_qty,
            endQty: settings.discount_end_qty,
            startPct: settings.discount_start_pct,
            endPct: settings.discount_end_pct,
          }
        : DEFAULT_DISCOUNT,
      reload,
    }),
    [categories, variants, settings, shop, loading, error, reload],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataState {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
