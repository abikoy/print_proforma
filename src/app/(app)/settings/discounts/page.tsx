'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Feedback';
import { Field, Input } from '@/components/ui/Fields';
import { useAuth } from '@/features/auth/AuthContext';
import { useData } from '@/features/data/DataContext';
import { useSettingsSave } from '@/features/settings/useSettingsSave';
import { formatMoney } from '@/lib/format';
import { discountFactor, validateDiscount, type DiscountSettings } from '@/lib/pricing/discount';
import { supabase } from '@/lib/supabase/client';

const SAMPLE_STEPS = 5;

export default function DiscountsSettingsPage() {
  const { discount } = useData();
  const { user } = useAuth();
  const save = useSettingsSave();

  const [startQty, setStartQty] = useState(String(discount.startQty));
  const [endQty, setEndQty] = useState(String(discount.endQty));
  const [startPct, setStartPct] = useState(String(discount.startPct));
  const [endPct, setEndPct] = useState(String(discount.endPct));
  const [tryQty, setTryQty] = useState('550');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStartQty(String(discount.startQty));
    setEndQty(String(discount.endQty));
    setStartPct(String(discount.startPct));
    setEndPct(String(discount.endPct));
  }, [discount.startQty, discount.endQty, discount.startPct, discount.endPct]);

  const form: DiscountSettings = {
    startQty: Number(startQty),
    endQty: Number(endQty),
    startPct: Number(startPct),
    endPct: Number(endPct),
  };
  const inputsFilled = [startQty, endQty, startPct, endPct].every((t) => t.trim() !== '');
  const problem = inputsFilled ? validateDiscount(form) : 'Fill in all four fields.';
  const changed =
    form.startQty !== discount.startQty || form.endQty !== discount.endQty || form.startPct !== discount.startPct || form.endPct !== discount.endPct;

  const samples = useMemo(() => {
    if (problem) return [];
    const step = (form.endQty - form.startQty) / (SAMPLE_STEPS - 1);
    return Array.from({ length: SAMPLE_STEPS }, (_, i) => Math.round(form.startQty + step * i));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem, form.startQty, form.endQty]);

  const tryNumber = Number(tryQty);
  const tryOk = !problem && Number.isFinite(tryNumber) && tryNumber > 0;

  async function onSave() {
    if (problem || !user) return;
    setSaving(true);
    await save(
      () =>
        supabase
          .from('user_settings')
          .update({
            discount_start_qty: form.startQty,
            discount_end_qty: form.endQty,
            discount_start_pct: form.startPct,
            discount_end_pct: form.endPct,
          })
          .eq('user_id', user.id),
      'Discount settings saved',
    );
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-base font-semibold text-ink">Quantity discounts</h2>
        <p className="mt-1 text-sm text-muted">
          The price percentage falls evenly from the starting percentage at the starting quantity to the ending percentage at the ending quantity. Below the start it stays at the starting
          percentage; above the end it stays at the ending percentage. Every value here can be changed at any time.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Starting quantity" htmlFor="sq" hint="Pieces. At or below this, the starting percentage applies.">
            <Input id="sq" type="number" inputMode="numeric" min={1} value={startQty} onChange={(e) => setStartQty(e.target.value)} />
          </Field>
          <Field label="Ending quantity" htmlFor="eq" hint="Pieces. At or above this, the ending percentage applies.">
            <Input id="eq" type="number" inputMode="numeric" min={2} value={endQty} onChange={(e) => setEndQty(e.target.value)} />
          </Field>
          <Field label="Price at starting quantity (%)" htmlFor="sp" hint="100 means full price.">
            <Input id="sp" type="number" inputMode="decimal" min={0} max={100} step="any" value={startPct} onChange={(e) => setStartPct(e.target.value)} />
          </Field>
          <Field label="Price at ending quantity (%)" htmlFor="ep" hint="50 means half price.">
            <Input id="ep" type="number" inputMode="decimal" min={0} max={100} step="any" value={endPct} onChange={(e) => setEndPct(e.target.value)} />
          </Field>
        </div>

        {problem && inputsFilled && <p role="alert" className="mt-3 text-sm text-danger">{problem}</p>}

        <Button className="mt-5" loading={saving} disabled={!!problem || !changed} onClick={onSave}>
          Save discount settings
        </Button>
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-ink">Try it</h3>
        {problem ? (
          <Alert tone="warning" className="mt-3">Fix the values above to see the preview.</Alert>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <Field label="Quantity" htmlFor="try" className="w-40">
                <Input id="try" type="number" inputMode="numeric" min={1} value={tryQty} onChange={(e) => setTryQty(e.target.value)} />
              </Field>
              <p className="pb-2.5 text-sm text-body" aria-live="polite">
                {tryOk ? (
                  <>
                    At <strong>{tryNumber.toLocaleString('en-US')}</strong> pieces the price is{' '}
                    <strong className="text-accent">{formatMoney(discountFactor(tryNumber, form) * 100)}%</strong> of full price.
                  </>
                ) : (
                  'Enter a quantity to preview.'
                )}
              </p>
            </div>
            <table className="mt-4 w-full max-w-md text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th scope="col" className="py-2">Quantity</th>
                  <th scope="col" className="py-2 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {samples.map((q) => (
                  <tr key={q}>
                    <td className="py-2">{q.toLocaleString('en-US')}</td>
                    <td className="py-2 text-right tabular-nums">{formatMoney(discountFactor(q, form) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Card>
    </div>
  );
}
