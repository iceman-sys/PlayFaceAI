import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CAMPAIGN_SHARE_CAPTION =
  "Just a pic of me signing the song with Tristan and Caleb, my SWAARM Headgear bros!!! #SWAARM #AdvancedArmour";

const CAMPAIGN_SCENE_FALLBACK =
  "https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924206808_9304e595.jpg";

const CAMPAIGN_HELMET_FALLBACK =
  "https://d64gsuwffb70l.cloudfront.net/6a177af514f953d19285b7d1_1779924013280_fbbb8920.webp";

const TARGET_PLAYER = "center player (middle of five AFL teammates)";

type GenerateBody = {
  selfie?: string;
  email?: string;
  campaignId?: string;
  sceneUrl?: string;
  helmetUrl?: string;
};

const MAX_SELFIE_CHARS = 900_000;

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid selfie format");
  return { mimeType: match[1], base64: match[2] };
}

async function fetchImageAsInline(url: string): Promise<{ mimeType: string; base64: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load asset: ${url}`);
  const mimeType = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  const buf = new Uint8Array(await res.arrayBuffer());
  let binary = "";
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  return { mimeType, base64: btoa(binary) };
}

function buildPrompt(campaignId?: string): string {
  return [
    "Composite a branded AFL sports campaign photo.",
    `Image 1 is the group scene. Replace ONLY the face of the ${TARGET_PLAYER} with the person from the selfie reference (Image 2).`,
    "Keep every other player, jersey logos (AFL, Mazda, 13cabs), crowd, and background exactly unchanged.",
    "Image 3 is the SWAARM rugby scrum cap. Place it realistically on the center player head with the SWAARM logo clearly visible on the forehead.",
    "Face must remain visible through the helmet opening. Match indoor arena lighting. Photorealistic. No watermarks.",
    campaignId ? `Campaign: ${campaignId}` : "",
  ].filter(Boolean).join(" ");
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function mimeToFilename(mimeType: string, baseName: string): string {
  if (mimeType.includes("png")) return `${baseName}.png`;
  if (mimeType.includes("webp")) return `${baseName}.webp`;
  return `${baseName}.jpg`;
}

async function generateWithOpenAI(
  apiKey: string,
  scene: { mimeType: string; base64: string },
  selfie: { mimeType: string; base64: string },
  helmet: { mimeType: string; base64: string },
  campaignId?: string,
): Promise<{ imageUrl: string; model: string }> {
  const model = Deno.env.get("OPENAI_IMAGE_MODEL") || "gpt-image-1";
  const size = Deno.env.get("OPENAI_IMAGE_SIZE") || "1536x1024";
  const quality = Deno.env.get("OPENAI_IMAGE_QUALITY") || "medium";

  const form = new FormData();
  form.append("model", model);
  form.append("prompt", buildPrompt(campaignId));
  form.append("n", "1");
  form.append("size", size);
  form.append("quality", quality);
  form.append("input_fidelity", "high");

  const append = (inline: { mimeType: string; base64: string }, name: string) => {
    const bytes = base64ToBytes(inline.base64);
    const blob = new Blob([bytes], { type: inline.mimeType });
    form.append("image[]", blob, mimeToFilename(inline.mimeType, name));
  };

  append(scene, "scene");
  append(selfie, "selfie");
  append(helmet, "helmet");

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  const json = await res.json() as {
    data?: Array<{ b64_json?: string }>;
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(json.error?.message || `OpenAI API error (${res.status})`);
  }

  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI did not return an image");

  return { imageUrl: `data:image/png;base64,${b64}`, model };
}

async function generateWithGemini(
  apiKey: string,
  scene: { mimeType: string; base64: string },
  selfie: { mimeType: string; base64: string },
  helmet: { mimeType: string; base64: string },
  campaignId?: string,
): Promise<{ imageUrl: string; model: string }> {
  const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash-image";
  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { text: buildPrompt(campaignId) },
            { inline_data: { mime_type: scene.mimeType, data: scene.base64 } },
            { inline_data: { mime_type: selfie.mimeType, data: selfie.base64 } },
            { inline_data: { mime_type: helmet.mimeType, data: helmet.base64 } },
          ],
        }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    },
  );

  const json = await geminiRes.json();
  if (!geminiRes.ok) {
    const msg = (json as { error?: { message?: string } }).error?.message || "Gemini API error";
    throw new Error(msg);
  }

  const candidates = (json as Record<string, unknown>).candidates as Array<{
    content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string }; inline_data?: { mime_type?: string; data?: string } }> };
  }> | undefined;

  for (const part of candidates?.[0]?.content?.parts ?? []) {
    const inline = part.inlineData ?? part.inline_data;
    if (inline?.data) {
      const mime = (part.inlineData?.mimeType ?? part.inline_data?.mime_type) || "image/png";
      return { imageUrl: `data:${mime};base64,${inline.data}`, model };
    }
  }
  throw new Error("No image returned from Gemini");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as GenerateBody;
    const selfie = body.selfie?.trim();
    if (!selfie) {
      return new Response(JSON.stringify({ error: "Missing selfie" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (selfie.length > MAX_SELFIE_CHARS) {
      return new Response(JSON.stringify({ error: "Selfie too large", code: "PAYLOAD_TOO_LARGE" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const provider = (Deno.env.get("IMAGE_PROVIDER") || "openai").toLowerCase();
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    if (provider === "openai" && !openaiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (provider === "gemini" && !geminiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const assetsBase = (Deno.env.get("CAMPAIGN_ASSETS_BASE_URL") || "").replace(/\/$/, "");
    const resolveUrl = (pathOrUrl: string | undefined, fallback: string) => {
      if (!pathOrUrl) return fallback;
      if (pathOrUrl.startsWith("http")) return pathOrUrl;
      if (assetsBase) return `${assetsBase}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
      return fallback;
    };
    const sceneUrl = resolveUrl(body.sceneUrl, CAMPAIGN_SCENE_FALLBACK);
    const helmetUrl = resolveUrl(body.helmetUrl, CAMPAIGN_HELMET_FALLBACK);

    const selfieImg = parseDataUrl(selfie);
    const scene = await fetchImageAsInline(sceneUrl);
    const helmet = await fetchImageAsInline(helmetUrl);

    const result =
      provider === "gemini" && geminiKey
        ? await generateWithGemini(geminiKey, scene, selfieImg, helmet, body.campaignId)
        : await generateWithOpenAI(openaiKey!, scene, selfieImg, helmet, body.campaignId);

    return new Response(
      JSON.stringify({ imageUrl: result.imageUrl, shareCaption: CAMPAIGN_SHARE_CAPTION, model: result.model, provider }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Generation failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
