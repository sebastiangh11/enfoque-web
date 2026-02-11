import { createHash } from "node:crypto";
import type { APIRoute } from "astro";

export const prerender = false;

interface LeadPayload {
  nombre: string;
  empresa?: string;
  telefono_whatsapp?: string;
  email?: string;
  ciudad_estado?: string;
  servicio?: string;
  tipoProyecto?: string;
  mensaje?: string;
  website?: string;
}

interface ApiSuccessResponse {
  ok: true;
  message: string;
  data: {
    contactId: string;
    companyId?: string;
    dealId: string;
  };
  email: {
    internalSent: boolean;
    userSent: boolean;
    warning?: string;
  };
}

interface ApiErrorResponse {
  ok: false;
  error: string;
}

interface HubSpotSearchResponse {
  results?: Array<{ id: string }>;
}

interface HubSpotObjectResponse {
  id: string;
}

interface SendEmailResendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
  idempotencyKey?: string;
}

interface NormalizedLeadFields {
  nombre: string;
  empresa: string;
  telefonoWhatsapp: string;
  email: string;
  ciudadEstado: string;
  servicio?: string;
  mensaje: string;
  empresaOrNombre: string;
  timestamp: string;
}

type RateLimitEntry = {
  count: number;
  windowStart: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __hubspotLeadRateLimitStore: Map<string, RateLimitEntry> | undefined;
}

const HUBSPOT_API_BASE_URL = "https://api.hubapi.com";
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const WHATSAPP_NUMBER = "525574570826";
const RESEND_REPLY_TO = "sebastian@segac.com.mx";

const rateLimitStore =
  globalThis.__hubspotLeadRateLimitStore ?? new Map<string, RateLimitEntry>();
globalThis.__hubspotLeadRateLimitStore = rateLimitStore;

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const splitName = (fullName: string): { firstname: string; lastname?: string } => {
  const tokens = fullName.trim().split(/\s+/).filter(Boolean);
  const firstname = tokens[0] ?? "";
  const lastname = tokens.length > 1 ? tokens.slice(1).join(" ") : undefined;
  return { firstname, lastname };
};

const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isLikelyPhone = (value: string): boolean => {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7;
};

const pad2 = (value: number): string => String(value).padStart(2, "0");

