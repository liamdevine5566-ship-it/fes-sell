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
    const what = path.includes('site-media') ? 'copying photos' : path.includes('collections') || path.includes('categories') ? 'adding to store pages' : path.includes('provision') ? 'connecting' : 'updating the product';
    const hint = r.status === 401 ? 'the Wix API key is wrong or was deleted' : r.status === 403 ? 'the Wix API key is missing a permission' + (path.includes('site-media') ? ' (turn on Wix Media / Media Manager)' : ' (turn on Wix Stores)') : r.status === 404 ? 'not found on Wix' : 'Wix error ' + r.status;
    let detail = ''; try { detail = JSON.parse(text).message || ''; } catch {}
    const err = new Error(`Wix problem ${what}: ${hint}${detail ? ' — ' + detail.slice(0, 120) : ''}`);
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
  if (l.wix?.imported && l.wix?.originalHtml && l.desc === l.wix.originalText) return l.wix.originalHtml + (l.wix.originalHtml.includes('/want/') ? '' : `<p><a href="${esc(wantUrl)}" target="_blank"><strong>I WANT THIS → send Frank a request</strong></a></p>`);
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
  let photoError = null;
  try {
    const map = {};
    for (const [i, key] of (l.photos || []).slice(0, 15).entries()) {
      map[key] = await importPhoto(env, `${origin}/photos/${key}`, `${l.id}-${i + 1}.jpg`);
      media.push(map[key]);
    }
    l._mediaMap = map;
  } catch (e) { photoError = e.message; media.length = 0; }
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
    const out = { productId: j.product.id, version: v, slug: j.product.slug, mediaDone: !photoError, photoError, mediaMap: l._mediaMap || {} };
    out.pages = await placeInGroups(env, { ...l, wix: out }).catch(e => ['(not added to pages: ' + e.message.slice(0, 120) + ')']);
    return out;
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
  const out = { productId: id, version: v, slug: j.product.slug, mediaDone: !photoError, photoError, mediaMap: l._mediaMap || {} };
  out.pages = await placeInGroups(env, { ...l, wix: out }).catch(e => ['(not added to pages: ' + e.message.slice(0, 120) + ')']);
  return out;
}

const galleryOf = l => (l.gallery && l.gallery.length) ? l.gallery : [...(l.photos || []), ...(l.photoUrls || [])];

// Make the Wix product's photos match the app: same photos, same order (first = main photo).
async function syncPhotos(env, l, origin) {
  const needs = l.photosDirty || l.wix.mediaDone === false;
  if (!needs) return;
  const map = l.wix.mediaMap || {};
  const urls = [];
  for (const [i, g] of galleryOf(l).slice(0, l.wix.version === 'V3_CATALOG' ? 15 : 15).entries()) {
    if (/^https:/.test(g)) { urls.push(g); continue; }
    if (!map[g]) map[g] = await importPhoto(env, `${origin}/photos/${g}`, `${l.id}-${i + 1}.jpg`);
    urls.push(map[g]);
  }
  l.wix.mediaMap = map;
  if (l.wix.version === 'V3_CATALOG') {
    const cur = await wix(env, 'GET', `/stores/v3/products/${l.wix.productId}`);
    await wix(env, 'PATCH', `/stores/v3/products/${l.wix.productId}`, { product: { id: l.wix.productId, revision: cur.product.revision, media: { itemsInfo: { items: urls.map(url => ({ url, altText: l.title })) } } } });
  } else {
    await wix(env, 'POST', `/stores/v1/products/${l.wix.productId}/media/delete`, { mediaIds: [] });
    if (urls.length) await wix(env, 'POST', `/stores/v1/products/${l.wix.productId}/media`, { media: urls.map(url => ({ url })) });
  }
  l.wix.mediaDone = true; l.wix.photoError = null; l.photosDirty = false;
}

// When category or condition changes, take it off the old store pages.
async function leaveOldGroups(env, l) {
  if (!l.prev || (l.prev.cat === l.cat && l.prev.cond === l.cond)) return;
  const groups = await listGroups(env);
  const now = new Set(groupsFor(l, groups).map(g => g.id));
  const old = groupsFor({ ...l, ...l.prev }, groups).filter(g => !now.has(g.id));
  for (const g of old) {
    if (l.wix.version === 'V3_CATALOG') {
      await wix(env, 'POST', `/categories/v1/bulk/categories/${g.id}/remove-items`, { items: [{ catalogItemId: l.wix.productId, appId: STORES_APP }], treeReference: TREE });
    } else {
      await wix(env, 'POST', `/stores/v1/collections/${g.id}/productIds/delete`, { productIds: [l.wix.productId] });
    }
  }
}

