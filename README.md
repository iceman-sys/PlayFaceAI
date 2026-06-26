# PlayFaceAI — SWAARM in the Chorus

Marketing funnel + AI campaign powered by **Replicate face swap** via **Supabase Edge Functions** (async webhook pipeline).

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

## Client requirement

Players left → right: **1 · 2 · FAN (3) · 4 · Tristan (5) · 6 · 7**

| Mode | Player 3 (fan) | Player 5 (Tristan) | Others |
|------|----------------|---------------------|--------|
| **Without headgear** | Your face (swap onto `afl-group-scene.jpeg`) | Unchanged | Unchanged |
| **With headgear** | Your face (swap onto `afl-group-scene-headgear.jpeg`) | SWAARM cap (pre-fitted) | Unchanged |

## How generation works (two-base-scene async webhook pipeline)

The SWAARM cap is **pre-fitted (baked) into a second base scene** —
`afl-group-scene-headgear.jpeg` (the fan + Tristan already wear realistic caps).
Both modes are therefore just a face swap onto the fan, on different base images.
This removes all runtime helmet compositing (which busted the edge CPU limit and
never looked realistic). One job fires two predictions in parallel:

```
1. Client: upload selfie → private Storage (selfies bucket)

2. Client → composite-image (phase=face-swap)
     • Resolves both pre-baked fan crops + signed selfie URL (no decode)
     • INSERT generation_jobs (status=swap_processing)
     • POST 2× Replicate /predictions, each with a variant'd webhook URL:
         variant=clean    → afl-group-scene.jpeg
         variant=headgear → afl-group-scene-headgear.jpeg
     • RETURN { jobId, status: 'queued' }      ← ~300 ms

3. Replicate (off-Supabase) runs both face-swap models.

4. Replicate → replicate-webhook (once per variant, fresh CPU budget)
     • Downloads swap result + the variant's base scene
     • Pastes swap into that scene's fan crop rect
     • Uploads <prefix>-{without|with}-headgear.jpg
     • UPDATE the matching column; status=complete once BOTH are set

5. Client: polls generation_jobs until BOTH image URLs are set → done.
```

Calibrate regions:
- clean scene → `npm run annotate:scene` → check `afl-group-scene-annotated.jpeg`
- headgear scene → `npm run prepare:headgear-scene` → check `afl-group-headgear-annotated.jpeg`

## Supabase setup

### 1. Database migrations (SQL Editor, in order)

- `supabase/migrations/20260601000000_submissions_base.sql`
- `supabase/migrations/20260601000001_storage_bucket.sql`
- `supabase/migrations/20260615120000_chorus_campaign_upgrade.sql`
- `supabase/migrations/20260616000000_campaign_assets_bucket.sql`
- `supabase/migrations/20260628000000_marketing_funnel.sql`
- `supabase/migrations/20260624100000_campaign_composite.sql` (selfies + generation_jobs)
- `supabase/migrations/20260625130000_async_replicate.sql` (webhook columns)
- `supabase/migrations/20260625140000_generation_jobs_authenticated_read.sql` (RLS read)
- `supabase/migrations/20260626120000_two_scene_variants.sql` (prediction_ids)

### 2. Compress, pre-bake & upload campaign assets

```bash
npm run optimize:scene          # afl-group-scene.jpeg → <3.5 MB (edge memory)
npm run prebake:assets          # afl-group-fan-crop.jpg (clean scene swap target)
npm run prepare:headgear-scene  # afl-group-scene-headgear.jpeg + its fan crop
npm run annotate:scene          # optional: verify fan + Tristan regions
npm run upload:campaign         # needs SUPABASE_SERVICE_ROLE_KEY in .env.local
```

The "with headgear" base scene is AI-generated with caps pre-fitted on the fan +
Tristan. Drop that PNG at `public/campaign/afl-group-scene-headgear-source.png`,
then `npm run prepare:headgear-scene` standardizes it to 2048×1365 and cuts the
fan crop. Tune `FAN_HEADGEAR` in `scripts/prepare-headgear-scene.mjs` (and
`FAN_HEADGEAR_REGION` in `regionConfig.ts`) until the red box frames the fan face.

