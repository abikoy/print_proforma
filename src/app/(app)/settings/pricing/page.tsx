'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { CommitInput } from '@/components/ui/CommitInput';
import { Alert } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { useData } from '@/features/data/DataContext';
import { parseNonNegative, useSettingsSave } from '@/features/settings/useSettingsSave';
import { formatETB, formatRate } from '@/lib/format';
import { areaCm2 } from '@/lib/pricing';
import { supabase } from '@/lib/supabase/client';
import type { Variant } from '@/types';

export default function PricingSettingsPage() {
  const { categories, variants } = useData();
  const save = useSettingsSave();
  const toast = useToast();

  function commit(v: Variant, field: 'rate' | 'lamination_rate', text: string) {
    const n = parseNonNegative(text);
    if (n === null) {
      toast.error('Enter a number of 0 or more.');
      return;
    }
    return save(() => supabase.from('variants').update({ [field]: n }).eq('id', v.id));
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-base font-semibold text-ink">Pricing rules</h2>
        <p className="mt-1 text-sm text-muted">
          Rates are in ETB. For <strong>per cm²</strong> options the rate and the lamination rate are charged for every cm² of the piece. For <strong>fixed price</strong> options the rate
          is the price of one piece and the lamination rate is a flat extra per piece. Changes save when you leave a field, and each one is recorded in the Price change log.
        </p>
      </Card>

      {categories.length === 0 && (
        <Alert tone="info">
          No categories yet. Add some in <Link href="/settings/categories" className="font-semibold underline">Categories and variants</Link>.
        </Alert>
      )}

      {categories.map((c) => {
        const options = variants.filter((v) => v.category_id === c.id);
        if (options.length === 0) return null;
        return (
          <Card key={c.id} className="!p-0">
            <h3 className="border-b border-line px-5 py-3 text-sm font-semibold text-ink">{c.name}</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted">
                    <th scope="col" className="px-5 py-2">Option</th>
                    <th scope="col" className="px-3 py-2">Method</th>
                    <th scope="col" className="px-3 py-2">Rate (ETB)</th>
                    <th scope="col" className="px-3 py-2">Lamination (ETB)</th>
                    <th scope="col" className="px-3 py-2 text-right">Per piece</th>
                    <th scope="col" className="px-5 py-2 text-right">With lamination</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {options.map((v) => {
                    const perArea = v.pricing_method === 'per_cm2';
                    const area = areaCm2(v.width_cm, v.height_cm);
                    const known = !perArea || area > 0;
                    const base = perArea ? v.rate * area : v.rate;
                    const lam = perArea ? v.lamination_rate * area : v.lamination_rate;
                    return (
                      <tr key={v.id}>
                        <td className="px-5 py-2 font-medium text-ink">{v.name}</td>
                        <td className="px-3 py-2 text-muted">{perArea ? 'per cm²' : 'fixed per piece'}</td>
                        <td className="w-36 px-3 py-2">
                          <CommitInput aria-label={`Rate for ${v.name}`} inputMode="decimal" value={formatRate(v.rate)} onCommit={(t) => commit(v, 'rate', t)} />
                        </td>
                        <td className="w-36 px-3 py-2">
                          <CommitInput aria-label={`Lamination rate for ${v.name}`} inputMode="decimal" value={formatRate(v.lamination_rate)} onCommit={(t) => commit(v, 'lamination_rate', t)} />
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-body">{known ? formatETB(base) : 'size needed'}</td>
                        <td className="px-5 py-2 text-right tabular-nums text-body">{known ? formatETB(base + lam) : 'size needed'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}
      <p className="text-xs text-muted">
        “Per piece” columns show the price of one piece at full price, before the quantity discount. For custom-size categories the size is typed on each quote, so they show “size needed”.
      </p>
    </div>
  );
}
