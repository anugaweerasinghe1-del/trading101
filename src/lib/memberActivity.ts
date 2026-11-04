interface MemberActivity {
  trades: number;
  previousTrades: number;
  portfolioStatus: string;
  practiceRank: number | null;
  username: string;
  userId: string;
}

/** Server return ranks lead; activity breaks ties and orders unranked members. */
export function compareMemberRank(a: MemberActivity, b: MemberActivity): number {
  return (a.practiceRank ?? Infinity) - (b.practiceRank ?? Infinity)
    || b.trades - a.trades
    || b.previousTrades - a.previousTrades
    || Number(b.portfolioStatus === "imported") - Number(a.portfolioStatus === "imported")
    || a.username.localeCompare(b.username)
    || a.userId.localeCompare(b.userId);
}

/** A public-list position is an ordinal, not a verified performance rank.
 * Preserve server-provided practiceRank (including null and ties), and do not
 * mutate the caller's list when ordering the public directory. */
export function withPublicMemberPositions<T extends MemberActivity>(members: readonly T[]): Array<T & { listPosition: number }> {
  return [...members].sort(compareMemberRank).map((member, index) => ({ ...member, listPosition: index + 1 }));
}
