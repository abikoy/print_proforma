import { Card } from '@/components/ui/Card';
import { formatETB, formatMoney } from '@/lib/format';
import type { LineResult, PricingMethod } from '@/lib/pricing/calc';
import { areaLabel, cm2PerUnit2, type Unit } from '@/lib/pricing/units';

interface Props {
  result: LineResult | null;
  areaCm2: number;
  quantity: number;
  method: PricingMethod | null;
  unit?: Unit;
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className={strong ? 'font-semibold text-ink' : 'text-body'}>{value}</dd>
    </div>
  );
}

/** Live price preview, updates as the user changes size, lamination or quantity. */
export function PricePanel({ result, areaCm2, quantity, method, unit = 'cm' }: Props) {  return (
    <Card className="lg:sticky lg:top-24" aria-live="polite">
      <h3 className="text-base font-semibold text-ink">Price</h3>
      {!result ? (
        <p className="mt-3 text-sm text-muted">Choose an option and enter a quantity to see the price.</p>
      ) : (
        <>
          <dl className="mt-2 divide-y divide-line">
            {method === 'per_cm2' && <Row label="Area" value={`${Number((areaCm2 / cm2PerUnit2(unit)).toFixed(2))} ${areaLabel(unit)}`}/>}
            <Row label="Paper per piece" value={formatETB(result.baseUnit)} />
            {result.laminationUnit > 0 && <Row label="Lamination per piece" value={formatETB(result.laminationUnit)} />}
            <Row label="Before discount" value={formatETB(result.preDiscountUnit)} />
            <Row
              label="Quantity discount"
              value={result.factor < 1 ? `${formatMoney((1 - result.factor) * 100)}% off` : 'None'}
            />
            <Row label="Unit price" value={formatETB(result.unitPrice)} strong />
            <Row label="Quantity" value={quantity.toLocaleString('en-US')} />
          </dl>
          <div className="mt-4 rounded-xl bg-tint px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Line total</p>
            <p className="text-2xl font-bold text-accent">{formatETB(result.lineTotal)}</p>
          </div>
        </>
      )}
    </Card>
  );
}
