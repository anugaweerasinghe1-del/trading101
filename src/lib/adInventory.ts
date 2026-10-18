/** Manual-placement eligibility only. Does not load ads, set consent or enable Auto Ads. */
export type AdScreen = {
  pathname: string;
  siteApproved?: boolean;
  publishedPublisherContent?: boolean;
  loading?: boolean;
  error?: boolean;
};

/** Default deny is independent of Search robots/noindex and of advertising consent. */
export function isEligibleAdScreen(screen: AdScreen): boolean {
  if (!screen.siteApproved || !screen.publishedPublisherContent || screen.loading || screen.error) return false;
  const path = screen.pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  // Application, authentication, administration and community states are not reviewed ad inventory.
  if (/^\/(?:auth|reset-password|admin|trader|portfolio|trade|markets|leaderboard|reviews|daily|challenge|ai-mentor)(?:\/|$)/.test(path)) return false;
  // Even on these editorial families, the caller must verify a published substantive page.
  return path === "/" || /^\/(?:learn\/article|learn\/country|courses|wiki|compare|how-to-trade|strategy)(?:\/|$)/.test(path);
}
