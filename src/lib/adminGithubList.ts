/** Bounded public observability reads. Never sends an admin key or follows a
 * pagination URL supplied by an API response. A capped list is explicitly partial. */
export async function readAdminGithubList<T>(
  resource: 'issues' | 'pulls',
  assertCurrent: () => void,
  fetchImpl: typeof fetch = fetch,
): Promise<{ items: T[]; complete: boolean }> {
  const items: T[] = [];
  const maxPages = resource === 'issues' ? 4 : 2;
  for (let page = 1; page <= maxPages; page++) {
    assertCurrent();
    const query = new URLSearchParams({ state: resource === 'issues' ? 'all' : 'open', per_page: '100', page: String(page) });
    const response = await fetchImpl('https://api.github.com/repos/anugaweerasinghe1-del/trading101/' + resource + '?' + query, {
      headers: { Accept: 'application/vnd.github+json' }, redirect: 'error', credentials: 'omit',
    });
    assertCurrent();
    if (!response.ok) throw new Error('GitHub ' + resource + ' HTTP ' + response.status);
    const rows: unknown = await response.json();
    assertCurrent();
    if (!Array.isArray(rows) || rows.length > 100) throw new Error('GitHub returned an invalid ' + resource + ' page.');
    items.push(...rows);
    const hasNext = /rel="next"/.test(response.headers.get('Link') ?? '');
    // A full page without exposed Link headers may still have successors.
    if (!hasNext && rows.length < 100) return { items, complete: true };
  }
  return { items, complete: false };
}
