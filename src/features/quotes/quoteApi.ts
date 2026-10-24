import { supabase } from '@/lib/supabase/client';
import type { Quote, QuoteLineRow } from '@/types';
import type { Draft } from './DraftContext';

/**
 * Saves the draft through the database function save_quote.
 * New quote  -> the database assigns the next global number (0001, 0002, ...).
 * Existing   -> same row, same number, lines replaced.
 */
export async function saveQuote(draft: Draft): Promise<Quote> {
  const { data, error } = await supabase.rpc('save_quote', {
    p_quote_id: draft.editingQuoteId,
    p_customer_name: draft.customerName.trim(),
    p_issue_date: draft.issueDate,
    p_valid_days: draft.validDays,
    p_vat_enabled: draft.vatEnabled,
    p_lines: draft.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unit_price: l.unitPrice,
      snapshot: l,
    })),
  });
  if (error) throw error;
  return data as Quote;
}

export async function loadQuote(id: string): Promise<{ quote: Quote; lines: QuoteLineRow[] } | null> {
  const [q, l] = await Promise.all([
    supabase.from('quotes').select('*').eq('id', id).maybeSingle(),
    supabase.from('quote_lines').select('*').eq('quote_id', id).order('position'),
  ]);
  if (q.error) throw q.error;
  if (l.error) throw l.error;
  if (!q.data) return null;
  return { quote: q.data as Quote, lines: (l.data ?? []) as QuoteLineRow[] };
}

export async function listQuotes(): Promise<Quote[]> {
  const { data, error } = await supabase.from('quotes').select('*').order('number', { ascending: false }).limit(1000);
  if (error) throw error;
  return (data ?? []) as Quote[];
}
