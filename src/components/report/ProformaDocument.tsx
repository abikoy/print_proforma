import { formatDate, formatMoney, formatProformaNumber } from '@/lib/format';
import type { Quote, QuoteLineRow } from '@/types';

/**
 * The printable proforma. It uses fixed light colors (not theme tokens) so it looks the same
 * on screen in dark mode and on paper. Everything shown comes from the saved quote, including
 * a copy of the shop details, so changing settings later never alters an old proforma.
 */
export function ProformaDocument({ quote, lines }: { quote: Quote; lines: QuoteLineRow[] }) {
  const shop = quote.shop_snapshot;
  const sorted = [...lines].sort((a, b) => a.position - b.position);

  return (
    <article
      className="proforma-sheet mx-auto w-full max-w-[210mm] rounded-lg bg-white p-6 text-slate-900 shadow-card sm:p-10 print:max-w-none print:rounded-none print:p-0 print:shadow-none"
      aria-label={`Proforma ${formatProformaNumber(quote.number)}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-slate-900 pb-5">
        <div className="flex items-start gap-4">
          {shop.logo_data_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shop.logo_data_url} alt="" className="h-16 w-16 object-contain" />
          )}
          <div className="text-sm leading-relaxed">
            <p className="text-xl font-bold">{shop.name || 'Your print shop'}</p>
            {shop.address && <p className="whitespace-pre-line text-slate-600">{shop.address}</p>}
            {shop.phone && <p className="text-slate-600">Tel: {shop.phone}</p>}
            {shop.tax_number && <p className="text-slate-600">TIN: {shop.tax_number}</p>}
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="text-2xl font-bold tracking-wide">PROFORMA</p>
          <p className="mt-1">
            <span className="text-slate-500">No. </span>
            <span className="font-semibold">{formatProformaNumber(quote.number)}</span>
          </p>
          <p>
            <span className="text-slate-500">Date: </span>
            {formatDate(quote.issue_date)}
          </p>
          <p>
            <span className="text-slate-500">Valid until: </span>
            {formatDate(quote.valid_until)}
          </p>
        </div>
      </header>

      <section className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer</p>
          <p className="mt-1 text-base font-semibold">{quote.customer_name}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prepared by</p>
          <p className="mt-1 text-base font-semibold">{quote.prepared_by}</p>
        </div>
      </section>

      <div className="mt-6 overflow-x-auto print:overflow-visible">
        <table className="w-full min-w-[560px] border-collapse text-sm print:min-w-0">
          <thead>
            <tr className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
              <th className="border border-slate-300 px-3 py-2 text-center">No.</th>
              <th className="border border-slate-300 px-3 py-2">Description</th>
              <th className="border border-slate-300 px-3 py-2 text-right">Quantity</th>
              <th className="border border-slate-300 px-3 py-2 text-right">Unit price (ETB)</th>
              <th className="border border-slate-300 px-3 py-2 text-right">Total price (ETB)</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((l, i) => (
              <tr key={l.id} className="break-inside-avoid">
                <td className="border border-slate-300 px-3 py-2 text-center">{i + 1}</td>
                <td className="border border-slate-300 px-3 py-2">{l.description}</td>
                <td className="border border-slate-300 px-3 py-2 text-right tabular-nums">{l.quantity.toLocaleString('en-US')}</td>
                <td className="border border-slate-300 px-3 py-2 text-right tabular-nums">{formatMoney(l.unit_price)}</td>
                <td className="border border-slate-300 px-3 py-2 text-right tabular-nums">{formatMoney(l.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <dl className="w-full max-w-xs text-sm">
          <div className="flex justify-between border-b border-slate-200 py-1.5">
            <dt className="text-slate-600">Subtotal</dt>
            <dd className="tabular-nums">ETB {formatMoney(quote.subtotal)}</dd>
          </div>
          {quote.vat_enabled && (
            <div className="flex justify-between border-b border-slate-200 py-1.5">
              <dt className="text-slate-600">VAT ({quote.vat_rate}%)</dt>
              <dd className="tabular-nums">ETB {formatMoney(quote.vat_amount)}</dd>
            </div>
          )}
          <div className="flex justify-between py-2 text-base font-bold">
            <dt>Grand total</dt>
            <dd className="tabular-nums">ETB {formatMoney(quote.total)}</dd>
          </div>
        </dl>
      </div>

      <footer className="mt-10 break-inside-avoid text-sm">
        {shop.terms && (
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Terms and conditions</p>
            <p className="mt-1 whitespace-pre-line text-slate-700">{shop.terms}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-10 pt-6">
          <div>
            <div className="border-t border-slate-400 pt-1 text-xs text-slate-500">Authorized signature and stamp</div>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-1 text-xs text-slate-500">Customer acceptance (name, signature, date)</div>
          </div>
        </div>
      </footer>
    </article>
  );
}
