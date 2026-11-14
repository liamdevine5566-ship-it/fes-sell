// Wix Stores connection. Works with both catalog versions (V1 and V3):
// the site's version is checked once and remembered.
// NOTE: written against Wix's published REST docs; first live run happens at the setup sitting.

const API = 'https://www.wixapis.com';

async function wix(env, method, path, body) {
  const r = await fetch((env.WIX_API_BASE || API) + path, {
    method,
    headers: {
      Authorization: env.WIX_API_KEY,
      'wix-site-id': env.WIX_SITE_ID,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json; try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!r.ok) {
    const err = new Error(`Wix ${method} ${path} → ${r.status}: ${text.slice(0, 300)}`);
    err.status = r.status;
    throw err;
  }
  return json;
}

export const wixReady = (env) => env.STORE_MODE === 'wix' && !!env.WIX_API_KEY && !!env.WIX_SITE_ID;

export async function catalogVersion(env) {
  const cached = await env.DB.get('wix:catalogVersion');
  if (cached) return cached;
  const j = await wix(env, 'GET', '/stores/v3/provision/version');
  const v = j.catalogVersion || 'V1_CATALOG';
  await env.DB.put('wix:catalogVersion', v, { expirationTtl: 86400 });
  return v;
}

// Copy our photo (public URL) into Wix Media Manager; returns the wixstatic URL.
async function importPhoto(env, publicUrl, name) {
  const j = await wix(env, 'POST', '/site-media/v1/files/import', {
    url: publicUrl, mimeType: 'image/jpeg', displayName: name, mediaType: 'IMAGE',
  });
  if (j.file?.operationStatus === 'FAILED') throw new Error('Wix could not import photo ' + name);
  return j.file.url;
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function htmlDescription(l, wantUrl) {
  const paras = String(l.desc || '').split(/\n{2,}/).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
  return `${paras}<p><strong>Condition:</strong> ${esc(l.cond)}</p><p><a href="${esc(wantUrl)}" target="_blank"><strong>I WANT THIS → send Frank a request</strong></a></p>`;
}

function ricosDescription(l, wantUrl) {
  const para = (text, decorations) => ({
    type: 'PARAGRAPH', paragraphData: {},
    nodes: [{ type: 'TEXT', textData: { text, decorations: decorations || [] } }],
  });
  const nodes = String(l.desc || '').split(/\n{2,}/).filter(Boolean).map(p => para(p));
  nodes.push(para(`Condition: ${l.cond}`));
  nodes.push(para('I WANT THIS → send Frank a request', [{ type: 'LINK', linkData: { link: { url: wantUrl, target: 'BLANK' } } }, { type: 'BOLD' }]));
  return { nodes };
}

const ribbonFor = s => (s === 'sold' ? 'SOLD' : s === 'pending' ? 'PENDING' : '');

export async function createProduct(env, l, { origin }) {
  const v = await catalogVersion(env);
  const wantUrl = `${origin}/want/${l.id}`;
  const media = [];
  for (const [i, key] of (l.photos || []).slice(0, v === 'V3_CATALOG' ? 3 : 10).entries()) {
    media.push(await importPhoto(env, `${origin}/photos/${key}`, `${l.id}-${i + 1}.jpg`));
  }
  if (v === 'V3_CATALOG') {
    const product = {
      name: l.title.slice(0, 80),
      productType: 'PHYSICAL',
      physicalProperties: {},
      visible: true,
      description: ricosDescription(l, wantUrl),
      variantsInfo: { variants: [{ price: { actualPrice: { amount: String(l.price) } }, physicalProperties: {}, visible: true }] },
    };
    if (media.length) product.media = { itemsInfo: { items: media.map(url => ({ url, altText: l.title })) } };
    const j = await wix(env, 'POST', '/stores/v3/products', { product });
    return { productId: j.product.id, version: v };
  }
  const j = await wix(env, 'POST', '/stores/v1/products', {
    product: {
      name: l.title.slice(0, 80),
      description: htmlDescription(l, wantUrl),
      visible: true,
      productType: 'physical',
      priceData: { price: Number(l.price) },
    },
  });
  const id = j.product.id;
  if (media.length) await wix(env, 'POST', `/stores/v1/products/${id}/media`, { media: media.map(url => ({ url })) });
  return { productId: id, version: v };
}

export async function updateProduct(env, l, { origin }) {
  if (!l.wix?.productId) return;
  const id = l.wix.productId;
  const wantUrl = `${origin}/want/${l.id}`;
  if (l.wix.version === 'V3_CATALOG') {
    const cur = await wix(env, 'GET', `/stores/v3/products/${id}?fields=VARIANT_OPTION_CHOICE_NAMES`);
    const variant = cur.product?.variantsInfo?.variants?.[0];
    const product = {
      id, revision: cur.product.revision,
      name: l.title.slice(0, 80),
      description: ricosDescription(l, wantUrl),
      ribbon: ribbonFor(l.status) ? { name: ribbonFor(l.status) } : undefined,
    };
    if (variant) product.variantsInfo = { variants: [{ id: variant.id, price: { actualPrice: { amount: String(l.price) } }, physicalProperties: variant.physicalProperties || {} }] };
    await wix(env, 'PATCH', `/stores/v3/products/${id}`, { product });
    return;
  }
  await wix(env, 'PATCH', `/stores/v1/products/${id}`, {
    product: {
      name: l.title.slice(0, 80),
      description: htmlDescription(l, wantUrl),
      priceData: { price: Number(l.price) },
      ribbon: ribbonFor(l.status),
    },
  });
}

export async function deleteProduct(env, l) {
  if (!l.wix?.productId) return;
  const base = l.wix.version === 'V3_CATALOG' ? '/stores/v3/products/' : '/stores/v1/products/';
  await wix(env, 'DELETE', base + l.wix.productId);
}

export async function testConnection(env) {
  return { catalogVersion: await catalogVersion(env) };
}
