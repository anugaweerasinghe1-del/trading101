/**
 * An account-recorded milestone is deliberately separate from editable
 * personal learning badges. No browser data or user-supplied award timestamp
 * is accepted as evidence. The caller must read the authenticated user's own
 * RLS-protected, server-recorded trade ledger.
 */
export async function hasOwnServerRecordedPracticeTrade(
  expectedUserId: string | null,
  authenticatedUserId: () => Promise<string | null>,
  readOwnTradeIds: (userId: string) => Promise<Array<{ id: string }>>,
): Promise<boolean> {
  if (!expectedUserId) throw new Error("Sign in to check account-recorded milestones.");
  const authenticatedId = await authenticatedUserId();
  if (authenticatedId !== expectedUserId) throw new Error("The signed-in user changed; try again.");
  const rows = await readOwnTradeIds(expectedUserId);
  if (!Array.isArray(rows)) throw new Error("Server trade evidence unavailable.");
  return rows.some(row => Boolean(row && typeof row.id === "string" && row.id.length > 0));
}