Or upload manually: Storage → `campaign-assets` → `afl-group-scene.jpeg`,
`afl-group-fan-crop.jpg`, `afl-group-scene-headgear.jpeg`,
`afl-group-headgear-fan-crop.jpg`.

### 3. Edge Function secrets

Dashboard → **Edge Functions → Secrets**:

```
REPLICATE_API_TOKEN=r8_...                # required
REPLICATE_WEBHOOK_SECRET=...              # required; openssl rand -hex 32
REPLICATE_USE_GFPGAN=false                # keep false (extra Replicate pass busts CPU)
RESEND_API_KEY=re_...                     # optional, for email delivery
RESEND_FROM=SWAARM in the Chorus <promotion@swaarmglobal.com>
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by Supabase.

### 4. Deploy edge functions

```bash
supabase link --project-ref taxdxxjiwdgzrvgfownl
supabase secrets set REPLICATE_API_TOKEN=r8_...
supabase secrets set REPLICATE_WEBHOOK_SECRET=$(openssl rand -hex 32)

supabase functions deploy composite-image selfie-upload-url
supabase functions deploy replicate-webhook --no-verify-jwt
supabase functions deploy send-result-email   # optional
```

`--no-verify-jwt` is required for `replicate-webhook` because Replicate calls
it directly (no Supabase JWT). The URL token + service-role lookup are the auth.

### 5. Frontend env (`.env.local`)

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 6. Admin user

Authentication → Users → create admin, then open `/admin`.

Prize draw: use **Prize draw export** CSV (filters `prize_eligible = true`).

## Marketing features

- **QR attribution:** `?source=marvel-stadium-qr` (stored as `campaign_source`)
- **Viral referrals:** each entrant gets `?ref=CODE` on `/prize`; referrals linked in DB
- **Prize eligibility:** requires T&Cs acceptance + successful generation
- **Funnel analytics:** `campaign_events` table + optional `VITE_GA_MEASUREMENT_ID`

## Assets

Place in `public/campaign/` and upload to Storage bucket `campaign-assets`:

- `afl-group-scene.jpeg` — clean locker room scene (run `npm run optimize:scene`)
- `afl-group-fan-crop.jpg` — clean-scene fan head crop (run `npm run prebake:assets`)
- `afl-group-scene-headgear.jpeg` — caps pre-fitted on fan + Tristan
- `afl-group-headgear-fan-crop.jpg` — headgear-scene fan head crop
  (both from `npm run prepare:headgear-scene`)

```bash
npm run optimize:scene && npm run prebake:assets && npm run prepare:headgear-scene && npm run upload:campaign
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

Replicate token + webhook secret stay in **Supabase secrets only** — never in Vercel.

## Local dev note

`npm run dev` calls your **deployed** Supabase edge functions. Deploy
`composite-image`, `selfie-upload-url`, and `replicate-webhook` before testing
generation. The client polls `generation_jobs` directly via the anon key.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `WORKER_RESOURCE_LIMIT` / `CPU Time exceeded` on face-swap | Synchronous `replicate.run()` polling — pipeline isn't deployed | Re-deploy `composite-image` + `replicate-webhook` |
| UI stuck on processing screen, network panel shows `generation_jobs?…` returning `[]` repeatedly | Browser can't read `generation_jobs` (RLS — old policy only granted SELECT to `anon`, not `authenticated`) | Apply `supabase/migrations/20260625140000_generation_jobs_authenticated_read.sql` |
| UI stuck on processing screen, polls return a row that stays `swap_processing` | Replicate webhook not reaching Supabase | Check `replicate-webhook` deployed with `--no-verify-jwt`; verify `REPLICATE_WEBHOOK_SECRET` matches |
| `Forbidden` in webhook logs | Replicate posted with wrong token | Re-deploy `composite-image` after rotating `REPLICATE_WEBHOOK_SECRET` |
| `Scene asset too large` | `afl-group-scene.jpeg` > 3.5 MB in Storage | `npm run optimize:scene && npm run upload:campaign` |
| Crop misaligned | Scene dimensions don't match `regionConfig.ts` | `npm run annotate:scene`, adjust `regionConfig.ts` |
