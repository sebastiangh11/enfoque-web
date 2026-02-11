# Enfoque Web (Astro + Vercel)

Landing site built with Astro and deployed on Vercel.

## Commands

| Command | Action |
| :-- | :-- |
| `npm install` | Install dependencies |
| `npm run dev` | Start local dev server (`http://localhost:4321`) |
| `npm run build` | Build production output |
| `npm run preview` | Preview production build locally |

## HubSpot Lead Integration

The contact form submits to `POST /api/hubspot/lead.json` (server-side Astro endpoint).
The endpoint upserts Contact, optionally upserts Company, creates a Deal, sends an internal email notification, and sends a user confirmation email when `email` is provided.

### 1) Local environment variables

Copy `.env.example` to `.env` locally and configure:

```bash
HUBSPOT_PRIVATE_APP_TOKEN=your-hubspot-private-app-token
HUBSPOT_PIPELINE_ID=default
HUBSPOT_STAGE_ID=your-deal-stage-id
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=hola@enfoquemedios.com.mx
RESEND_INTERNAL_EMAIL=sebastian@segac.com.mx
```

`RESEND_FROM_EMAIL` must be a verified sender/domain in Resend.
`RESEND_INTERNAL_EMAIL` is the inbox that receives the internal lead notification.

### 2) Run locally

```bash
npm install
npm run dev
```

### 3) Local API test (curl)

Run against local dev server (`npm run dev`):

```bash
curl -X POST "http://localhost:4321/api/hubspot/lead.json" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Perez",
    "empresa": "Apple",
    "telefono_whatsapp": "+52 55 7457 0826",
    "email": "juan@apple.com",
    "ciudad_estado": "CDMX",
    "que_necesitas_producir": "Branding físico",
    "mensaje": "Necesito branding físico para evento corporativo.",
    "website": ""
  }'
```

Expected result in HubSpot:
1. Contact created/updated (search by email first, then phone).
2. Company created/updated when `empresa` is provided.
3. Deal created in configured pipeline/stage.
4. Associations:
   - Deal <-> Contact
   - Deal <-> Company (if company exists)
   - Contact <-> Company (if company exists)

Expected API response includes:
- `data` with `contactId`, `companyId` (if any), `dealId`
- `email.internalSent` and `email.userSent`
- Optional `email.warning` if HubSpot succeeded but Resend failed
