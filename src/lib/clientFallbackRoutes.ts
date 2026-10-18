import { ASSETS } from "./assets";
import { LEARN_ARTICLES } from "./learnArticles";

const assetIds = new Set(ASSETS.map(asset => asset.id));
const articleIds = new Set(LEARN_ARTICLES.map(article => article.slug));
const fixedRoutes = new Set([
  "/auth", "/reset-password", "/admin", "/admin/ai", "/admin/courses",
  "/admin/reviews", "/admin/daily", "/admin/validator", "/admin/seo-audit", "/admin/editor",
  "/challenge",
]);

/** Only known application states may use a successful SPA fallback response. */
export function isClientFallbackRoute(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (fixedRoutes.has(path)) return true;
  const asset = path.match(/^\/trade\/([^/]+)$/);
  if (asset) return assetIds.has(asset[1].toLowerCase());
  const article = path.match(/^\/learn\/article\/([^/]+)$/);
  if (article) return articleIds.has(article[1]);
  return /^\/trader\/[^/]+$/.test(path) || /^\/challenge\/[^/]+$/.test(path);
}