const getLocalTimestamp = (date = new Date()): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(
    date.getHours(),
  )}:${pad2(date.getMinutes())}`;

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const parseLegacyServiceFromMessage = (mensaje: string): { servicio?: string; cleanMessage: string } => {
  const match = mensaje.match(/^\[Tipo de proyecto:\s*([^\]\n]+)\]\s*\n?/i);
  if (!match) return { cleanMessage: mensaje };

  return {
    servicio: text(match[1]),
    cleanMessage: mensaje.replace(match[0], "").trim(),
  };
};

const resolveServicio = (payload: LeadPayload): { servicio?: string; cleanMessage: string } => {
  const rawMessage = text(payload.mensaje);
  const parsed = parseLegacyServiceFromMessage(rawMessage);
  const servicio =
    text(payload.servicio) || text(payload.tipoProyecto) || text(parsed.servicio) || undefined;

  return {
    servicio,
    cleanMessage: parsed.cleanMessage,
  };
};

const normalizeLeadFields = (payload: LeadPayload): NormalizedLeadFields => {
  const servicioData = resolveServicio(payload);
  const nombre = text(payload.nombre) || "Sin nombre";
  const empresa = text(payload.empresa) || "Sin empresa";
  const telefonoWhatsapp = text(payload.telefono_whatsapp) || "No proporcionado";
  const email = text(payload.email) || "No proporcionado";
  const ciudadEstado = text(payload.ciudad_estado) || "Sin ciudad";
  const mensaje = servicioData.cleanMessage || "Sin mensaje";
  const empresaOrNombre = text(payload.empresa) || text(payload.nombre) || "Sin nombre";

  return {
    nombre,
    empresa,
    telefonoWhatsapp,
    email,
    ciudadEstado,
    servicio: servicioData.servicio,
    mensaje,
    empresaOrNombre,
    timestamp: getLocalTimestamp(),
  };
};

const buildDealName = (payload: LeadPayload): string => {
  const normalized = normalizeLeadFields(payload);
  const parts = [
    "Web Lead",
    ...(normalized.servicio ? [normalized.servicio] : []),
    normalized.empresa || "Sin empresa",
    normalized.nombre || "Sin nombre",
    normalized.ciudadEstado || "Sin ciudad",
    normalized.timestamp,
  ];

  return parts.join(" | ");
};

const buildDealDescription = (payload: LeadPayload, pipeline: string, dealstage: string): string => {
  const normalized = normalizeLeadFields(payload);

  return [
    "Lead generado desde formulario web",
    `Fecha: ${normalized.timestamp}`,
    `Nombre: ${normalized.nombre}`,
    `Empresa: ${normalized.empresa}`,
    `Teléfono/WhatsApp: ${normalized.telefonoWhatsapp}`,
    `Email: ${normalized.email}`,
    `Ciudad/Estado: ${normalized.ciudadEstado}`,
    `Servicio: ${normalized.servicio || "No especificado"}`,
    `Mensaje: ${normalized.mensaje}`,
    `Pipeline: ${pipeline}`,
    `Stage: ${dealstage}`,
  ].join("\n");
};

const getClientIp = (request: Request, clientAddress?: string): string => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return clientAddress?.trim() || "unknown";
};

const isRateLimited = (ip: string, now = Date.now()): boolean => {
  const entry = rateLimitStore.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  rateLimitStore.set(ip, entry);
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
};

const jsonResponse = (status: number, body: ApiSuccessResponse | ApiErrorResponse): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

const getHubSpotToken = (): string => {
  const token = import.meta.env.HUBSPOT_PRIVATE_APP_TOKEN;
  if (!token) {
    throw new Error("Missing HUBSPOT_PRIVATE_APP_TOKEN");
  }
  return token;
};

const getPipelineAndStage = (): { pipeline: string; dealstage: string } => {
  const pipeline = text(import.meta.env.HUBSPOT_PIPELINE_ID || "default");
  const dealstage = text(import.meta.env.HUBSPOT_STAGE_ID);

  if (!dealstage) {
    throw new Error("Configuración incompleta: falta HUBSPOT_STAGE_ID.");
  }

  return { pipeline, dealstage };
};

const getResendApiKey = (): string => text(import.meta.env.RESEND_API_KEY);
const getResendFromEmail = (): string => text(import.meta.env.RESEND_FROM_EMAIL);
const getResendInternalEmail = (): string => text(import.meta.env.RESEND_INTERNAL_EMAIL);
const getHubSpotPortalId = (): string => text(import.meta.env.HUBSPOT_PORTAL_ID);
const getPublicSiteUrl = (): string => {
  const configured = text(import.meta.env.PUBLIC_SITE_URL).replace(/\/+$/g, "");
  if (configured) return configured;
  return import.meta.env.PROD ? "https://enfoquemedios.com.mx" : "http://localhost:4321";
};
const getLogoUrl = (): string => `${getPublicSiteUrl()}/brand/logo.png`;

const buildHubSpotDealUrl = (dealId: string): string | undefined => {
  const portalId = getHubSpotPortalId();
  if (!portalId) return undefined;
  return `https://app.hubspot.com/contacts/${portalId}/record/0-3/${dealId}`;
};

const truncate = (value: string, max = 300): string =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;

