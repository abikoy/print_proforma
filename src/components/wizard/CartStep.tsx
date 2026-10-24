'use client';

import { FilePlus2, Pencil, ShoppingCart, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert, EmptyState } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { useData } from '@/features/data/DataContext';
import { useDraft } from '@/features/quotes/DraftContext';
import { saveQuote } from '@/features/quotes/quoteApi';
import { formatETB, formatMoney } from '@/lib/format';
import { messageOf } from '@/lib/errors';
import { computeTotals } from '@/lib/pricing/calc';

export function CartStep() {
  const router = useRouter();
  const toast = useToast();
  const { categories, variants } = useData();
  const { draft, update, removeLine, reset } = useDraft();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totals = computeTotals(
    draft.lines.map((l) => l.lineTotal),
    draft.vatEnabled,
    draft.vatRate,
  );
  const editingExisting = draft.editingQuoteId !== null;

  function editLine(id: string) {
    const line = draft.lines.find((l) => l.id === id);
    if (!line) return;
    const exists = categories.some((c) => c.id === line.categoryId) && variants.some((v) => v.id === line.variantId);
    if (!exists) {
      toast.error('The category or option for this line was deleted. Remove the line and add it again.');
      return;
    }
    update({ categoryId: line.categoryId, editingLineId: id, step: 3 });
  }

  async function generate() {
    setError(null);
    setSaving(true);
    try {
      const saved = await saveQuote(draft);
      reset();
      router.push(`/report/${saved.id}`);
    } catch (e) {
      setError(messageOf(e));
      setSaving(false);
    }
  }

  if (draft.lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart className="h-6 w-6" aria-hidden />}
        title="Your quote is empty"
        text="Add at least one item to generate the proforma."
        action={
          <Button onClick={() => update({ step: 2 })}>
            <FilePlus2 className="h-4 w-4" aria-hidden /> Add an item
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="min-w-0 !p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <caption className="sr-only">Items in this quote</caption>
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="px-4 py-3">No.</th>
                <th scope="col" className="px-4 py-3">Description</th>
                <th scope="col" className="px-4 py-3 text-right">Quantity</th>
                <th scope="col" className="px-4 py-3 text-right">Unit price</th>
                <th scope="col" className="px-4 py-3 text-right">Total</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {draft.lines.map((l, i) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 text-muted">{i + 1}</td>
                  <td className="px-4 py-3 text-ink">
                    {l.description}
                    {l.discountFactor < 1 && (
                      <span className="mt-0.5 block text-xs text-success">{formatMoney((1 - l.discountFactor) * 100)}% quantity discount applied</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{l.quantity.toLocaleString('en-US')}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatMoney(l.unitPrice)}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">{formatMoney(l.lineTotal)}</td>
                  <td className="whitespace-nowrap px-2 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => editLine(l.id)}
                      aria-label={`Edit line ${i + 1}`}
                      className="rounded-lg p-2 text-body hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLine(l.id)}
                      aria-label={`Delete line ${i + 1}`}
                      className="rounded-lg p-2 text-danger hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="lg:sticky lg:top-24">
          <h3 className="text-base font-semibold text-ink">Summary</h3>
          <dl className="mt-2 divide-y divide-line text-sm">
            <div className="flex justify-between py-2">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular-nums text-ink">{formatETB(totals.subtotal)}</dd>
            </div>
            {draft.vatEnabled && (
              <div className="flex justify-between py-2">
                <dt className="text-muted">VAT ({draft.vatRate}%)</dt>
                <dd className="tabular-nums text-ink">{formatETB(totals.vatAmount)}</dd>
              </div>
            )}
          </dl>
          <div className="mt-3 rounded-xl bg-tint px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Grand total</p>
            <p className="text-2xl font-bold text-accent">{formatETB(totals.total)}</p>
          </div>

          {error && (
            <Alert tone="danger" className="mt-4">
              {error}
            </Alert>
          )}

          <div className="mt-4 space-y-2">
            <Button size="lg" block loading={saving} onClick={generate}>
              {editingExisting ? 'Save changes and view report' : 'Generate Proforma'}
            </Button>
            <Button variant="secondary" block disabled={saving} onClick={() => update({ step: 2, editingLineId: null })}>
              <FilePlus2 className="h-4 w-4" aria-hidden /> Add More Items
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted">
            {editingExisting
              ? 'Saving updates this same proforma and keeps its number.'
              : 'A proforma number will be assigned and the quote saved.'}
          </p>
        </Card>
      </div>
    </div>
  );
}
