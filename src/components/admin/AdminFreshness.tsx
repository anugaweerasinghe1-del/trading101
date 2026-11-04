export function AdminFreshness({ checkedAt, error, interval = 'one minute' }: {
  checkedAt: Date | null; error?: string; interval?: string;
}) {
  return <div className="text-xs text-muted-foreground space-y-1" aria-label="Administration data freshness">
    <p>Last successful refresh: {checkedAt ? checkedAt.toLocaleString() : 'not yet confirmed'}. Checks run about every {interval} while this desk is visible, and on return or reconnect.</p>
    {error && <p role="status" className="text-amber-600 dark:text-amber-400">{error} Displayed data may be stale. Your unsaved edits are preserved.</p>}
  </div>;
}
