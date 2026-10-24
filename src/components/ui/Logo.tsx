import { Printer } from 'lucide-react';
import { cn } from '@/lib/cn';

export function LogoTile({ className }: { className?: string }) {
  return (
    <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary-fg', className)}>
      <Printer className="h-6 w-6" aria-hidden />
    </span>
  );
}
