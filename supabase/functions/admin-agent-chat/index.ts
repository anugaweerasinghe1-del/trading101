import { createAdminAgentChat } from '../_shared/adminAgentChat.ts';
import { allow } from '../_shared/rateLimit.ts';

Deno.serve(createAdminAgentChat({
  getAdminKey: () => Deno.env.get('ADMIN_MASTER_KEY'),
  // Deliberately no reuse/fallback to another provider key of unverified origin.
  getGeminiKey: () => Deno.env.get('TRADEHQ_ADMIN_CHAT_GEMINI_KEY'),
  getFreeReviewAt: () => Deno.env.get('TRADEHQ_ADMIN_CHAT_FREE_REVIEW_AT'),
  allow,
}));
