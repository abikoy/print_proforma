'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

const STEPS = ['Customer', 'Category', 'Item', 'Cart', 'Report'];

interface Props {
  current: number; // 1..4 inside the wizard (5 = report page)
  /** Steps the user may jump back to. */
  onGo?: (step: 1 | 2 | 3 | 4) => void;
}

export function Stepper({ current, onGo }: Props) {
  return (
    <nav aria-label="Progress" className="mb-6">
      <p className="mb-2 text-xs font-medium text-muted sm:hidden">
        Step {current} of 5: {STEPS[current - 1]}
      </p>
      <ol className="flex items-center gap-1 sm:gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          const clickable = done && n <= 4 && !!onGo;
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onGo?.(n as 1 | 2 | 3 | 4)}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-full py-1 pr-1 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:pr-3',
                  active ? 'text-ink' : done ? 'text-body' : 'text-muted',
                  clickable ? 'cursor-pointer hover:text-ink' : 'cursor-default',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                    active && 'border-primary bg-primary text-primary-fg',
                    done && 'border-accent bg-tint text-accent',
                    !active && !done && 'border-line bg-card text-muted',
                  )}
                >
                  {done ? <Check className="h-4 w-4" aria-hidden /> : n}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </button>
              {n < STEPS.length && <span className={cn('h-px flex-1', done ? 'bg-accent' : 'bg-line')} aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
