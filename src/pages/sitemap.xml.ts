import type { APIRoute } from "astro";

const fallbackSite = "https://enfoque-web.vercel.app";

function getSiteUrl(): string {
  const site = (import.meta.env.SITE ?? fallbackSite).trim();
  return site.endsWith("/") ? site.slice(0, -1) : site;
}

export const GET: APIRoute = () => {
  const site = getSiteUrl();
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${site}/sitemap-index.xml</loc>
  </sitemap>
</sitemapindex>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
