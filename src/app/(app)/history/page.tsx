'use client';

import { Copy, Download, Eye, FileClock, FileCode, FileText, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, PageHeader } from '@/components/ui/Card';
import { Alert, EmptyState, Spinner } from '@/components/ui/Feedback';
import { Input } from '@/components/ui/Fields';
import { useToast } from '@/components/ui/Toast';
import { useDraft } from '@/features/quotes/DraftContext';
import { listQuotes, loadQuote } from '@/features/quotes/quoteApi';
import { messageOf } from '@/lib/errors';
import { formatDate, formatMoney, formatProformaNumber } from '@/lib/format';
import type { Quote, QuoteLineRow } from '@/types';

// Export libraries
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

export default function HistoryPage() {
  const router = useRouter();
  const toast = useToast();
  const { loadQuote: startCopy } = useDraft();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listQuotes()
      .then((q) => active && setQuotes(q))
      .catch((e) => active && setError(messageOf(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return quotes.filter((q) => {
      if (needle) {
        const hit =
          q.customer_name.toLowerCase().includes(needle) ||
          formatProformaNumber(q.number).includes(needle) ||
          String(q.number) === needle;
        if (!hit) return false;
      }
      if (from && q.issue_date < from) return false;
      if (to && q.issue_date > to) return false;
      return true;
    });
  }, [quotes, search, from, to]);

  async function duplicate(id: string) {
    setBusyId(id);
    try {
      const res = await loadQuote(id);
      if (!res) throw new Error('Proforma not found.');
      startCopy(res.quote, res.lines, true);
      router.push('/new-proforma');
    } catch (e) {
      toast.error(messageOf(e));
      setBusyId(null);
    }
  }

  // --- EXPORT FUNCTIONALITY (PDF & Word Enhanced) ---

  async function handleExport(quoteId: string, type: 'pdf' | 'word') {
    setExportingId(quoteId);
    setOpenDropdownId(null);
    try {
      const res = await loadQuote(quoteId);
      if (!res) throw new Error('Could not load proforma details.');
      
      const quote = res.quote || res;
      const lines = res.lines || quote.lines || [];
      const customerName = quote.customer_name || 'Customer';
      const quoteNum = formatProformaNumber(quote.number || 1);
      const filename = `Proforma_${quoteNum}_${customerName.replace(/\s+/g, '_')}`;

      if (type === 'pdf') {
        exportToPDF(quote, lines, filename);
      } else if (type === 'word') {
        await exportToWord(quote, lines, filename);
      }
      toast.success(`Exported as ${type.toUpperCase()} successfully!`);
    } catch (e) {
      console.error(e);
      toast.error(messageOf(e));
    } finally {
      setExportingId(null);
    }
  }

  // 1. Upgraded PDF Export (Matches ProformaDocument layout)
  function exportToPDF(quote: Quote, lines: QuoteLineRow[], filename: string) {
    const doc = new jsPDF();
    const shop = quote.shop_snapshot || {};
    const sorted = [...lines].sort((a, b) => a.position - b.position);

    // --- HEADER: Shop Details & Metadata ---
    let startY = 15;
    if (shop.logo_data_url) {
      try {
        doc.addImage(shop.logo_data_url, 'PNG', 14, 12, 18, 18);
      } catch (e) {
        console.warn('Could not render logo in PDF:', e);
      }
    }

    const headerLeftX = shop.logo_data_url ? 36 : 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(shop.name || 'Your print shop', headerLeftX, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let textY = 23;
    if (shop.address) {
      doc.text(shop.address, headerLeftX, textY);
      textY += 5;
    }
    if (shop.phone) {
      doc.text(`Tel: ${shop.phone}`, headerLeftX, textY);
      textY += 5;
    }
    if (shop.tax_number) {
      doc.text(`TIN: ${shop.tax_number}`, headerLeftX, textY);
      textY += 5;
    }

    // Proforma Info (Right Side)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('PROFORMA', 196, 18, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`No. ${formatProformaNumber(quote.number)}`, 196, 24, { align: 'right' });
    doc.text(`Date: ${formatDate(quote.issue_date)}`, 196, 29, { align: 'right' });
    doc.text(`Valid until: ${formatDate(quote.valid_until)}`, 196, 34, { align: 'right' });

    startY = Math.max(textY + 4, 40);
    doc.setLineWidth(0.5);
    doc.setDrawColor(15, 23, 42);
    doc.line(14, startY, 196, startY);

    // --- CUSTOMER & PREPARED BY ---
    startY += 8;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('CUSTOMER', 14, startY);
    doc.text('PREPARED BY', 196, startY, { align: 'right' });

    startY += 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(quote.customer_name || 'N/A', 14, startY);
    doc.text(quote.prepared_by || 'Staff', 196, startY, { align: 'right' });

    // --- ITEMS TABLE ---
    startY += 8;
    const tableRows = sorted.map((l, i) => [
      i + 1,
      l.description,
      l.quantity.toLocaleString('en-US'),
      formatMoney(l.unit_price),
      formatMoney(l.line_total),
    ]);

    autoTable(doc, {
      startY,
      head: [['NO.', 'DESCRIPTION', 'QUANTITY', 'UNIT PRICE (ETB)', 'TOTAL PRICE (ETB)']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [71, 85, 105],
        fontStyle: 'bold',
        fontSize: 8,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 14 },
        2: { halign: 'right', cellWidth: 28 },
        3: { halign: 'right', cellWidth: 36 },
        4: { halign: 'right', cellWidth: 38 },
      },
      styles: {
        fontSize: 9,
        textColor: [15, 23, 42],
        borderColor: [203, 213, 225],
        cellPadding: 3,
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY || startY + 40;

    // --- TOTALS BLOCK ---
    let totalsY = finalY + 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal', 140, totalsY);
    doc.text(`ETB ${formatMoney(quote.subtotal)}`, 196, totalsY, { align: 'right' });

    if (quote.vat_enabled) {
      totalsY += 6;
      doc.text(`VAT (${quote.vat_rate}%)`, 140, totalsY);
      doc.text(`ETB ${formatMoney(quote.vat_amount)}`, 196, totalsY, { align: 'right' });
    }

    totalsY += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Grand total', 140, totalsY);
    doc.text(`ETB ${formatMoney(quote.total)}`, 196, totalsY, { align: 'right' });

    // --- TERMS & SIGNATURES ---
    let footerY = totalsY + 15;
    if (shop.terms) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('TERMS AND CONDITIONS', 14, footerY);

      footerY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const splitTerms = doc.splitTextToSize(shop.terms, 180);
      doc.text(splitTerms, 14, footerY);
      footerY += splitTerms.length * 4 + 10;
    } else {
      footerY += 10;
    }

    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.line(14, footerY, 90, footerY);
    doc.line(120, footerY, 196, footerY);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Authorized signature and stamp', 14, footerY + 4);
    doc.text('Customer acceptance (name, signature, date)', 120, footerY + 4);

    doc.save(`${filename}.pdf`);
  }

  // 2. Upgraded Word Export (.docx)
  async function exportToWord(quote: Quote, lines: QuoteLineRow[], filename: string) {
    const shop = quote.shop_snapshot || {};
    const sorted = [...lines].sort((a, b) => a.position - b.position);

    const tableRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'No.', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Description', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Quantity', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Unit Price (ETB)', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Total Price (ETB)', bold: true })] })] }),
        ],
      }),
      ...sorted.map(
        (l, idx) =>
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(String(idx + 1))] }),
              new TableCell({ children: [new Paragraph(l.description)] }),
              new TableCell({ children: [new Paragraph(l.quantity.toLocaleString('en-US'))] }),
              new TableCell({ children: [new Paragraph(formatMoney(l.unit_price))] }),
              new TableCell({ children: [new Paragraph(formatMoney(l.line_total))] }),
            ],
          })
      ),
    ];

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [new TextRun({ text: shop.name || 'Print Shop', bold: true, size: 24 })],
            }),
            new Paragraph({ text: shop.address || '' }),
            new Paragraph({ text: shop.phone ? `Tel: ${shop.phone}` : '' }),
            new Paragraph({ text: '' }),
            new Paragraph({
              children: [new TextRun({ text: 'PROFORMA INVOICE', bold: true, size: 28 })],
            }),
            new Paragraph({ text: `Proforma No: ${formatProformaNumber(quote.number)}` }),
            new Paragraph({ text: `Issue Date: ${formatDate(quote.issue_date)} | Valid Until: ${formatDate(quote.valid_until)}` }),
            new Paragraph({ text: `Customer: ${quote.customer_name}` }),
            new Paragraph({ text: `Prepared By: ${quote.prepared_by}` }),
            new Paragraph({ text: '' }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: tableRows,
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              children: [new TextRun({ text: `Subtotal: ETB ${formatMoney(quote.subtotal)}` })],
              alignment: AlignmentType.RIGHT,
            }),
            ...(quote.vat_enabled
              ? [
                  new Paragraph({
                    children: [new TextRun({ text: `VAT (${quote.vat_rate}%): ETB ${formatMoney(quote.vat_amount)}` })],
                    alignment: AlignmentType.RIGHT,
                  }),
                ]
              : []),
            new Paragraph({
              children: [new TextRun({ text: `Grand Total: ETB ${formatMoney(quote.total)}`, bold: true, size: 22 })],
              alignment: AlignmentType.RIGHT,
            }),
            new Paragraph({ text: '' }),
            ...(shop.terms
              ? [
                  new Paragraph({ children: [new TextRun({ text: 'Terms and Conditions:', bold: true })] }),
                  new Paragraph({ children: [new TextRun({ text: shop.terms })] }),
                ]
              : []),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${filename}.docx`);
  }

  return (
    <div>
      <PageHeader crumb="Workspace / History" title="History" subtitle="Your saved proformas. Only you can see them." />

      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}

      <Card className="mb-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input
              aria-label="Search by customer or number"
              className="pl-9"
              placeholder="Search by customer or number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Input aria-label="From date" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input aria-label="To date" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </Card>

      {loading ? (
        <Spinner />
      ) : quotes.length === 0 ? (
        <EmptyState
          icon={<FileClock className="h-6 w-6" aria-hidden />}
          title="No proformas yet"
          text="Quotes you generate will appear here so you can reopen, print or copy them."
          action={
            <Link href="/new-proforma">
              <Button>Create a proforma</Button>
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">No proformas match your search.</p>
      ) : (
        <Card className="!p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th scope="col" className="px-4 py-3">No.</th>
                  <th scope="col" className="px-4 py-3">Customer</th>
                  <th scope="col" className="px-4 py-3">Date</th>
                  <th scope="col" className="px-4 py-3 text-right">Total</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((q) => (
                  <tr key={q.id} className="hover:bg-elevated">
                    <td className="px-4 py-3 font-semibold text-ink">
                      <Link href={`/report/${q.id}`} className="hover:underline">
                        {formatProformaNumber(q.number)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink">{q.customer_name}</td>
                    <td className="px-4 py-3">{formatDate(q.issue_date)}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">{formatMoney(q.total)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link href={`/report/${q.id}`}>
                          <Button size="sm" variant="secondary">
                            <Eye className="h-4 w-4" aria-hidden /> View / Print
                          </Button>
                        </Link>

                        {/* --- DOWNLOAD DROPDOWN --- */}
                        <div className="relative inline-block text-left">
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={exportingId === q.id}
                            onClick={() => setOpenDropdownId(openDropdownId === q.id ? null : q.id)}
                          >
                            <Download className="h-4 w-4" aria-hidden /> Download
                          </Button>

                          {openDropdownId === q.id && (
                            <div className="absolute right-0 z-20 mt-1 w-36 rounded-md border border-line bg-surface p-1 shadow-lg">
                              <button
                                onClick={() => handleExport(q.id, 'pdf')}
                                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-ink hover:bg-elevated"
                              >
                                <FileText className="h-3.5 w-3.5 text-red-500" /> PDF Document
                              </button>
                              <button
                                onClick={() => handleExport(q.id, 'word')}
                                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-ink hover:bg-elevated"
                              >
                                <FileCode className="h-3.5 w-3.5 text-blue-500" /> Word (.docx)
                              </button>
                            </div>
                          )}
                        </div>

                        <Button size="sm" variant="ghost" loading={busyId === q.id} onClick={() => duplicate(q.id)}>
                          <Copy className="h-4 w-4" aria-hidden /> Duplicate
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {quotes.length >= 1000 && <p className="mt-3 text-xs text-muted">Showing your 1,000 most recent proformas.</p>}
    </div>
  );
}