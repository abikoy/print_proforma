'use client';

import { ImagePlus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field, Input, Textarea } from '@/components/ui/Fields';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/AuthContext';
import { useData } from '@/features/data/DataContext';
import { useSettingsSave } from '@/features/settings/useSettingsSave';
import { messageOf } from '@/lib/errors';
import { resizeImageToDataUrl } from '@/lib/image';
import { supabase } from '@/lib/supabase/client';

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export default function ShopProfilePage() {
  const { shop } = useData();
  const { user } = useAuth();
  const save = useSettingsSave();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [tax, setTax] = useState('');
  const [terms, setTerms] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!shop) return;
    setName(shop.name);
    setPhone(shop.phone);
    setAddress(shop.address);
    setTax(shop.tax_number);
    setTerms(shop.terms);
    setLogo(shop.logo_data_url);
  }, [shop]);

  const changed =
    !!shop &&
    (name !== shop.name || phone !== shop.phone || address !== shop.address || tax !== shop.tax_number || terms !== shop.terms || logo !== shop.logo_data_url);

  async function onPickLogo(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      toast.error('That image is larger than 5 MB. Choose a smaller one.');
      return;
    }
    try {
      setLogo(await resizeImageToDataUrl(file));
    } catch (e) {
      toast.error(messageOf(e));
    }
  }

  async function onSave() {
    if (!user) return;
    setSaving(true);
    await save(
      () =>
        supabase
          .from('shop_profiles')
          .update({ name: name.trim(), phone: phone.trim(), address: address.trim(), tax_number: tax.trim(), terms: terms.trim(), logo_data_url: logo })
          .eq('user_id', user.id),
      'Shop profile saved',
    );
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-base font-semibold text-ink">Shop profile</h2>
        <p className="mt-1 text-sm text-muted">These details appear at the top of every new proforma. Proformas you already saved keep the details they were created with.</p>

        <div className="mt-5 flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-line bg-white">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="Shop logo" className="h-full w-full object-contain" />
            ) : (
              <ImagePlus className="h-7 w-7 text-muted" aria-hidden />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" aria-label="Upload logo" onChange={(e) => onPickLogo(e.target.files?.[0])} />
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              {logo ? 'Change logo' : 'Upload logo'}
            </Button>
            {logo && (
              <Button variant="ghost" onClick={() => setLogo(null)}>
                <Trash2 className="h-4 w-4" aria-hidden /> Remove
              </Button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Business name" htmlFor="shop-name">
            <Input id="shop-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </Field>
          <Field label="Phone" htmlFor="shop-phone">
            <Input id="shop-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={60} />
          </Field>
          <Field label="Tax number (TIN)" htmlFor="shop-tax">
            <Input id="shop-tax" value={tax} onChange={(e) => setTax(e.target.value)} maxLength={40} />
          </Field>
          <Field label="Address" htmlFor="shop-address">
            <Textarea id="shop-address" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} />
          </Field>
          <Field label="Terms and conditions" htmlFor="shop-terms" className="sm:col-span-2" hint="Printed at the bottom of the proforma, for example payment terms and delivery time.">
            <Textarea id="shop-terms" rows={4} value={terms} onChange={(e) => setTerms(e.target.value)} maxLength={1000} />
          </Field>
        </div>

        <Button className="mt-6" loading={saving} disabled={!changed} onClick={onSave}>
          Save shop profile
        </Button>
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-ink">Report header preview</h3>
        <div className="mt-3 rounded-lg bg-white p-5 text-slate-900">
          <div className="flex items-start justify-between gap-4 border-b-2 border-slate-900 pb-4">
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {logo && <img src={logo} alt="" className="h-14 w-14 object-contain" />}
              <div className="text-sm">
                <p className="text-lg font-bold">{name || 'Your print shop'}</p>
                {address && <p className="whitespace-pre-line text-slate-600">{address}</p>}
                {phone && <p className="text-slate-600">Tel: {phone}</p>}
                {tax && <p className="text-slate-600">TIN: {tax}</p>}
              </div>
            </div>
            <div className="text-right text-sm">
              <p className="text-xl font-bold">PROFORMA</p>
              <p className="text-slate-500">No. 0001</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
