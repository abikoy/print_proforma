'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Alert } from '@/components/ui/Feedback';

const KEY = 'pq-welcome-seen';

/** Shown once per browser after the first login. */
export function WelcomeNote() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* storage blocked: never show */
    }
  }, []);

  if (!show) return null;
  return (
    <Alert
      tone="info"
      className="mb-4"
      action={
        <button
          type="button"
          className="font-semibold underline"
          onClick={() => {
            try {
              localStorage.setItem(KEY, '1');
            } catch {
              /* ignore */
            }
            setShow(false);
          }}
        >
          Dismiss
        </button>
      }
    >
      Your price list is ready. Review the rates in <Link href="/settings/pricing" className="font-semibold underline">Settings</Link> before you send your first quote.
    </Alert>
  );
}
