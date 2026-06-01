# SWAARM — Own Your Server (Migration from Famous.ai)

Famous.ai hosted the old `composite-image` edge function on DatabasePad. **You cannot edit that server.** This project already includes a **replaceable local API** under `server/` that you fully control.

## Architecture

```
┌─────────────┐     POST /api/generate-sports-portrait      ┌──────────────────┐
│  React app  │ ──────────────────────────────────────────► │  Your server/    │
│  (Vite)     │     { selfie, teamImageUrl, helmetImageUrl }│  handler.ts      │
└──────┬──────┘                                             └────────┬─────────┘
       │                                                             │
       │ supabase-js (auth, generations table)                       │
       ▼                                                             ▼
┌─────────────┐                                             ┌──────────────────┐
│  Supabase   │ ◄── upload result PNG (service role) ──── │  Gemini / OpenAI │
│  Postgres   │                                             │  image API       │
│  Storage    │                                             └──────────────────┘
└─────────────┘
```

### Dev (automatic)

`npm run dev` starts Vite **and** mounts the API via `server/vite-plugin.ts`:

- Endpoint: `http://localhost:8080/api/generate-sports-portrait`
- Client uses this automatically in dev (`src/lib/invokeGenerate.ts`)

### Production

Vite middleware does **not** run in production builds. Choose one:

| Option | Best for | How |
|--------|----------|-----|
| **A. Standalone Node** | Full control | `npm run server` + set `VITE_GENERATE_API_URL` |
| **B. Railway / Fly / Render** | Easy deploy | Deploy `server/standalone.ts` |
| **C. Supabase Edge Function** | Same host as DB | Copy `handler` logic into `supabase/functions/` |

---

## Step 1 — Supabase project setup

Project: `https://taxdxxjiwdgzrvgfownl.supabase.co`

### 1a. Run database migration

In Supabase Dashboard → **SQL Editor**, run:

`supabase/migrations/001_generations.sql`

Creates the `generations` table for leads + result URLs.

### 1b. Create Storage bucket

1. Storage → **New bucket** → name: `campaign-results`
2. Enable **Public bucket** (for shareable result URLs)
3. Policy: allow service role uploads (server uses service key)

### 1c. Get keys (Dashboard → Settings → API)

| Key | Used by |
|-----|---------|
| `anon` / `public` | Browser (`VITE_SUPABASE_ANON_KEY`) |
| `service_role` | Server uploads only (`SUPABASE_SERVICE_ROLE_KEY`) — **never expose to client** |

### 1d. Admin login

Authentication → Users → create an admin user for `/admin` dashboard.

---

## Step 2 — Environment variables

Copy `.env.example` → `.env.local` (gitignored):

```env
# Client (Vite)
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# AI provider
IMAGE_PROVIDER=gemini
GEMINI_API_KEY=your-key-from-aistudio.google.com
GEMINI_MODEL=gemini-2.5-flash-image

# Server → Supabase Storage
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # service role, NOT anon
SUPABASE_STORAGE_BUCKET=campaign-results

# Optional email (Resend)
# RESEND_API_KEY=re_...
# RESEND_FROM=SWAARM Campaign <onboarding@resend.dev>

# Production only — URL of deployed standalone server
# VITE_GENERATE_API_URL=https://your-api.railway.app/api/generate-sports-portrait
```

**Gemini key:** create at [Google AI Studio](https://aistudio.google.com/apikey). Keys usually start with `AIza...`. If yours looks different, verify it works in AI Studio first.

---

## Step 3 — Local development

```bash
npm install
npm run dev
```

Open `http://localhost:8080`, upload a selfie, generate.

Console should show:

```
[SWAARM] Image provider: Gemini (gemini-2.5-flash-image)
```

If generation fails, the **real error** appears on the landing page (not a generic message).

---

## Step 4 — Production deploy (standalone server)

```bash
# Terminal 1 — API
npm run server

# Terminal 2 — static frontend (or deploy dist/ to Netlify/Vercel)
npm run build && npm run preview
```

Set in production env:

```
VITE_GENERATE_API_URL=https://your-api.example.com/api/generate-sports-portrait
```

Rebuild frontend so Vite embeds the URL.

---

## Step 5 — Decommission Famous.ai

Once your server works:

1. Point `VITE_SUPABASE_*` to **your** Supabase (not `databasepad.com`)
2. Remove dependency on `composite-image` on DatabasePad
3. Optional: remove Famous CRM webhook in `AppLayout.tsx`

---

## Compositing pipeline (recommended)

Set `IMAGE_PROVIDER=pipeline` in `.env.local` (default). This runs the multi-stage compositor your UI describes:

1. **Detect & preserve** — client face gate crops/validates selfie (`src/lib/faceGate.ts`)
2. **Align & swap** — landmark-based scale/rotate + feather blend into center player slot
3. **Headgear** — SWAARM helmet PNG overlay on calibrated anchor
4. **Harmonize** — skin tone + grain match to scene lighting
5. **QC** — auto-retry if head scale is off; optional `OPENAI_HARMONIZE=true` for final polish

| File | Role |
|------|------|
| `server/pipeline/index.ts` | Pipeline orchestrator |
| `server/pipeline/faceDetect.ts` | Selfie/scene geometry |
| `server/pipeline/sceneAnchors.ts` | Center-player anchor (static JSON + fallback) |
| `server/pipeline/composeFace.ts` | Face swap + mask blend |
| `server/pipeline/headgear.ts` | Helmet overlay |
| `server/pipeline/harmonize.ts` | Color/grain harmonization |
| `server/assets/scene-anchor.json` | Calibrated Squad Celebration template |

### Setup commands

```bash
npm install
npm run setup:models    # face-api weights for client selfie gate
npm run sync:campaign   # copy scene + helmet into public/campaign/
npm run calibrate       # regenerate scene-anchor.json from template
npm run dev
```

Legacy single-pass AI: `IMAGE_PROVIDER=openai` or `IMAGE_PROVIDER=gemini`.

---

## Improving image quality (tuning)

- Run `npm run calibrate` after replacing `public/campaign/afl-group-scene.png`
- Edit `server/assets/scene-anchor.json` for pixel-perfect center face placement
- Adjust `PIPELINE_FACE_SCALE` (default `0.97`) if heads look slightly large/small
- Enable `OPENAI_HARMONIZE=true` for a masked lighting pass (uses API credits)

---

## File map (your server code)

| File | Role |
|------|------|
| `server/handler.ts` | HTTP handler — validates body, orchestrates pipeline |
| `server/generatePortrait.ts` | Routes to pipeline, Gemini, or OpenAI |
| `server/pipeline/*` | Multi-stage compositor (recommended) |
| `server/openai.ts` | OpenAI `/v1/images/edits` fallback |
| `server/gemini.ts` | Gemini fallback |
| `server/imageUtils.ts` | Asset fetch, data URL parsing |
| `server/storageUpload.ts` | Upload result to Supabase Storage |
| `server/email.ts` | Optional Resend email delivery |
| `server/vite-plugin.ts` | Dev-only: mounts API on Vite |
| `server/standalone.ts` | Production Node HTTP server |
| `src/lib/invokeGenerate.ts` | Client API router |
| `src/lib/faceGate.ts` | Client selfie validation + face crop |

---

## Security checklist

- [ ] Rotate any API keys posted in chat or commits
- [ ] Never commit `.env.local`
- [ ] Never put `SUPABASE_SERVICE_ROLE_KEY` in frontend
- [ ] Restrict admin auth to your email(s)
