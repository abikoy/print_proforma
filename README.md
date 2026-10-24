# PrintQuote frontend

Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase JS client. Every page is a client component that talks
to Supabase directly; row level security in the database keeps each user's data private.

## Scripts
```bash
npm install
npm run dev         # development server on http://localhost:3000
npm run typecheck   # TypeScript check
npm test            # pricing engine tests (vitest)
npm run build       # production build
```
Create `.env.local` from `.env.local.example` first. Without it the app shows a setup screen instead of crashing.

## Folder map (`src/`)

| Folder | Contents |
| --- | --- |
| `app/(auth)/` | Login, sign up, forgot password |
| `app/(app)/` | Signed-in pages: `new-proforma`, `report/[id]`, `history`, `account`, `settings/*` |
| `components/ui/` | Buttons, inputs, switch, toast, dialogs, icons |
| `components/layout/` | Top bar, sidebar, app shell, theme toggle |
| `components/wizard/` | The five quote steps, stepper, price panel |
| `components/report/` | `ProformaDocument`: the printable A4 sheet |
| `features/auth/` | Session and profile (`AuthContext`) |
| `features/data/` | The user's categories, variants, settings and shop (`DataContext`) |
| `features/quotes/` | The draft quote in progress, line building, saving and loading quotes |
| `features/settings/` | Settings section list and the shared save helper |
| `lib/pricing/` | The price engine: units, area, discount, line and total calculation |
| `lib/` | Formatting (ETB, dates, proforma numbers), image resize, Supabase client |
| `styles/tokens.css` | All colors for light and dark. Change brand colors only here |
| `tests/` | Unit tests for the price engine and formatting |

## Price calculation (in `lib/pricing/`)
```
paper cost       = area (cm²) x rate           (or the fixed price per piece)
lamination cost  = area (cm²) x lamination rate (or the flat fee, for fixed-price items)
unit price       = (paper + lamination) x discount factor     rounded to 2 decimals
line total       = unit price x quantity
```
The discount factor goes evenly from the start percentage at the start quantity to the end percentage at the end
quantity, and stays flat outside that range. All four numbers are user settings. The database repeats the totals and
VAT calculation when saving, so what is printed always matches what is stored.

## Printing
`ProformaDocument` uses fixed light colors (not the theme tokens), so the sheet is always black on white. The
`@media print` rules in `styles/globals.css` and the `print:hidden` classes on the app shell hide everything except the sheet.