export async function updateProduct(env, l, { origin }) {
  if (!l.wix?.productId) return;
  try { await syncPhotos(env, l, origin); } catch (e) { l.wix.photoError = e.message; l.wix.mediaDone = false; }
  try { await leaveOldGroups(env, l); } catch (e) { console.log('leave groups', e.message); }
  l.wix.pages = await placeInGroups(env, l).catch(e => ['(not added to pages: ' + e.message.slice(0, 120) + ')']);
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


// ---- Collections (V1) / Categories (V3): which store pages a product shows on.
const STORES_APP = '215238eb-22a5-4c36-9e7b-e7c08025e04e';
const TREE = { appNamespace: '@wix/stores' };

export async function listGroups(env) {
  const v = await catalogVersion(env);
  if (v === 'V3_CATALOG') {
    const j = await wix(env, 'POST', '/categories/v1/categories/query', { query: { cursorPaging: { limit: 100 } }, treeReference: TREE });
    return (j.categories || []).map(c => ({ id: c.id, name: c.name }));
  }
  const j = await wix(env, 'POST', '/stores/v1/collections/query', { query: { paging: { limit: 100 } } });
  return (j.collections || []).map(c => ({ id: c.id, name: c.name }));
}

// Pick store pages by name: category (Cardio/Strength/Recovery) + Remanufactured/Pre-owned when not new.
function groupsFor(l, groups) {
  const want = [];
  const rx = { Cardio: /cardio/i, Strength: /strength/i, Recovery: /recover/i }[l.cat];
  if (rx) want.push(rx);
  if (l.cond !== 'New') want.push(/reman|pre.?owned|certified|refurb|used/i);
  else want.push(/\bnew\b/i);
  return groups.filter(g => g.name && want.some(r => r.test(g.name)) && !/^all products$/i.test(g.name));
}

export async function placeInGroups(env, l) {
  if (!l.wix?.productId) return [];
  const groups = await listGroups(env);
  const target = groupsFor(l, groups);
  const pid = l.wix.productId;
  for (const g of target) {
    if (l.wix.version === 'V3_CATALOG') {
      await wix(env, 'POST', `/categories/v1/bulk/categories/${g.id}/add-items`, { items: [{ catalogItemId: pid, appId: STORES_APP }], treeReference: TREE });
    } else {
      await wix(env, 'POST', `/stores/v1/collections/${g.id}/productIds`, { productIds: [pid] });
    }
  }
  return target.map(g => g.name);
}

export async function testConnection(env) {
  const catalog = await catalogVersion(env);
  let groups = [];
  try { groups = (await listGroups(env)).map(g => g.name); } catch (e) { groups = ['(could not list: ' + e.message.slice(0, 120) + ')']; }
  return { catalogVersion: catalog, storePages: groups };
}

// ---- Import: read the products already on the Wix store.
const strip = h => String(h || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>\s*<p[^>]*>/gi, '\n\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\n{3,}/g, '\n\n').trim();

export async function listProducts(env) {
  const v = await catalogVersion(env);
  const groups = await listGroups(env).catch(() => []);
  const gname = id => (groups.find(g => g.id === id) || {}).name || '';
  const out = [];
  if (v === 'V3_CATALOG') {
    let cursor = null;
    for (let i = 0; i < 20; i++) {
      const j = await wix(env, 'POST', '/stores/v3/products/query', { query: { cursorPaging: { limit: 100, ...(cursor ? { cursor } : {}) } }, fields: ['MEDIA_ITEMS_INFO', 'PLAIN_DESCRIPTION', 'URL'] });
      for (const p of j.products || []) {
        const imgs = (p.media?.itemsInfo?.items || []).map(m => m.image?.url || m.url).filter(Boolean);
        if (!imgs.length && p.media?.main?.image?.url) imgs.push(p.media.main.image.url);
        out.push({
          productId: p.id, version: v, name: p.name, slug: p.slug,
          price: Number(p.actualPriceRange?.minValue?.amount || p.variantsInfo?.variants?.[0]?.price?.actualPrice?.amount || 0),
          desc: p.plainDescription ? strip(p.plainDescription) : strip(JSON.stringify(p.description || '')).slice(0, 0),
          images: imgs, ribbon: p.ribbon?.name || '', visible: p.visible !== false,
          inStock: p.inventory?.availabilityStatus ? p.inventory.availabilityStatus !== 'OUT_OF_STOCK' : true,
          groupNames: [],
        });
      }
      cursor = j.pagingMetadata?.cursors?.next;
      if (!cursor) break;
    }
    return out;
  }
  for (let offset = 0; offset < 2000; offset += 100) {
    const j = await wix(env, 'POST', '/stores/v1/products/query', { query: { paging: { limit: 100, offset } }, includeVariants: false });
    for (const p of j.products || []) {
      const imgs = (p.media?.items || []).map(m => m.image?.url).filter(Boolean);
      if (!imgs.length && p.media?.mainMedia?.image?.url) imgs.push(p.media.mainMedia.image.url);
      out.push({
        productId: p.id, version: v, name: p.name, slug: p.slug,
        price: Number(p.priceData?.price ?? p.price?.price ?? 0),
        desc: strip(p.description), html: p.description || '', images: imgs, ribbon: p.ribbon || '', visible: p.visible !== false,
        inStock: p.stock ? p.stock.inStock !== false : true,
        groupNames: (p.collectionIds || []).map(gname).filter(Boolean),
      });
    }
    if (!j.products || j.products.length < 100) break;
  }
  return out;
}
