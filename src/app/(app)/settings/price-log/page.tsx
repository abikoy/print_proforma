'use client';

import { History, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Alert, EmptyState, Spinner } from '@/components/ui/Feedback';
import { Input } from '@/components/ui/Fields';
import { messageOf } from '@/lib/errors';
import { formatDateTime } from '@/lib/format';
import { supabase } from '@/lib/supabase/client';
import type { PriceLogEntry } from '@/types';

export default function PriceLogPage() {
  const [entries, setEntries] = useState<PriceLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    let active = true;
    supabase
      .from('price_change_log')
      .select('id, changed_at, item, field, old_value, new_value')
      .order('changed_at', { ascending: false })
      .limit(500)
      .then(({ data, error: err }) => {
        if (!active) return;
        if (err) setError(messageOf(err));
        else setEntries((data ?? []) as PriceLogEntry[]);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const shown = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((e) => `${e.item} ${e.field} ${e.old_value ?? ''} ${e.new_value ?? ''}`.toLowerCase().includes(needle));
  }, [entries, filter]);

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-base font-semibold text-ink">Price change log</h2>
        <p className="mt-1 text-sm text-muted">Every change to your prices and discount settings, newest first. Saved proformas keep their own prices, so these changes never alter them.</p>
        <div className="relative mt-4 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input aria-label="Filter the log" className="pl-9" placeholder="Filter by item or value" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
      </Card>

      {error && <Alert tone="danger">{error}</Alert>}
      {loading ? (
        <Spinner />
      ) : entries.length === 0 ? (
        <EmptyState icon={<History className="h-6 w-6" aria-hidden />} title="No changes yet" text="Edits to rates, sizes and discounts will be listed here." />
      ) : (
        <Card className="!p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th scope="col" className="px-4 py-3">When</th>
                  <th scope="col" className="px-4 py-3">Item</th>
                  <th scope="col" className="px-4 py-3">What changed</th>
                  <th scope="col" className="px-4 py-3">Old value</th>
                  <th scope="col" className="px-4 py-3">New value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {shown.map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap px-4 py-2.5 text-muted">{formatDateTime(e.changed_at)}</td>
                    <td className="px-4 py-2.5 text-ink">{e.item}</td>
                    <td className="px-4 py-2.5">{e.field}</td>
                    <td className="px-4 py-2.5 text-muted">{e.old_value ?? '-'}</td>
                    <td className="px-4 py-2.5 font-medium text-ink">{e.new_value ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {shown.length === 0 && <p className="py-8 text-center text-sm text-muted">Nothing matches that filter.</p>}
          </div>
        </Card>
      )}
    </div>
  );
}
