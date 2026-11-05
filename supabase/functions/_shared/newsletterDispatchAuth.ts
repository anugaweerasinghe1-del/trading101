import { verifyCoursePublicationOwner } from "./coursePublicationGate.ts";

/**
 * Verify the registered TradeHQ owner's CURRENT Supabase Auth identity before
 * any newsletter send. An admin master key alone is insufficient.
 * No provider call, subscriber read, edition update or email send happens here.
 */
export async function verifyNewsletterDispatchOwner(
  request: Request,
  registeredOwner: () => Promise<string | null>,
  authenticatedUserId: (jwt: string) => Promise<string | null>,
): Promise<boolean> {
  try {
    const ownerId = await registeredOwner();
    return verifyCoursePublicationOwner(request, ownerId ?? undefined, authenticatedUserId);
  } catch {
    // Missing private owner binding / database / Auth outage must not open access.
    return false;
  }
}
