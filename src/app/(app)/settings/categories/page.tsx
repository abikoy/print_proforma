'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { CategoryIcon, ICON_KEYS } from '@/components/ui/CategoryIcon';
import { Card } from '@/components/ui/Card';
import { CommitInput } from '@/components/ui/CommitInput';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/Feedback';
import { Input, Select } from '@/components/ui/Fields';
import { useToast } from '@/components/ui/Toast';
import { useData } from '@/features/data/DataContext';
import { useSettingsSave } from '@/features/settings/useSettingsSave';
import { formatDimension, toCm } from '@/lib/pricing';
import { supabase } from '@/lib/supabase/client';
import type { Category, PricingMethod, SizeMode, Variant } from '@/types';

export default function CategoriesSettingsPage() {
  const { categories, variants, unit } = useData();
  const save = useSettingsSave();
  const toast = useToast();

  const [newName, setNewName] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmCat, setConfirmCat] = useState<Category | null>(null);
  const [confirmVar, setConfirmVar] = useState<Variant | null>(null);
  const [busy, setBusy] = useState(false);

  // Keep a valid category selected as categories are added or removed.
  useEffect(() => {
    if (!categories.some((c) => c.id === selectedId)) setSelectedId(categories[0]?.id ?? null);
  }, [categories, selectedId]);

  const selected = categories.find((c) => c.id === selectedId) ?? null;
  const options = variants.filter((v) => v.category_id === selectedId);

  async function addCategory(e: FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const sort = categories.reduce((m, c) => Math.max(m, c.sort_order), 0) + 1;
    const ok = await save(() => supabase.from('categories').insert({ name, icon: 'tag', size_mode: 'preset', sort_order: sort }), 'Category added');
    if (ok) setNewName('');
  }

  const updateCategory = (id: string, patch: Partial<Pick<Category, 'name' | 'icon' | 'size_mode'>>) =>
    save(() => supabase.from('categories').update(patch).eq('id', id));

  async function deleteCategory() {
    if (!confirmCat) return;
    setBusy(true);
    await save(() => supabase.from('categories').delete().eq('id', confirmCat.id), 'Category deleted');
    setBusy(false);
    setConfirmCat(null);
  }

  async function addVariant() {
    if (!selected) return;
    const sort = options.reduce((m, v) => Math.max(m, v.sort_order), 0) + 1;
    await save(
      () =>
        supabase.from('variants').insert({
          category_id: selected.id,
          name: 'New option',
          pricing_method: 'per_cm2',
          rate: 0,
          lamination_rate: 0,
          sort_order: sort,
        }),
      'Option added. Set its rates in Pricing rules.',
    );
  }

  const updateVariant = (id: string, patch: Partial<Pick<Variant, 'name' | 'width_cm' | 'height_cm' | 'pricing_method'>>) =>
    save(() => supabase.from('variants').update(patch).eq('id', id));

  async function deleteVariant() {
    if (!confirmVar) return;
    setBusy(true);
    await save(() => supabase.from('variants').delete().eq('id', confirmVar.id), 'Option deleted');
    setBusy(false);
    setConfirmVar(null);
  }

  /** Width or height typed in the user's unit -> cm for storage. Empty clears it. */
  function commitSize(v: Variant, field: 'width_cm' | 'height_cm', text: string) {
    if (text.trim() === '') return updateVariant(v.id, { [field]: null });
    const n = Number(text);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error('Enter a size larger than 0, or leave it empty.');
      return;
    }
    return updateVariant(v.id, { [field]: Number(toCm(n, unit).toFixed(4)) });
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-base font-semibold text-ink">Categories</h2>
        <p className="mt-1 text-sm text-muted">
          A category is a type of product. “Preset sizes” categories offer fixed options; “Custom size” categories let staff type width and height for each quote.
        </p>

        <form onSubmit={addCategory} className="mt-4 flex gap-2">
          <Input aria-label="New category name" placeholder="New category name, for example Stickers" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={60} />
          <Button type="submit" disabled={!newName.trim()}>
            <Plus className="h-4 w-4" aria-hidden /> Add
          </Button>
        </form>

        {categories.length === 0 ? (
          <div className="mt-4">
            <EmptyState icon={<Plus className="h-6 w-6" aria-hidden />} title="No categories" text="Add your first category above." />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
            {categories.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-tint text-accent">
                  <CategoryIcon name={c.icon} className="h-5 w-5" />
                </span>
                <CommitInput
                  aria-label={`Name of ${c.name}`}
                  className="min-w-[160px] flex-1"
                  value={c.name}
                  maxLength={60}
                  onCommit={(t) => (t.trim() ? updateCategory(c.id, { name: t.trim() }) : toast.error('A category needs a name.'))}
                />
                <Select aria-label={`Icon for ${c.name}`} className="w-32" value={c.icon} onChange={(e) => updateCategory(c.id, { icon: e.target.value })}>
                  {ICON_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </Select>
                <Select
                  aria-label={`Size mode for ${c.name}`}
                  className="w-36"
                  value={c.size_mode}
                  onChange={(e) => updateCategory(c.id, { size_mode: e.target.value as SizeMode })}
                >
                  <option value="preset">Preset sizes</option>
                  <option value="custom">Custom size</option>
                </Select>
                <button
                  type="button"
                  onClick={() => setConfirmCat(c)}
                  aria-label={`Delete ${c.name}`}
                  className="rounded-lg p-2 text-danger hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {selected && (
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink">Options in a category</h2>
              <p className="mt-1 text-sm text-muted">
                {selected.size_mode === 'preset'
                  ? `Sizes are entered in ${unit}. Change the unit in Measurement and VAT.`
                  : 'Staff type the size for each quote, so only the name and pricing method are needed here.'}
              </p>
            </div>
            <Select aria-label="Category to edit" className="w-56" value={selectedId ?? ''} onChange={(e) => setSelectedId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th scope="col" className="pb-2 pr-3">Name</th>
                  {selected.size_mode === 'preset' && <th scope="col" className="pb-2 pr-3">Width ({unit})</th>}
                  {selected.size_mode === 'preset' && <th scope="col" className="pb-2 pr-3">Height ({unit})</th>}
                  <th scope="col" className="pb-2 pr-3">Pricing method</th>
                  <th scope="col" className="pb-2"><span className="sr-only">Delete</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {options.map((v) => {
                  const needsSize = selected.size_mode === 'preset' && v.pricing_method === 'per_cm2' && !(v.width_cm && v.height_cm);
                  return (
                    <tr key={v.id} className="align-top">
                      <td className="py-2 pr-3">
                        <CommitInput
                          aria-label={`Name of option ${v.name}`}
                          value={v.name}
                          maxLength={80}
                          onCommit={(t) => (t.trim() ? updateVariant(v.id, { name: t.trim() }) : toast.error('An option needs a name.'))}
                        />
                        {needsSize && <p className="mt-1 text-xs text-warning">Width and height are needed for per cm² pricing.</p>}
                      </td>
                      {selected.size_mode === 'preset' && (
                        <>
                          <td className="w-28 py-2 pr-3">
                            <CommitInput
                              aria-label={`Width of ${v.name}`}
                              inputMode="decimal"
                              value={v.width_cm ? formatDimension(v.width_cm, unit) : ''}
                              onCommit={(t) => commitSize(v, 'width_cm', t)}
                            />
                          </td>
                          <td className="w-28 py-2 pr-3">
                            <CommitInput
                              aria-label={`Height of ${v.name}`}
                              inputMode="decimal"
                              value={v.height_cm ? formatDimension(v.height_cm, unit) : ''}
                              onCommit={(t) => commitSize(v, 'height_cm', t)}
                            />
                          </td>
                        </>
                      )}
                      <td className="w-44 py-2 pr-3">
                        <Select
                          aria-label={`Pricing method of ${v.name}`}
                          value={v.pricing_method}
                          onChange={(e) => updateVariant(v.id, { pricing_method: e.target.value as PricingMethod })}
                        >
                          <option value="per_cm2">Per cm²</option>
                          <option value="fixed">Fixed price per piece</option>
                        </Select>
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => setConfirmVar(v)}
                          aria-label={`Delete option ${v.name}`}
                          className="rounded-lg p-2 text-danger hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {options.length === 0 && <p className="py-4 text-sm text-muted">No options in this category yet.</p>}
          </div>

          <Button className="mt-4" variant="secondary" onClick={addVariant}>
            <Plus className="h-4 w-4" aria-hidden /> Add option
          </Button>
        </Card>
      )}

      <ConfirmDialog
        open={!!confirmCat}
        title={`Delete “${confirmCat?.name ?? ''}”?`}
        text="This also deletes every option inside it. Proformas you already saved are not affected."
        busy={busy}
        onConfirm={deleteCategory}
        onCancel={() => setConfirmCat(null)}
      />
      <ConfirmDialog
        open={!!confirmVar}
        title={`Delete “${confirmVar?.name ?? ''}”?`}
        text="Proformas you already saved are not affected."
        busy={busy}
        onConfirm={deleteVariant}
        onCancel={() => setConfirmVar(null)}
      />
    </div>
  );
}
