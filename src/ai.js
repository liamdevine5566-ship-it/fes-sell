// "Write it for me": drafts a listing description from the title, details and photos.
// Falls back to a plain template when no Anthropic key is set, so the app always works.

export async function describe(env, { title, cond, cat, notes, images = [] }) {
  if (!env.ANTHROPIC_API_KEY) return { text: template({ title, cond, cat }), source: 'template' };

  const content = [];
  for (const img of images.slice(0, 3)) {
    const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(img || '');
    if (m) content.push({ type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } });
  }
  content.push({
    type: 'text',
    text:
`Write a short listing description for a piece of fitness equipment sold by ${env.BUSINESS_NAME} in ${env.BUSINESS_TOWN}.

Title: ${title}
Condition: ${cond}
Category: ${cat}
${notes ? `Owner's notes: ${notes}\n` : ''}
Rules:
- 2 or 3 short paragraphs, plain text, no headings, no emoji, no bullet symbols.
- Only state facts given above or plainly visible in the photos. Do NOT invent specs, dimensions, weight limits, warranty terms, age, hours of use or prices.
- If condition is "Certified pre-owned", say it has been inspected and serviced by the shop.
- End with one line: pickup in ${env.BUSINESS_TOWN}, delivery and installation available.
- Friendly, confident, straight-talking. No hype words like "amazing" or "incredible".`,
  });

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model: env.AI_MODEL || 'claude-sonnet-5-5', max_tokens: 500, messages: [{ role: 'user', content }] }),
  });
  if (!r.ok) {
    console.log('AI error', r.status, await r.text());
    return { text: template({ title, cond, cat }), source: 'template' };
  }
  const j = await r.json();
  const text = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
  return { text: text || template({ title, cond, cat }), source: 'ai' };
}

function template({ title, cond, cat }) {
  const pre = cond !== 'New';
  return [
    `${title} — ${pre ? 'certified pre-owned' : 'brand new'} ${String(cat || 'fitness').toLowerCase()} equipment.`,
    pre ? 'Inspected, serviced and tested before it leaves the shop. Clean, solid and ready to work.' : 'Brand new with full manufacturer warranty.',
    'Pickup available, or ask about delivery and installation.',
  ].join('\n\n');
}
