'use client';

import { FilePlus2, Pencil, Printer } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProformaDocument } from '@/components/report/ProformaDocument';
import { Button } from '@/components/ui/Button';
import { Alert, Spinner } from '@/components/ui/Feedback';
import { Stepper } from '@/components/wizard/Stepper';
import { useDraft } from '@/features/quotes/DraftContext';
import { loadQuote } from '@/features/quotes/quoteApi';
import { messageOf } from '@/lib/errors';
import type { Quote, QuoteLineRow } from '@/types';

export default function ReportPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { reset, loadQuote: startEditing } = useDraft();
  const [data, setData] = useState<{ quote: Quote; lines: QuoteLineRow[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadQuote(params.id)
      .then((res) => {
        if (!active) return;
        if (!res) setError('This proforma was not found. It may belong to another account.');
        else setData(res);
      })
      .catch((e) => active && setError(messageOf(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [params.id]);

  if (loading) return <Spinner label="Loading proforma" />;
  if (error || !data) {
    return (
      <div className="space-y-4">
        <Alert tone="danger">{error ?? 'Proforma not found.'}</Alert>
        <Link href="/history" className="text-sm text-accent hover:underline">
          Back to History
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="print:hidden">
        <Stepper current={5} />
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">Saved. Use Print to print on A4 or choose “Save as PDF” in the print window.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4" aria-hidden /> Print / Save as PDF
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                startEditing(data.quote, data.lines, false);
                router.push('/new-proforma');
              }}
            >
              <Pencil className="h-4 w-4" aria-hidden /> Edit Quote
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                reset();
                router.push('/new-proforma');
              }}
            >
              <FilePlus2 className="h-4 w-4" aria-hidden /> New Quote
            </Button>
          </div>
        </div>
      </div>
      <ProformaDocument quote={data.quote} lines={data.lines} />
    </div>
  );
}
