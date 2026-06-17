# PlayFaceAI — SWAARM in the Chorus

Marketing funnel + AI campaign powered by **Gemini** via **Supabase Edge Functions**.

## Campaign funnel

```
Stadium QR (?source=marvel-stadium-qr)
  ↓
/prize  — Prize landing (competition info, merch, CTAs)
  ↓
/create — AI platform (terms → selfie → generate)
  ↓
Result  — Email, share, viral referral link, prize eligibility
```

| Route | Purpose |
|-------|---------|
| `/prize` | Prize landing page (QR destination) |
| `/create` | AI image generation flow |
| `/terms` | Competition terms & conditions |
| `/admin` | Submissions, referrals, prize draw export |

**Stadium QR URL:** `https://your-domain.com/prize?source=marvel-stadium-qr`

## Quick start

```bash
npm install
cp .env.example .env.local          # add VITE_SUPABASE_URL + anon key
npm run setup:models                # browser selfie validation
npm run dev
```

Open [http://localhost:8080](http://localhost:8080)

## How generation works

| Step | UI label | Gemini pass |
|------|----------|-------------|
| 1 | Placing you in the team song photo | Face swap (scene + selfie) |
| 2 | Creating your bare-head version | Strip all caps/helmets from target player |
| 3 | Fitting your SWAARM headgear | SWAARM scrum cap on bare-head version |
| 4 | Preparing your share-ready image | Harmonize + upload to Storage |

Each submission returns **two images**: with SWAARM helmet + bare head (face swap only).

Generation runs on **Supabase Edge Functions** (not your local IP) — works regardless of your region.

## Supabase setup

### 1. Database migrations (SQL Editor, in order)

- `supabase/migrations/20260601000000_submissions_base.sql`
- `supabase/migrations/20260601000001_storage_bucket.sql`
- `supabase/migrations/20260615120000_chorus_campaign_upgrade.sql`
- `supabase/migrations/20260616000000_campaign_assets_bucket.sql`
- `supabase/migrations/20260628000000_marketing_funnel.sql`

### 2. Upload campaign assets (required)

Upload your locker-room scene + SWAARM helmet to Storage:

**Option A — Dashboard:** Storage → `campaign-assets` bucket → upload `afl-group-scene.png` and `swaarm-helmet.png`

**Option B — Script:**
```bash
npm run upload:campaign   # needs SUPABASE_SERVICE_ROLE_KEY in .env.local
```

### 3. Edge Function secrets

Dashboard → **Edge Functions → Secrets**:

```
GEMINI_API_KEY=your_key_from_aistudio.google.com
GEMINI_HARMONIZE=true
RESEND_API_KEY=re_...                    # optional
RESEND_FROM=SWAARM <campaign@domain.com>  # optional
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

### 4. Deploy edge functions

```bash
supabase link --project-ref taxdxxjiwdgzrvgfownl
supabase secrets set GEMINI_API_KEY=your_key
supabase functions deploy composite-image
supabase functions deploy send-result-email
```

### 5. Frontend env (`.env.local`)

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 6. Admin user

Authentication → Users → create admin, then open `/admin`

Prize draw: use **Prize draw export** CSV (filters `prize_eligible = true`).

## Marketing features

- **QR attribution:** `?source=marvel-stadium-qr` (stored as `campaign_source`)
- **Viral referrals:** each entrant gets `?ref=CODE` on `/prize`; referrals linked in DB
- **Prize eligibility:** requires T&Cs acceptance + successful generation
- **Funnel analytics:** `campaign_events` table + optional `VITE_GA_MEASUREMENT_ID`

## Assets

Place in `public/campaign/` and upload to Storage bucket `campaign-assets`:

- `afl-group-scene.png` — locker room team song (seven players)
- `swaarm-helmet.png` — SWAARM scrum cap

```bash
npm run upload:campaign
```

## Deploy frontend (Vercel)

```bash
npm run build
```

Set env vars on Vercel:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Gemini key stays in **Supabase secrets only** — never in Vercel.

## Local dev note

`npm run dev` calls your **deployed** Supabase edge functions. Deploy `composite-image` before testing generation. On localhost, scene/helmet assets use CDN fallbacks so the cloud function can fetch them.
