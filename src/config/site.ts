export const SITE_NAME = "Enfoque en Medios Publicitarios";
export const SITE_DOMAIN = "https://enfoque-web.vercel.app";
export const DEFAULT_OG_IMAGE = "/images/og-default.png";

export const DEFAULT_SEO = {
  title: "Enfoque en Medios Publicitarios | Branding físico y producción publicitaria en México",
  description:
    "Diseñamos y producimos materiales publicitarios premium para empresas en México. Cotiza por WhatsApp y recibe propuesta en 24 hrs hábiles.",
  image: DEFAULT_OG_IMAGE,
};

export const LOCAL_BUSINESS_SOCIALS = [
  "https://instagram.com/...",
  "https://facebook.com/...",
  "https://linkedin.com/...",
];

export function toAbsoluteUrl(value: string, site: string): string {
  if (!value) return site;
  if (/^https?:\/\//i.test(value)) return value;

  const normalizedSite = site.endsWith("/") ? site.slice(0, -1) : site;
  const normalizedPath = value.startsWith("/") ? value : `/${value}`;
  return `${normalizedSite}${normalizedPath}`;
}
