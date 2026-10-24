'use client';

import { ArrowUpRight, Settings } from 'lucide-react';
import Link from 'next/link';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { useData } from '@/features/data/DataContext';
import { useDraft } from '@/features/quotes/DraftContext';

export function CategoryStep() {
  const { categories, variants } = useData();
  const { update } = useDraft();

  if (categories.length === 0) {
    return (
      <EmptyState
        icon={<Settings className="h-6 w-6" aria-hidden />}
        title="No categories yet"
        text="Create at least one category with a variant in Settings, then come back to build a quote."
        action={
          <Link href="/settings/categories">
            <Button>Open Settings</Button>
          </Link>
        }
      />
    );
  }

  return (
    <section aria-labelledby="category-title">
      <div className="mb-4">
        <h2 id="category-title" className="text-lg font-semibold text-ink">
          Choose a category
        </h2>
        <p className="text-sm text-muted">Select the type of product you want to quote.</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => {
          const count = variants.filter((v) => v.category_id === c.id).length;
          const subtitle =
            count === 0 ? 'No options yet' : c.size_mode === 'custom' ? `${count} option${count === 1 ? '' : 's'}, custom size` : `${count} option${count === 1 ? '' : 's'}`;
          return (
            <li key={c.id}>
              <button
                type="button"
                disabled={count === 0}
                onClick={() => update({ categoryId: c.id, editingLineId: null, step: 3 })}
                className="group flex h-full min-h-[132px] w-full flex-col rounded-2xl border border-line bg-card p-5 text-left shadow-card transition hover:border-accent hover:bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-line disabled:hover:bg-card"
              >
                <span className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-tint text-accent">
                    <CategoryIcon name={c.icon} className="h-6 w-6" />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-muted transition group-hover:text-accent" aria-hidden />
                </span>
                <span className="mt-auto pt-4">
                  <span className="block text-base font-semibold text-ink">{c.name}</span>
                  <span className="block text-xs text-muted">{subtitle}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
