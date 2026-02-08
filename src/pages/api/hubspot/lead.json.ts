import type { APIRoute } from "astro";

export const prerender = false;

interface LeadPayload {
  nombre: string;
  empresa?: string;
  telefono_whatsapp: string;
  email?: string;
  ciudad_estado?: string;
  mensaje: string;
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

const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isLikelyPhone = (value: string): boolean => {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7;
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

const buildDealName = (empresa: string, nombre: string): string => {
  const date = new Date();
  const timestamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

  return `Web Lead - ${empresa || nombre} - ${timestamp}`;
};

const jsonResponse = (status: number, body: ApiSuccessResponse | ApiErrorResponse) =>
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

const searchObjectByProperty = async (
  token: string,
  objectType: "contacts" | "companies",
  propertyName: string,
  value: string,
): Promise<string | undefined> => {
  const data = await hubspotFetch<HubSpotSearchResponse>(token, `/crm/v3/objects/${objectType}/search`, {
    method: "POST",
    body: JSON.stringify({
      filterGroups: [
        {
          filters: [{ propertyName, operator: "EQ", value }],
        },
      ],
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
    firstname,
    phone,
  };

  if (lastname) properties.lastname = lastname;
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

const createDeal = async (token: string, payload: LeadPayload): Promise<string> => {
  const pipeline = text(import.meta.env.HUBSPOT_PIPELINE_ID || "default");
  const dealstage = text(import.meta.env.HUBSPOT_STAGE_ID);

  if (!dealstage) {
    throw new Error("Missing HUBSPOT_STAGE_ID");
  }

  const descriptionLines = [
    `Mensaje: ${payload.mensaje}`,
    `Ciudad/Estado: ${text(payload.ciudad_estado) || "-"}`,
    `Teléfono/WhatsApp: ${payload.telefono_whatsapp}`,
    `Nombre: ${payload.nombre}`,
    `Empresa: ${text(payload.empresa) || "-"}`,
    `Email: ${text(payload.email) || "-"}`,
  ];

  const dealname = buildDealName(text(payload.empresa), payload.nombre);

  const createdDeal = await hubspotFetch<HubSpotObjectResponse>(token, "/crm/v3/objects/deals", {
    method: "POST",
    body: JSON.stringify({
      properties: {
        dealname,
        pipeline,
        dealstage,
        description: descriptionLines.join("\n"),
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
    mensaje: text(input.mensaje),
    website: text(input.website),
  };

  if (!payload.nombre) return { ok: false, error: "El campo 'nombre' es obligatorio." };
  if (!payload.telefono_whatsapp) return { ok: false, error: "El campo 'telefono_whatsapp' es obligatorio." };
  if (!payload.mensaje) return { ok: false, error: "El campo 'mensaje' es obligatorio." };

  if (!isLikelyPhone(payload.telefono_whatsapp)) {
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

    const contactId = await upsertContact(token, payload);
    const companyId = await upsertCompany(token, payload.empresa || "");
    const dealId = await createDeal(token, payload);

    await associateDefault(token, "deals", dealId, "contacts", contactId);

    if (companyId) {
      await associateDefault(token, "deals", dealId, "companies", companyId);
      await associateDefault(token, "contacts", contactId, "companies", companyId);
    }

    return jsonResponse(200, {
      ok: true,
      message: "Lead creado correctamente en HubSpot.",
      data: { contactId, companyId, dealId },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    // Safe log: never include token or full payload.
    console.error("[hubspot-lead] request failed:", message);

    return jsonResponse(500, {
      ok: false,
      error: "No se pudo procesar la solicitud en este momento.",
    });
  }
};
