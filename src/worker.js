import { db, newId } from './db.js';
import { describe } from './ai.js';
import { wantPage, shopPage } from './pages.js';
import * as wix from './wix.js';
import * as qb from './qb.js';

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const html = (body, status = 200) => new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
const fail = (msg, status = 400) => json({ error: msg }, status);
const ip = req => req.headers.get('cf-connecting-ip') || 'local';

async function readJson(req) { try { return await req.json(); } catch { return {}; } }

// --- simple per-IP rate limit (best effort, KV based)
async function limited(env, key, max, windowSec) {
  const k = `rl:${key}`;
  const n = Number(await env.DB.get(k)) || 0;
  if (n >= max) return true;
  await env.DB.put(k, String(n + 1), { expirationTtl: windowSec });
  return false;
}

// --- auth: Frank types a PIN once per phone; we hand back a long-lived token.
async function authed(req, env) {
  const h = req.headers.get('authorization') || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : new URL(req.url).searchParams.get('t');
  if (!token) return false;
  return !!(await env.DB.get('sess:' + token));
}

function cleanListing(body, existing = {}) {
  const price = Number(String(body.price ?? existing.price ?? '').replace(/[^0-9.]/g, ''));
  return {
    ...existing,
    title: String(body.title ?? existing.title ?? '').trim().slice(0, 80),
    cond: body.cond === 'New' ? 'New' : (body.cond ?? existing.cond ?? 'Certified pre-owned'),
    cat: ['Cardio', 'Strength', 'Recovery'].includes(body.cat) ? body.cat : (existing.cat || 'Cardio'),
    price: isFinite(price) ? price : 0,
    pay: ['Invoice', 'Buy now', 'Both'].includes(body.pay) ? body.pay : (existing.pay || 'Invoice'),
    desc: String(body.desc ?? existing.desc ?? '').slice(0, 4000),
    photos: Array.isArray(body.photos) ? body.photos.filter(k => /^[a-z0-9]+\.jpg$/.test(k)).slice(0, 10) : (existing.photos || []),
    photoUrls: existing.photoUrls || [],
    status: ['live', 'pending', 'sold'].includes(body.status) ? body.status : (existing.status || 'live'),
  };
}

