'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field, Input, Select } from '@/components/ui/Fields';
import { useAuth } from '@/features/auth/AuthContext';
import { useData } from '@/features/data/DataContext';
import { useSettingsSave } from '@/features/settings/useSettingsSave';
import { UNITS, UNIT_NAMES, type Unit } from '@/lib/pricing/units';
import { supabase } from '@/lib/supabase/client';

export default function MeasurementVatPage() {
  const { settings, categories } = useData();
  const { user } = useAuth();
  const save = useSettingsSave();

  const [unit, setUnit] = useState<Unit>(settings?.unit ?? 'cm');
  const [vat, setVat] = useState(String(settings?.vat_rate ?? 15));
  const [days, setDays] = useState(String(settings?.default_validity_days ?? 15));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setUnit(settings.unit);
    setVat(String(settings.vat_rate));
    setDays(String(settings.default_validity_days));
  }, [settings]);

  const vatNum = Number(vat);
  const daysNum = Number(days);
  const vatError = vat.trim() === '' || !Number.isFinite(vatNum) || vatNum < 0 || vatNum > 100 ? 'Enter a rate between 0 and 100.' : null;
  const daysError = !Number.isInteger(daysNum) || daysNum < 1 || daysNum > 3650 ? 'Enter a whole number of days between 1 and 3650.' : null;
  const changed = !!settings && (unit !== settings.unit || vatNum !== settings.vat_rate || daysNum !== settings.default_validity_days);

  async function onSave() {
    if (vatError || daysError || !user) return;
    setSaving(true);
    await save(
      () => supabase.from('user_settings').update({ unit, vat_rate: vatNum, default_validity_days: daysNum }).eq('user_id', user.id),
      'Settings saved',
    );
    setSaving(false);
  }

  return (
    <Card>
      <h2 className="text-base font-semibold text-ink">Measurement and VAT</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label="Default unit for sizes" htmlFor="unit" hint="Used by every category that has no unit of its own (set below). Prices are stored per cm², so nothing needs converting.">          <Select id="unit" value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {UNIT_NAMES[u]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="VAT rate (%)" htmlFor="vat" error={vatError} hint="Used when VAT is switched on for a quote.">
          <Input id="vat" type="number" inputMode="decimal" min={0} max={100} step="any" value={vat} onChange={(e) => setVat(e.target.value)} />
        </Field>
        <Field label="Default quote validity (days)" htmlFor="days" error={daysError} hint="Pre-filled on each new quote; staff can change it per quote.">
          <Input id="days" type="number" inputMode="numeric" min={1} max={3650} value={days} onChange={(e) => setDays(e.target.value)} />
        </Field>
      </div>
      <Button className="mt-6" loading={saving} disabled={!changed || !!vatError || !!daysError} onClick={onSave}>
                Save settings
      </Button>

      <div className="mt-8 border-t border-line pt-6">
        <h3 className="text-base font-semibold text-ink">Unit for each category</h3>
        <p className="mt-1 text-sm text-muted">
          Choose the unit a category is measured and priced in. For example Banners in metres (price per m²) and Business Cards in cm. “Default” uses the unit above. These save as soon as you pick one.
        </p>
        {categories.length === 0 && <p className="mt-3 text-sm text-muted">No categories yet.</p>}
        <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
          {categories.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
              <span className="text-sm font-medium text-ink">{c.name}</span>
              <Select
                aria-label={`Unit for ${c.name}`}
                className="w-56"
                value={c.unit ?? ''}
                onChange={(e) =>
                  save(() => supabase.from('categories').update({ unit: e.target.value === '' ? null : e.target.value }).eq('id', c.id), 'Unit saved')
                }
              >
                <option value="">Default ({UNIT_NAMES[unit]})</option>
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {UNIT_NAMES[u]}
                  </option>
                ))}
              </Select>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
