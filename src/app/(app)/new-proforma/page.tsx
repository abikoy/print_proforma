'use client';

import { useEffect } from 'react';
import { PageHeader } from '@/components/ui/Card';
import { CartStep } from '@/components/wizard/CartStep';
import { CategoryStep } from '@/components/wizard/CategoryStep';
import { CustomerStep } from '@/components/wizard/CustomerStep';
import { ItemStep } from '@/components/wizard/ItemStep';
import { Stepper } from '@/components/wizard/Stepper';
import { SummaryStrip } from '@/components/wizard/SummaryStrip';
import { WelcomeNote } from '@/components/wizard/WelcomeNote';
import { useDraft } from '@/features/quotes/DraftContext';

export default function NewProformaPage() {
  const { draft, update } = useDraft();

  // Steps after the first need a customer name (for example after a page refresh with a cleared draft).
  useEffect(() => {
    if (draft.step > 1 && draft.customerName.trim() === '') update({ step: 1 });
  }, [draft.step, draft.customerName, update]);

  const step = draft.step;
  return (
    <div>
      <PageHeader
        crumb="Workspace / New proforma"
        title={draft.editingNumber !== null ? 'Edit quote' : 'Create a quote'}
      />
      <WelcomeNote />
      <Stepper current={step} onGo={(s) => update({ step: s, editingLineId: null })} />
      {step > 1 && <SummaryStrip />}
      {step === 1 && <CustomerStep />}
      {step === 2 && <CategoryStep />}
      {step === 3 && <ItemStep />}
      {step === 4 && <CartStep />}
    </div>
  );
}
