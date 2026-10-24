'use client';

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Fields';
import { Switch } from '@/components/ui/Switch';
import { useAuth } from '@/features/auth/AuthContext';
import { useDraft, validUntil } from '@/features/quotes/DraftContext';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';

const QUICK_DAYS = [7, 15, 30];

export function CustomerStep() {
  const { draft, update } = useDraft();
  const { profile, user } = useAuth();
  const preparedBy = profile?.full_name || user?.email || 'Signed-in staff member';
  const daysValid = Number.isInteger(draft.validDays) && draft.validDays >= 1 && draft.validDays <= 3650;
  const canContinue = draft.customerName.trim().length > 0 && daysValid && !!draft.issueDate;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-ink">Customer details</h2>
      <form
        className="mt-4 grid gap-5 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (canContinue) update({ step: 2 });
        }}
      >
        <Field label="Customer or company name *" htmlFor="customer" className="md:col-span-2">
          <Input
            id="customer"
            autoFocus
            required
            value={draft.customerName}
            onChange={(e) => update({ customerName: e.target.value })}
            placeholder="Customer or company name"
          />
        </Field>

        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">Prepared by</p>
          <p className="rounded-lg border border-line bg-elevated px-3 py-2.5 text-sm text-body">{preparedBy}</p>
        </div>

        <Field label="Issue date" htmlFor="issue-date">
          <Input id="issue-date" type="date" required value={draft.issueDate} onChange={(e) => update({ issueDate: e.target.value })} />
        </Field>

        <Field
          label="Valid for (days)"
          htmlFor="valid-days"
          error={!daysValid ? 'Enter a whole number of days between 1 and 3650.' : null}
          hint={daysValid && draft.issueDate ? `Valid until ${formatDate(validUntil(draft))}` : undefined}
        >
          <Input
            id="valid-days"
            type="number"
            inputMode="numeric"
            min={1}
            max={3650}
            value={Number.isNaN(draft.validDays) ? '' : draft.validDays}
            onChange={(e) => update({ validDays: e.target.value === '' ? NaN : Number(e.target.value) })}
          />
          <div className="mt-2 flex gap-2">
            {QUICK_DAYS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => update({ validDays: d })}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  draft.validDays === d ? 'border-accent bg-tint text-ink' : 'border-line text-body hover:bg-elevated',
                )}
              >
                {d} days
              </button>
            ))}
          </div>
        </Field>

        <div className="self-start">
          <p className="mb-1.5 text-sm font-medium text-ink">Tax</p>
          <Switch
            checked={draft.vatEnabled}
            onChange={(vatEnabled) => update({ vatEnabled })}
            label="Add VAT to this quote"
            description={draft.vatEnabled ? `${draft.vatRate}% will be added to the subtotal.` : 'No VAT line on the report.'}
          />
        </div>

        <div className="md:col-span-2">
          <Button type="submit" size="lg" block disabled={!canContinue}>
            Continue <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </form>
    </Card>
  );
}
