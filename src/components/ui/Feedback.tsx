import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-muted">
      <Loader2 className="h-5 w-5 animate-spin text-accent" aria-hidden />
      {label}
    </div>
  );
}

type Tone = 'info' | 'success' | 'warning' | 'danger';

const TONES: Record<Tone, { box: string; icon: typeof Info }> = {
  info: { box: 'border-info/30 bg-info/10 text-info', icon: Info },
  success: { box: 'border-success/30 bg-success/10 text-success', icon: CheckCircle2 },
  warning: { box: 'border-warning/30 bg-warning/10 text-warning', icon: AlertTriangle },
  danger: { box: 'border-danger/30 bg-danger/10 text-danger', icon: XCircle },
};

export function Alert({ tone = 'info', children, className, action }: { tone?: Tone; children: ReactNode; className?: string; action?: ReactNode }) {
  const { box, icon: Icon } = TONES[tone];
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex items-start gap-3 rounded-lg border px-4 py-3 text-sm', box, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-tint text-accent">{icon}</div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