const buildWhatsAppUrl = (prefilledText: string): string =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(prefilledText)}`;

const getMinuteBucket = (date = new Date()): string =>
  `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}T${pad2(
    date.getUTCHours(),
  )}:${pad2(date.getUTCMinutes())}Z`;

const buildEmailIdempotencyKey = (args: {
  kind: "internal" | "user";
  payload: LeadPayload;
  dealId?: string;
}): string => {
  if (args.dealId) return `lead-${args.kind}-${args.dealId}`;

  const raw = [
    text(args.payload.nombre),
    text(args.payload.email),
    text(args.payload.telefono_whatsapp),
    getMinuteBucket(),
  ].join("|");

  const hash = createHash("sha256").update(raw).digest("hex").slice(0, 40);
  return `lead-${args.kind}-${hash}`;
};

const hubspotFetch = async <T>(token: string, path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${HUBSPOT_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const message =
      typeof data.message === "string" ? data.message : `HubSpot request failed (${response.status})`;
    throw new Error(message);
  }

  return data as T;
};

const sendEmailResend = async ({
  to,
  subject,
  html,
  text: textBody,
  from,
  replyTo,
  idempotencyKey,
}: SendEmailResendArgs): Promise<void> => {
  const apiKey = getResendApiKey();
  const defaultFrom = getResendFromEmail();
  const finalFrom = text(from) || defaultFrom;
  const normalizedTo = text(to);
  const normalizedReplyTo = text(replyTo) || RESEND_REPLY_TO;

  if (!apiKey) throw new Error("RESEND_API_KEY no está configurado.");
  if (!finalFrom) throw new Error("RESEND_FROM_EMAIL no está configurado.");
  if (!normalizedTo) throw new Error("Email de destino no está configurado.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: finalFrom,
      to: [normalizedTo],
      subject,
      html,
      text: textBody,
      reply_to: normalizedReplyTo,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : typeof data.error === "string"
          ? data.error
          : `Resend request failed (${response.status})`;
    throw new Error(message);
  }
};

const searchObjectByProperty = async (
  token: string,
  objectType: "contacts" | "companies",
  propertyName: string,
  value: string,
): Promise<string | undefined> => {
  const data = await hubspotFetch<HubSpotSearchResponse>(token, `/crm/v3/objects/${objectType}/search`, {
    method: "POST",
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName, operator: "EQ", value }] }],
      limit: 1,
    }),
  });

  return data.results?.[0]?.id;
};

const upsertContact = async (token: string, payload: LeadPayload): Promise<string> => {
  const email = text(payload.email);
  const phone = text(payload.telefono_whatsapp);

  let contactId: string | undefined;
  if (email) {
    contactId = await searchObjectByProperty(token, "contacts", "email", email);
  } else if (phone) {
    contactId = await searchObjectByProperty(token, "contacts", "phone", phone);
  }

  const { firstname, lastname } = splitName(payload.nombre);
  const properties: Record<string, string> = {
    firstname: firstname || "Sin nombre",
  };

  if (lastname) properties.lastname = lastname;
  if (phone) properties.phone = phone;
  if (email) properties.email = email;

  if (contactId) {
    await hubspotFetch(token, `/crm/v3/objects/contacts/${contactId}`, {
      method: "PATCH",
      body: JSON.stringify({ properties }),
    });
    return contactId;
  }

  const created = await hubspotFetch<HubSpotObjectResponse>(token, "/crm/v3/objects/contacts", {
    method: "POST",
    body: JSON.stringify({ properties }),
  });

  return created.id;
};

const upsertCompany = async (token: string, empresa: string): Promise<string | undefined> => {
  const companyName = text(empresa);
  if (!companyName) return undefined;

  const existingCompanyId = await searchObjectByProperty(token, "companies", "name", companyName);
  if (existingCompanyId) return existingCompanyId;

  const created = await hubspotFetch<HubSpotObjectResponse>(token, "/crm/v3/objects/companies", {
    method: "POST",
    body: JSON.stringify({
      properties: {
        name: companyName,
      },
    }),
  });

  return created.id;
};

const createDeal = async (
  token: string,
  payload: LeadPayload,
  pipeline: string,
  dealstage: string,
): Promise<string> => {
  const createdDeal = await hubspotFetch<HubSpotObjectResponse>(token, "/crm/v3/objects/deals", {
    method: "POST",
    body: JSON.stringify({
      properties: {
        dealname: buildDealName(payload),
        pipeline,
        dealstage,
        description: buildDealDescription(payload, pipeline, dealstage),
      },
    }),
  });

  return createdDeal.id;
};

const associateDefault = async (
  token: string,
  fromType: "deals" | "contacts",
  fromId: string,
  toType: "contacts" | "companies",
  toId: string,
): Promise<void> => {
  await hubspotFetch(
    token,
    `/crm/v4/objects/${fromType}/${fromId}/associations/default/${toType}/${toId}`,
    {
      method: "PUT",
      body: JSON.stringify({}),
    },
  );
};

const buildInternalEmail = (args: {
  payload: LeadPayload;
  contactId: string;
  companyId?: string;
  dealId: string;
  pipeline: string;
  dealstage: string;
}): { subject: string; html: string; text: string } => {
  const normalized = normalizeLeadFields(args.payload);
  const subject = `Nuevo lead web — ${normalized.empresa || "Sin empresa"} — ${normalized.nombre || "Sin nombre"}`;
  const logoUrl = getLogoUrl();
  const dealUrl = buildHubSpotDealUrl(args.dealId);
  const whatsappText = truncate(
    `Hola, soy ${normalized.nombre} de ${normalized.empresa}. Mensaje: ${normalized.mensaje}`,
    300,
  );
  const whatsappUrl = buildWhatsAppUrl(whatsappText);

  const rows = [
    ["Nombre", normalized.nombre],
    ["Empresa", normalized.empresa],
    ["Teléfono / WhatsApp", normalized.telefonoWhatsapp],
    ["Email", normalized.email],
    ["Ciudad / Estado", normalized.ciudadEstado],
    ...(normalized.servicio ? [["Servicio", normalized.servicio] as const] : []),
    ["Mensaje", normalized.mensaje],
    ["Pipeline", args.pipeline],
    ["Stage", args.dealstage],
    ["Contact ID", args.contactId],
    ["Company ID", args.companyId || "N/A"],
    ...(dealUrl ? [["Deal", dealUrl] as const] : [["Deal ID", args.dealId] as const]),
    ["Hora", normalized.timestamp],
  ];

  const rowsHtml = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc;font-weight:600;">${escapeHtml(label)}</td>
          <td style="padding:8px 10px;border:1px solid #e5e7eb;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");

  const html = `
    <div style="margin:0 auto;max-width:640px;padding:16px;background:#f6f8fb;">
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;padding:16px;">
        <div style="text-align:center;padding-bottom:12px;border-bottom:1px solid #eef2f7;margin-bottom:12px;">
          <img src="${escapeHtml(logoUrl)}" alt="Enfoque en Medios" width="180" style="display:inline-block;max-width:100%;height:auto;" />
        </div>
        <h2 style="margin:0 0 10px;font-size:18px;color:#111827;">Nuevo lead web</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#1f2937;">
          <tbody>${rowsHtml}</tbody>
        </table>
        <div style="margin-top:16px;text-align:center;">
          <a href="${escapeHtml(whatsappUrl)}" style="display:inline-block;padding:12px 18px;background:#0ea85f;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">
            Responder por WhatsApp
          </a>
        </div>
      </div>
    </div>
  `.trim();

  const textBody = [
    "Nuevo lead web",
    `Nombre: ${normalized.nombre}`,
    `Empresa: ${normalized.empresa}`,
    `Teléfono / WhatsApp: ${normalized.telefonoWhatsapp}`,
    `Email: ${normalized.email}`,
    `Ciudad / Estado: ${normalized.ciudadEstado}`,
    ...(normalized.servicio ? [`Servicio: ${normalized.servicio}`] : []),
    `Mensaje: ${normalized.mensaje}`,
    `Pipeline: ${args.pipeline}`,
    `Stage: ${args.dealstage}`,
    "",
    "HubSpot IDs:",
    `contactId: ${args.contactId}`,
    `companyId: ${args.companyId || "N/A"}`,
    dealUrl ? `dealUrl: ${dealUrl}` : `dealId: ${args.dealId}`,
    `Hora: ${normalized.timestamp}`,
    "",
    `WhatsApp: ${whatsappUrl}`,
  ].join("\n");

  return { subject, html, text: textBody };
};

const buildUserConfirmationEmail = (payload: LeadPayload): { html: string; text: string } => {
  const normalized = normalizeLeadFields(payload);
  const greetingName = text(payload.nombre) || "equipo";
  const logoUrl = getLogoUrl();
  const whatsappText = truncate(
    `Hola, soy ${normalized.nombre} de ${normalized.empresa}. Quiero seguimiento a mi solicitud: ${normalized.mensaje}`,
    300,
  );
  const whatsappUrl = buildWhatsAppUrl(whatsappText);

  const summaryRows = [
    ["Nombre", normalized.nombre],
    ["Empresa", normalized.empresa],
    ["Teléfono / WhatsApp", normalized.telefonoWhatsapp],
    ["Email", normalized.email],
    ["Ciudad / Estado", normalized.ciudadEstado],
    ...(normalized.servicio ? [["Servicio", normalized.servicio] as const] : []),
    ["Mensaje", normalized.mensaje],
  ];

  const rowsHtml = summaryRows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc;font-weight:600;">${escapeHtml(label)}</td>
          <td style="padding:8px 10px;border:1px solid #e5e7eb;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");

  const html = `
    <div style="margin:0 auto;max-width:640px;padding:16px;background:#f6f8fb;">
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;padding:18px;">
        <div style="text-align:center;padding-bottom:12px;border-bottom:1px solid #eef2f7;margin-bottom:14px;">
          <img src="${escapeHtml(logoUrl)}" alt="Enfoque en Medios" width="180" style="display:inline-block;max-width:100%;height:auto;" />
        </div>
        <h2 style="margin:0 0 10px;font-size:19px;color:#111827;">Recibimos tu solicitud</h2>
        <p style="margin:0 0 12px;color:#374151;line-height:1.55;">
          Hola ${escapeHtml(greetingName)}, gracias por contactarnos. Ya recibimos tu solicitud.
          <strong>Te respondemos en menos de 24 horas.</strong>
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#1f2937;margin:0 0 12px;">
          <tbody>${rowsHtml}</tbody>
        </table>
        <div style="margin:14px 0;text-align:center;">
          <a href="${escapeHtml(whatsappUrl)}" style="display:inline-block;padding:12px 18px;background:#0ea85f;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">
            Dar seguimiento por WhatsApp
          </a>
        </div>
        <p style="margin:0;color:#374151;line-height:1.55;">
          Si quieres acelerar tu cotización, compártenos por WhatsApp archivos, medidas y fechas de entrega.
        </p>
        <p style="margin:12px 0 0;color:#6b7280;font-size:12px;line-height:1.45;">
          No compartimos tu información. Solo la usamos para cotizar tu proyecto.
        </p>
      </div>
    </div>
  `.trim();

  const textBody = [
    `Hola ${greetingName},`,
    "",
    "Recibimos tu solicitud.",
    "Te respondemos en menos de 24 horas.",
    "",
    "Resumen:",
    `Nombre: ${normalized.nombre}`,
    `Empresa: ${normalized.empresa}`,
    `Teléfono / WhatsApp: ${normalized.telefonoWhatsapp}`,
    `Email: ${normalized.email}`,
    `Ciudad / Estado: ${normalized.ciudadEstado}`,
    ...(normalized.servicio ? [`Servicio: ${normalized.servicio}`] : []),
    `Mensaje: ${normalized.mensaje}`,
    "",
    "Si quieres acelerar tu cotización, compártenos por WhatsApp archivos, medidas y fechas de entrega.",
    `WhatsApp: ${whatsappUrl}`,
    "",
    "No compartimos tu información. Solo la usamos para cotizar tu proyecto.",
    "",
    "Enfoque en Medios",
  ].join("\n");

  return { html, text: textBody };
};

const validatePayload = (raw: unknown): { ok: true; payload: LeadPayload } | { ok: false; error: string } => {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Payload inválido. Se esperaba un objeto JSON." };
  }

  const input = raw as Record<string, unknown>;
  const payload: LeadPayload = {
    nombre: text(input.nombre),
    empresa: text(input.empresa),
    telefono_whatsapp: text(input.telefono_whatsapp),
    email: text(input.email),
    ciudad_estado: text(input.ciudad_estado),
    servicio: text(input.servicio) || text(input.tipoProyecto),
    tipoProyecto: text(input.tipoProyecto),
    mensaje: text(input.mensaje),
    website: text(input.website),
  };

  if (!payload.nombre) {
    return { ok: false, error: "El campo 'nombre' es obligatorio." };
  }

  if (payload.telefono_whatsapp && !isLikelyPhone(payload.telefono_whatsapp)) {
    return { ok: false, error: "El campo 'telefono_whatsapp' no parece válido." };
  }

  if (payload.email && !isValidEmail(payload.email)) {
    return { ok: false, error: "El campo 'email' no tiene un formato válido." };
  }

  return { ok: true, payload };
};

const methodNotAllowed = (): Response =>
  jsonResponse(405, { ok: false, error: "Método no permitido. Usa POST." });

export const GET: APIRoute = methodNotAllowed;
export const PUT: APIRoute = methodNotAllowed;
export const PATCH: APIRoute = methodNotAllowed;
export const DELETE: APIRoute = methodNotAllowed;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return jsonResponse(400, { ok: false, error: "Content-Type inválido. Usa application/json." });
    }

    const parsed = validatePayload(await request.json());
    if (!parsed.ok) {
      return jsonResponse(400, { ok: false, error: parsed.error });
    }

    const payload = parsed.payload;

    // Honeypot field: treat as accepted to avoid signaling bots.
    if (payload.website) {
      return jsonResponse(202, {
        ok: true,
        message: "Solicitud recibida.",
        data: { contactId: "hidden", dealId: "hidden" },
        email: { internalSent: false, userSent: false },
      });
    }

    const ip = getClientIp(request, clientAddress);
    if (isRateLimited(ip)) {
      return jsonResponse(429, {
        ok: false,
        error: "Demasiadas solicitudes. Intenta nuevamente en un minuto.",
      });
    }

    const token = getHubSpotToken();
    const { pipeline, dealstage } = getPipelineAndStage();

    const contactId = await upsertContact(token, payload);
    const companyId = await upsertCompany(token, payload.empresa || "");
    const dealId = await createDeal(token, payload, pipeline, dealstage);

    await associateDefault(token, "deals", dealId, "contacts", contactId);
    if (companyId) {
      await associateDefault(token, "deals", dealId, "companies", companyId);
      await associateDefault(token, "contacts", contactId, "companies", companyId);
    }

    let internalSent = false;
    let userSent = false;
    const emailErrors: string[] = [];

    try {
      const internalEmail = buildInternalEmail({
        payload,
        contactId,
        companyId,
        dealId,
        pipeline,
        dealstage,
      });
      await sendEmailResend({
        to: getResendInternalEmail(),
        subject: internalEmail.subject,
        html: internalEmail.html,
        text: internalEmail.text,
        replyTo: RESEND_REPLY_TO,
        idempotencyKey: buildEmailIdempotencyKey({ kind: "internal", payload, dealId }),
      });
      internalSent = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      emailErrors.push(`No se pudo enviar correo interno: ${message}`);
      console.error("[hubspot-lead] internal email failed:", message);
    }

    const leadEmail = text(payload.email);
    if (leadEmail) {
      try {
        const confirmation = buildUserConfirmationEmail(payload);
        const fromEmail = getResendFromEmail();
        await sendEmailResend({
          to: leadEmail,
          subject: "Recibimos tu solicitud — te respondemos en menos de 24 horas",
          html: confirmation.html,
          text: confirmation.text,
          from: `Enfoque en Medios <${fromEmail}>`,
          replyTo: RESEND_REPLY_TO,
          idempotencyKey: buildEmailIdempotencyKey({ kind: "user", payload, dealId }),
        });
        userSent = true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown error";
        emailErrors.push(`No se pudo enviar correo al usuario: ${message}`);
        console.error("[hubspot-lead] user confirmation email failed:", message);
      }
    }

    return jsonResponse(200, {
      ok: true,
      message: "Lead creado correctamente en HubSpot.",
      data: { contactId, companyId, dealId },
      email: {
        internalSent,
        userSent,
        ...(emailErrors.length > 0 ? { warning: emailErrors.join(" | ") } : {}),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    console.error("[hubspot-lead] request failed:", message);

    if (message === "Configuración incompleta: falta HUBSPOT_STAGE_ID.") {
      return jsonResponse(500, { ok: false, error: message });
    }

    return jsonResponse(500, {
      ok: false,
      error: "No se pudo procesar la solicitud en este momento.",
    });
  }
};