async function syncToWix(env, l, origin, action) {
  if (!wix.wixReady(env)) return l;
  try {
    if (action === 'create') l.wix = await wix.createProduct(env, l, { origin });
    else if (action === 'update') await wix.updateProduct(env, l, { origin });
    else if (action === 'delete') await wix.deleteProduct(env, l);
    l.wixError = l.wix?.photoError ? 'On the website, but the photos didn’t copy — ' + l.wix.photoError.replace(/^Wix problem copying photos: /, '') + '. Tap Save on this item to retry.' : null;
  } catch (e) {
    console.log(e.message);
    l.wixError = e.message.slice(0, 300);
  }
  return l;
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const { pathname: p } = url;
    const origin = url.origin;
    const D = db(env);
    const M = req.method;

    try {
      // ---------- public
      if (p.startsWith('/photos/') && M === 'GET') {
        const key = p.slice(8);
        if (!/^[a-z0-9]+\.jpg$/.test(key)) return new Response('Not found', { status: 404 });
        const obj = await env.PHOTOS.get(key);
        if (!obj) return new Response('Not found', { status: 404 });
        return new Response(obj.body, { headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable' } });
      }
      if (p.startsWith('/want/') && M === 'GET') return html(wantPage(env, await D.listing(p.slice(6))));
      if (p === '/shop' && M === 'GET') return html(shopPage(env, await D.listings()));

      if (p === '/api/public/requests' && M === 'POST') {
        if (await limited(env, 'req:' + ip(req), 10, 3600)) return fail('Too many requests — please call the shop.', 429);
        const b = await readJson(req);
        if (b.website) return json({ ok: true }); // honeypot: bots fill hidden field
        const l = await D.listing(String(b.listingId || ''));
        if (!l || l.status !== 'live') return fail('That item is no longer available.', 404);
        const name = String(b.name || '').trim().slice(0, 80), email = String(b.email || '').trim().slice(0, 120);
        if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail('Please add your name and a valid email.');
        await D.upsertRequest({
          id: newId(), listingId: l.id, name, email,
          phone: String(b.phone || '').trim().slice(0, 40), msg: String(b.msg || '').trim().slice(0, 1000),
          delivery: 0, status: 'new', createdAt: Date.now(),
        });
        return json({ ok: true });
      }

      if (p === '/api/login' && M === 'POST') {
        if (await limited(env, 'login:' + ip(req), 8, 900)) return fail('Too many tries. Wait 15 minutes.', 429);
        const { pin } = await readJson(req);
        if (!env.APP_PIN) return fail('App PIN not set up yet (APP_PIN secret).', 500);
        if (String(pin || '') !== String(env.APP_PIN)) return fail('Wrong PIN', 401);
        const token = crypto.randomUUID() + crypto.randomUUID().slice(0, 8);
        await env.DB.put('sess:' + token, '1', { expirationTtl: 60 * 60 * 24 * 365 });
        return json({ token });
      }

      // QuickBooks redirect lands here after Frank signs in with Intuit.
      if (p === '/qb/callback' && M === 'GET') {
        const state = url.searchParams.get('state');
        if (!state || !(await env.DB.get('qbstate:' + state))) return html('<h2>Link expired. Open the app and tap Connect QuickBooks again.</h2>', 400);
        await env.DB.delete('qbstate:' + state);
        await qb.finishConnect(env, origin, url.searchParams.get('code'), url.searchParams.get('realmId'));
        return Response.redirect(origin + '/#settings?qb=connected', 302);
      }

      // ---------- everything below needs the PIN token
      if (p.startsWith('/api/') || p.startsWith('/qb/')) {
        if (!(await authed(req, env))) return fail('Sign in with your PIN', 401);
      } else {
        return env.ASSETS.fetch(req);
      }

      if (p === '/qb/connect' && M === 'GET') {
        if (!qb.qbConfigured(env)) return html('<h2>QuickBooks app keys are not set up yet.</h2>', 500);
        const state = newId() + newId();
        await env.DB.put('qbstate:' + state, '1', { expirationTtl: 900 });
        return Response.redirect(qb.connectUrl(env, origin, state), 302);
      }

      if (p === '/api/status' && M === 'GET') {
        let wixInfo = { mode: env.STORE_MODE, ready: wix.wixReady(env) };
        if (wixInfo.ready && url.searchParams.get('check')) {
          try { Object.assign(wixInfo, await wix.testConnection(env)); } catch (e) { wixInfo.error = e.message; }
        }
        return json({ siteUrl: env.SITE_URL || '', business: env.BUSINESS_NAME, taxRate: Number(env.SALES_TAX_RATE || 0), ai: !!env.ANTHROPIC_API_KEY, wix: wixInfo, qb: await qb.qbStatus(env), shopUrl: origin + '/shop' });
      }

      // photos: one JPEG per call (the app resizes on the phone first)
      if (p === '/api/photos' && M === 'POST') {
        const buf = await req.arrayBuffer();
        if (!buf.byteLength || buf.byteLength > 6_000_000) return fail('Photo too large');
        const key = newId() + newId() + '.jpg';
        await env.PHOTOS.put(key, buf, { httpMetadata: { contentType: 'image/jpeg' } });
        return json({ key, url: `/photos/${key}` });
      }

      if (p === '/api/ai/describe' && M === 'POST') {
        const b = await readJson(req);
        if (!b.title) return fail('Add a title first');
        return json(await describe(env, b));
      }

      if (p === '/api/listings' && M === 'GET') return json(await D.listings());
      if (p === '/api/listings' && M === 'POST') {
        const l = cleanListing(await readJson(req));
        if (!l.title) return fail('Needs a title');
        if (!l.price) return fail('Needs a price');
        l.id = newId(); l.createdAt = Date.now(); l.status = 'live';
        await syncToWix(env, l, origin, 'create');
        await D.upsertListing(l);
        return json(l);
      }
      const lm = p.match(/^\/api\/listings\/([a-z0-9]+)$/);
      if (lm) {
        const cur = await D.listing(lm[1]);
        if (!cur) return fail('Not found', 404);
        if (M === 'PATCH') {
          const l = cleanListing(await readJson(req), cur);
          await syncToWix(env, l, origin, cur.wix ? 'update' : 'create');
          await D.upsertListing(l);
          return json(l);
        }
        if (M === 'DELETE') {
          await syncToWix(env, cur, origin, 'delete');
          if (cur.wixError) return fail('Wix said: ' + cur.wixError, 502);
          await D.removeListing(cur.id);
          ctx.waitUntil(Promise.all((cur.photos || []).map(k => env.PHOTOS.delete(k))));
          return json({ ok: true });
        }
      }

      if (p === '/api/requests' && M === 'GET') return json(await D.requests());
      const rm = p.match(/^\/api\/requests\/([a-z0-9]+)(\/invoice|\/refresh|\/paid)?$/);
      if (rm) {
        const all = await D.requests();
        const r = all.find(x => x.id === rm[1]);
        if (!r) return fail('Not found', 404);
        const l = await D.listing(r.listingId);
        const action = rm[2];

        if (!action && M === 'PATCH') {
          const b = await readJson(req);
          if (b.delivery !== undefined) r.delivery = Math.max(0, Number(String(b.delivery).replace(/[^0-9.]/g, '')) || 0);
          if (b.status === 'dismissed') r.status = 'dismissed';
          if (b.seen) r.seen = true;
          await D.upsertRequest(r);
          return json(r);
        }
        if (action === '/invoice' && M === 'POST') {
          if (!l) return fail('That listing was removed.');
          if (r.status !== 'new') return fail('Invoice already sent.');
          const q = await qb.qbStatus(env);
          if (!q.connected) return fail('QuickBooks isn’t connected yet. Open Settings → Connect QuickBooks.', 409);
          const inv = await qb.createAndSendInvoice(env, { listing: l, request: r });
          Object.assign(r, { status: 'sent', invoice: inv, sentAt: Date.now() });
          await D.upsertRequest(r);
          l.status = 'pending';
          await syncToWix(env, l, origin, 'update');
          await D.upsertListing(l);
          return json({ request: r, listing: l });
        }
        if (action === '/refresh' && M === 'POST') {
          if (r.status !== 'sent' || !r.invoice) return json({ request: r });
          const s = await qb.invoicePaid(env, r.invoice.invoiceId);
          if (s.paid) {
            r.status = 'paid'; r.paidAt = Date.now();
            await D.upsertRequest(r);
            if (l) { l.status = 'sold'; await syncToWix(env, l, origin, 'update'); await D.upsertListing(l); }
          }
          return json({ request: r, listing: l, balance: s.balance });
        }
        if (action === '/paid' && M === 'POST') { // manual: paid by cash/e-transfer
          r.status = 'paid'; r.paidAt = Date.now();
          await D.upsertRequest(r);
          if (l) { l.status = 'sold'; await syncToWix(env, l, origin, 'update'); await D.upsertListing(l); }
          return json({ request: r, listing: l });
        }
      }

      if (p === '/api/wix/import' && M === 'POST') {
        if (!wix.wixReady(env)) return fail('Connect Wix first.', 409);
        const products = await wix.listProducts(env);
        const all = await D.listings();
        const known = new Set(all.filter(l => l.wix?.productId).map(l => l.wix.productId));
        let added = 0, skipped = 0;
        for (const pr of products) {
          if (known.has(pr.productId)) { skipped++; continue; }
          const names = pr.groupNames.join(' ');
          const sold = /sold/i.test(pr.ribbon) || !pr.inStock;
          all.push({
            id: newId(), createdAt: Date.now() - added, imported: true,
            title: String(pr.name || 'Untitled').slice(0, 80),
            cond: /\bnew\b/i.test(pr.name + ' ' + names) && !/reman|pre.?owned|certified|refurb|used/i.test(pr.name + ' ' + names) ? 'New' : 'Certified pre-owned',
            cat: /strength|pulley|press|rack|curl|pulldown|bench|rope|smith|cable/i.test(pr.name + ' ' + names) ? 'Strength' : /recover/i.test(names) ? 'Recovery' : 'Cardio',
            price: pr.price || 0, pay: 'Invoice', desc: pr.desc || '', photos: [], photoUrls: pr.images.slice(0, 10),
            status: sold ? 'sold' : /pending/i.test(pr.ribbon) ? 'pending' : 'live',
            wix: { productId: pr.productId, version: pr.version, slug: pr.slug, imported: true, pages: pr.groupNames, originalHtml: pr.html || '', originalText: pr.desc || '' },
          });
          added++;
        }
        await D.saveListings(all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
        return json({ found: products.length, added, skipped });
      }

      if (p === '/api/qb/disconnect' && M === 'POST') { await qb.disconnect(env); return json({ ok: true }); }

      return fail('Not found', 404);
    } catch (e) {
      console.log('ERR', e.stack || e.message);
      return fail(e.message || 'Something went wrong', 500);
    }
  },
};
