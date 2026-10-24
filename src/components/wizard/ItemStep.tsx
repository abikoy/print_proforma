'use client';

import { ArrowLeft, Plus, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Feedback';
import { Field, Input } from '@/components/ui/Fields';
import { useData } from '@/features/data/DataContext';
import { useDraft } from '@/features/quotes/DraftContext';
import { buildLine } from '@/features/quotes/buildLine';
import { cn } from '@/lib/cn';
import { formatRate } from '@/lib/format';
import { areaCm2, computeLine, formatDimension, formatSize, toCm } from '@/lib/pricing';
import { uid } from '@/lib/uid';
import { PricePanel } from './PricePanel';

const QUICK_ADD = [100, 500, 1000];

/** Text from an input to a positive number, or null. */
function parsePositive(text: string): number | null {
  const n = Number(text);
  return text.trim() !== '' && Number.isFinite(n) && n > 0 ? n : null;
}

export function ItemStep() {
  const { categories, variants, unit, discount } = useData();
  const { draft, update, upsertLine } = useDraft();

  const category = categories.find((c) => c.id === draft.categoryId) ?? null;
  const options = useMemo(() => variants.filter((v) => v.category_id === category?.id), [variants, category?.id]);
  const editing = draft.lines.find((l) => l.id === draft.editingLineId) ?? null;

  const [variantId, setVariantId] = useState<string | null>(null);
  const [widthText, setWidthText] = useState('');
  const [heightText, setHeightText] = useState('');
  const [note, setNote] = useState('');
  const [laminated, setLaminated] = useState(false);
  const [qtyText, setQtyText] = useState('100');

  // Prefill when a cart line is being edited.
  useEffect(() => {
    if (!editing) return;
    setVariantId(editing.variantId);
    setWidthText(editing.widthCm ? formatDimension(editing.widthCm, unit) : '');
    setHeightText(editing.heightCm ? formatDimension(editing.heightCm, unit) : '');
    setNote(editing.note);
    setLaminated(editing.laminated);
    setQtyText(String(editing.quantity));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.editingLineId]);

  // Select the only option automatically.
  useEffect(() => {
    if (!editing && options.length === 1) setVariantId(options[0].id);
  }, [options, editing]);

  if (!category) {
    return (
      <Alert tone="warning" action={<Button size="sm" onClick={() => update({ step: 2 })}>Choose a category</Button>}>
        That category no longer exists.
      </Alert>
    );
  }

  const variant = options.find((v) => v.id === variantId) ?? null;
  const custom = category.size_mode === 'custom';
  const perArea = variant?.pricing_method === 'per_cm2';

  const widthCm = custom ? (parsePositive(widthText) !== null ? toCm(Number(widthText), unit) : null) : variant?.width_cm ?? null;
  const heightCm = custom ? (parsePositive(heightText) !== null ? toCm(Number(heightText), unit) : null) : variant?.height_cm ?? null;
  const area = areaCm2(widthCm, heightCm);
  const quantity = Number.parseInt(qtyText, 10);
  const qtyOk = Number.isInteger(quantity) && quantity >= 1 && String(quantity) === qtyText.trim();

  let problem: string | null = null;
  if (variant && perArea && area <= 0) {
    problem = custom
      ? `Enter the width and height in ${unit}.`
      : 'This option has no size set. Add its width and height in Settings, Categories and variants.';
  }

  const result =
    variant && qtyOk && !problem
      ? computeLine({
          method: variant.pricing_method,
          rate: variant.rate,
          laminationRate: variant.lamination_rate,
          areaCm2: area,
          laminated,
          quantity,
          discount,
        })
      : null;

  const canAdd = !!variant && qtyOk && !problem;

  function submit() {
    if (!category || !variant || !canAdd) return;
    const line = buildLine({
      id: editing?.id ?? uid(),
      category,
      variant,
      widthCm,
      heightCm,
      note,
      laminated,
      quantity,
      discount,
      unit,
    });
    upsertLine(line);
    update({ step: 4, editingLineId: null });
  }

  const addQty = (n: number) => setQtyText(String((qtyOk ? quantity : 0) + n));

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => update({ step: editing ? 4 : 2, editingLineId: null })}
          className="rounded-lg p-2 text-body hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-ink">{category.name}</h2>
          <p className="text-sm text-muted">{editing ? 'Change this line, then update it.' : 'Pick an option, then set lamination and quantity.'}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <h3 className="mb-3 text-base font-semibold text-ink">{custom ? 'Material or option' : 'Size and paper'}</h3>
            {options.length === 0 ? (
              <Alert tone="warning">This category has no options yet. Add one in Settings, Categories and variants.</Alert>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {options.map((v) => {
                  const selected = v.id === variantId;
                  const size = formatSize(v.width_cm, v.height_cm, unit);
                  return (
                    <li key={v.id}>
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setVariantId(v.id)}
                        className={cn(
                          'w-full rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                          selected ? 'border-accent bg-tint' : 'border-line bg-card hover:bg-elevated',
                        )}
                      >
                        <span className="block text-sm font-semibold text-ink">{v.name}</span>
                        {!custom && size && <span className="block text-sm text-body">{size}</span>}
                        <span className="mt-1 block text-xs text-muted">
                          {v.pricing_method === 'per_cm2' ? `ETB ${formatRate(v.rate)} per cm²` : `Fixed ETB ${formatRate(v.rate)} per piece`}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {custom && variant && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label={`Width (${unit})`} htmlFor="width">
                  <Input id="width" type="number" inputMode="decimal" min="0" step="any" value={widthText} onChange={(e) => setWidthText(e.target.value)} />
                </Field>
                <Field label={`Height (${unit})`} htmlFor="height">
                  <Input id="height" type="number" inputMode="decimal" min="0" step="any" value={heightText} onChange={(e) => setHeightText(e.target.value)} />
                </Field>
                <Field label="Description (optional)" htmlFor="note" className="sm:col-span-2" hint="Shown on the report, for example “Rollup banner, full colour”.">
                  <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} />
                </Field>
              </div>
            )}
            {problem && <p className="mt-3 text-sm text-warning">{problem}</p>}
          </Card>

          <Card>
            <h3 className="mb-3 text-base font-semibold text-ink">Options</h3>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-line px-4 py-3 hover:bg-elevated">
              <input
                type="checkbox"
                checked={laminated}
                onChange={(e) => setLaminated(e.target.checked)}
                className="h-5 w-5 rounded border-line accent-[rgb(var(--accent))]"
              />
              <span>
                <span className="block text-sm font-medium text-ink">Include lamination</span>
                <span className="block text-xs text-muted">
                  {variant
                    ? variant.pricing_method === 'per_cm2'
                      ? `ETB ${formatRate(variant.lamination_rate)} per cm²`
                      : `ETB ${formatRate(variant.lamination_rate)} per piece`
                    : 'Priced from your settings'}
                </span>
              </span>
            </label>

            <div className="mt-5">
              <Field label="Quantity" htmlFor="qty" error={qtyText !== '' && !qtyOk ? 'Enter a whole number of 1 or more.' : null}>
                <Input id="qty" type="number" inputMode="numeric" min={1} step={1} value={qtyText} onChange={(e) => setQtyText(e.target.value)} />
              </Field>
              <div className="mt-2 flex flex-wrap gap-2">
                {QUICK_ADD.map((n) => (
                  <Button key={n} size="sm" variant="secondary" onClick={() => addQty(n)}>
                    +{n.toLocaleString('en-US')}
                  </Button>
                ))}
                <Button size="sm" variant="ghost" onClick={() => setQtyText('1')}>
                  Reset
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <PricePanel result={result} areaCm2={area} quantity={qtyOk ? quantity : 0} method={variant?.pricing_method ?? null} />
          <Button size="lg" block disabled={!canAdd} onClick={submit}>
            {editing ? (
              <>
                <Save className="h-4 w-4" aria-hidden /> Update line
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" aria-hidden /> Add to Quote Cart
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
