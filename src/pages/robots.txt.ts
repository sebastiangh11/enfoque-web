import type { APIRoute } from "astro";

const fallbackSite = "https://enfoque-web.vercel.app";

function getSiteUrl(): string {
  const site = (import.meta.env.SITE ?? fallbackSite).trim();
  return site.endsWith("/") ? site.slice(0, -1) : site;
}

export const GET: APIRoute = () => {
  const site = getSiteUrl();
  const body = `User-agent: *
Allow: /

Sitemap: ${site}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
