import type { MetadataRoute } from "next";
import { IS_PRODUCTION_DEPLOY, SITE_URL } from "@/lib/site";

/**
 * Note what is *not* disallowed: `/app/*`. Those pages carry `noindex` from
 * `app/app/layout.tsx`, and Google has to be able to fetch a page in order to
 * see that directive — blocking them in robots.txt would leave the URLs
 * eligible to appear in results with no content behind them, which is the
 * classic way to make this exact problem worse.
 */
export default function robots(): MetadataRoute.Robots {
  if (!IS_PRODUCTION_DEPLOY) {
    // Preview deployments are real, public URLs. Left indexable, they compete
    // with production for the same terms.
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
