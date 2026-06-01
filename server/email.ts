import { dataUrlToBase64Payload } from './imageUtils';

export async function sendResultEmail(
  to: string,
  displayImageUrl: string,
  shareCaption: string,
  sourceDataUrl?: string,
): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'SWAARM AI <onboarding@resend.dev>';

  if (!resendKey || !to) return false;

  const attachments: Array<{ filename: string; content: string }> = [];
  const inlineSrc = displayImageUrl.startsWith('http')
    ? displayImageUrl
    : sourceDataUrl || displayImageUrl;

  if (!displayImageUrl.startsWith('http') && sourceDataUrl) {
    const parsed = dataUrlToBase64Payload(sourceDataUrl);
    if (parsed) {
      attachments.push({ filename: 'swaarm-campaign.png', content: parsed.base64 });
    }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: 'Your SWAARM campaign shot with Tristan & Caleb',
        html: `
        <p>Hi — your AI campaign photo is ready!</p>
        ${
          inlineSrc.startsWith('http')
            ? `<p><img src="${inlineSrc}" alt="SWAARM campaign photo" style="max-width:100%;border-radius:8px" /></p>
               <p><a href="${inlineSrc}">View full image</a></p>`
            : '<p>Your image is attached to this email.</p>'
        }
        <p><strong>Share this caption:</strong><br/>${shareCaption}</p>
        <p>— SWAARM® Advanced Armour</p>
      `,
        attachments: attachments.length ? attachments : undefined,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      console.warn('[email] Resend failed:', await res.text());
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[email] could not reach Resend:', err instanceof Error ? err.message : err);
    return false;
  }
}
