'use client';

import { Pencil } from 'lucide-react';
import { useDraft } from '@/features/quotes/DraftContext';
import { formatProformaNumber } from '@/lib/format';

/** Customer, validity and VAT, shown above steps 2 to 4 so staff always know who the quote is for. */
export function SummaryStrip() {
  const { draft, update } = useDraft();
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl border border-line bg-card px-4 py-3 text-sm">
      {draft.editingNumber !== null && (
        <span className="font-semibold text-accent">Editing proforma {formatProformaNumber(draft.editingNumber)}</span>
      )}
      <span>
        <span className="text-muted">Customer: </span>
        <span className="font-semibold text-ink">{draft.customerName}</span>
      </span>
      <span>
        <span className="text-muted">Valid for: </span>
        <span className="font-semibold text-ink">{draft.validDays} days</span>
      </span>
      <span>
        <span className="text-muted">VAT: </span>
        <span className="font-semibold text-ink">{draft.vatEnabled ? `${draft.vatRate}%` : 'Off'}</span>
      </span>
      <button
        type="button"
        onClick={() => update({ step: 1 })}
        className="ml-auto inline-flex items-center gap-1 text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
      </button>
    </div>
  );
}
