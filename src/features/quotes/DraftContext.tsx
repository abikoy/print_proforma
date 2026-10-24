'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useData } from '@/features/data/DataContext';
import { addDaysISO, todayISO } from '@/lib/format';
import { uid } from '@/lib/uid';
import type { DraftLine, Quote, QuoteLineRow } from '@/types';

export type WizardStep = 1 | 2 | 3 | 4;

export interface Draft {
  step: WizardStep;
  customerName: string;
  issueDate: string;
  validDays: number;
  vatEnabled: boolean;
  vatRate: number;
  categoryId: string | null;
  /** Set while a cart line is being changed in the item step. */
  editingLineId: string | null;
  lines: DraftLine[];
  /** Set when an existing proforma is being edited: saving keeps its number. */
  editingQuoteId: string | null;
  editingNumber: number | null;
}

interface DraftApi {
  draft: Draft;
  update: (patch: Partial<Draft>) => void;
  /** Adds the line, or replaces the existing line with the same id (used when editing a cart line). */
  upsertLine: (line: DraftLine) => void;
  removeLine: (id: string) => void;
  /** Starts a brand-new quote (clears the cart, keeps nothing). */
  reset: () => void;
  /** Loads a saved quote into the wizard. asNew=true makes a copy that gets its own number. */
  loadQuote: (quote: Quote, lines: QuoteLineRow[], asNew: boolean) => void;
}

const KEY = 'pq-draft';
const DraftContext = createContext<DraftApi | null>(null);

/** Last day the quote is valid: issue date plus the validity period. */
export function validUntil(draft: Pick<Draft, 'issueDate' | 'validDays'>): string {
  return addDaysISO(draft.issueDate, draft.validDays);
}

export function DraftProvider({ children }: { children: ReactNode }) {
  const { settings } = useData();

  const blank = useCallback(
    (): Draft => ({
      step: 1,
      customerName: '',
      issueDate: todayISO(),
      validDays: settings?.default_validity_days ?? 15,
      vatEnabled: true,
      vatRate: settings?.vat_rate ?? 15,
      categoryId: null,
      editingLineId: null,
      lines: [],
      editingQuoteId: null,
      editingNumber: null,
    }),
    [settings],
  );

  const [draft, setDraft] = useState<Draft>(() => {
    try {
      const saved = sessionStorage.getItem(KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Draft;
        // A half-typed validity field is saved as null: fall back to the default.
        if (!Number.isInteger(parsed.validDays)) parsed.validDays = settings?.default_validity_days ?? 15;
        return parsed;
      }
    } catch {
      /* no saved draft */
    }
    return blank();
  });

  // Keep the cart across a page refresh (per browser tab).
  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(draft));
    } catch {
      /* storage blocked: the draft just lives in memory */
    }
  }, [draft]);

  const update = useCallback((patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch })), []);
  const upsertLine = useCallback(
    (line: DraftLine) =>
      setDraft((d) => ({
        ...d,
        lines: d.lines.some((l) => l.id === line.id) ? d.lines.map((l) => (l.id === line.id ? line : l)) : [...d.lines, line],
      })),
    [],
  );
  const removeLine = useCallback((id: string) => setDraft((d) => ({ ...d, lines: d.lines.filter((l) => l.id !== id) })), []);
  const reset = useCallback(() => setDraft(blank()), [blank]);

  const loadQuote = useCallback(
    (quote: Quote, rows: QuoteLineRow[], asNew: boolean) => {
      setDraft({
        step: 4,
        customerName: quote.customer_name,
        issueDate: asNew ? todayISO() : quote.issue_date,
        validDays: quote.valid_days,
        vatEnabled: quote.vat_enabled,
        vatRate: quote.vat_rate,
        categoryId: null,
        editingLineId: null,
        lines: rows.map((r) => ({ ...r.snapshot, id: uid() })),
        editingQuoteId: asNew ? null : quote.id,
        editingNumber: asNew ? null : quote.number,
      });
    },
    [],
  );

  const api = useMemo<DraftApi>(
    () => ({ draft, update, upsertLine, removeLine, reset, loadQuote }),
    [draft, update, upsertLine, removeLine, reset, loadQuote],
  );

  return <DraftContext.Provider value={api}>{children}</DraftContext.Provider>;
}

export function useDraft(): DraftApi {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('useDraft must be used inside DraftProvider');
  return ctx;
}
