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
  const { settings } = useData();
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
        <Field label="Unit for sizes" htmlFor="unit" hint="Only changes how sizes are typed and shown. Prices stay per cm², so nothing needs converting.">
          <Select id="unit" value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
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
    </Card>
  );
}
