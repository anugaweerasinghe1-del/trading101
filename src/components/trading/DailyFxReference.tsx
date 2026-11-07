import { useQuery } from '@tanstack/react-query';
import { FX_REFERENCE_PAIRS, referenceRequestDate, validateFxReferenceBatch, type ReferencePair } from '@/lib/fxReference';
export function DailyFxReference({ assetId }: { assetId: string }) {
  const day = referenceRequestDate();
  const { data, isPending, isError } = useQuery({
    queryKey: ['daily-fx-reference', day], staleTime: 60 * 60 * 1000, retry: false, refetchOnWindowFocus: false,
    queryFn: async ({ signal }) => {
      const response = await fetch('/api/fx-reference', { method: 'GET', credentials: 'omit', signal });
      if (!response.ok) throw Error('Reference unavailable');
      const value = validateFxReferenceBatch(await response.json());
      if (!value) throw Error('Reference unavailable');
      return value;
    },
  });
  const pair = FX_REFERENCE_PAIRS[assetId as ReferencePair], row = data?.rates[assetId as ReferencePair];
  if (!pair) return null;
  return <section aria-label="Daily forex reference" className="rounded-xl border border-border bg-card p-4 space-y-2 text-sm">
    <h2 className="font-semibold text-foreground">Daily forex reference</h2>
    {isPending ? <p role="status" className="text-muted-foreground">Loading reference information…</p> : row && !isError ? <>
      <p className="font-medium tabular-nums">1 {pair[0]} = {new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(row.rate)} {pair[1]}</p>
      <p className="text-muted-foreground">Reference date: <time dateTime={row.date}>{new Date(row.date + 'T00:00:00Z').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}</time> · Daily blended rate</p>
    </> : <p role="status" className="text-muted-foreground">Daily reference information is temporarily unavailable.</p>}
    <p className="text-muted-foreground">For learning and comparison. Your simulator execution price is shown in the order panel; this reference does not set trade prices or portfolio values.</p>
    <a href="https://frankfurter.dev/" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">Source: Frankfurter blended reference rates</a>
  </section>;
}
