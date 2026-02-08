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
The endpoint upserts Contact, optionally upserts Company, creates a Deal, and sends an internal email notification via Resend (if configured).

### 1) Environment variables

Copy `.env.example` to `.env` locally and configure:

```bash
HUBSPOT_PRIVATE_APP_TOKEN=your-hubspot-private-app-token
HUBSPOT_PIPELINE_ID=default
HUBSPOT_STAGE_ID=your-deal-stage-id
RESEND_API_KEY=your-resend-api-key
LEAD_NOTIFY_TO=sebastian@segac.com.mx
LEAD_NOTIFY_FROM=onboarding@resend.dev
```

`LEAD_NOTIFY_FROM` can stay as `onboarding@resend.dev` while you are on Resend testing/free mode.
When you buy and configure your domain DNS, switch it to your verified sender.

### 2) Vercel setup

1. Open your Vercel project.
2. Go to `Project Settings > Environment Variables`.
3. Add:
   - `HUBSPOT_PRIVATE_APP_TOKEN`
   - `HUBSPOT_PIPELINE_ID`
   - `HUBSPOT_STAGE_ID`
   - `RESEND_API_KEY`
   - `LEAD_NOTIFY_TO`
   - `LEAD_NOTIFY_FROM`
4. Redeploy the project so serverless functions receive the new values.

## API Test (curl)

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
    "mensaje": "Necesito branding físico para evento corporativo.",
    "website": ""
  }'
```

Run against production (replace with your real domain):

```bash
curl -X POST "https://your-domain.com/api/hubspot/lead.json" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Perez",
    "empresa": "Apple",
    "telefono_whatsapp": "+52 55 7457 0826",
    "email": "juan@apple.com",
    "ciudad_estado": "CDMX",
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

Expected API response includes `notifyEmailSent`:
- `true` when Resend notification email was sent.
- `false` when `RESEND_API_KEY` is missing or notification sending fails (HubSpot lead creation still returns `ok: true`).
