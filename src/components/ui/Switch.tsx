'use client';

import { cn } from '@/lib/cn';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  id?: string;
}

/** On/off toggle. The whole row is clickable. */
export function Switch({ checked, onChange, label, description, id }: Props) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-lg border border-line bg-card px-4 py-3 text-left transition hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
      </span>
      <span className={cn('relative inline-flex h-6 w-11 shrink-0 rounded-full transition', checked ? 'bg-primary' : 'bg-line')}>
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full shadow transition-all',
            checked ? 'left-[22px] bg-primary-fg' : 'left-0.5 bg-white',
          )}
        />
      </span>
    </button>
  );
}
