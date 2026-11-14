(function () {
'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const money = n => { const v = Number(n || 0); return '$' + v.toLocaleString('en-CA', { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 }); };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ago = t => { const m = Math.round((Date.now() - t) / 60000); if (m < 1) return 'Just now'; if (m < 60) return m + ' min ago'; const h = Math.round(m / 60); if (h < 24) return h + ' h ago'; return new Date(t).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }); };

// ---------- storage-safe token
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
let TOKEN = store.get('fes_token');

async function api(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (TOKEN) headers.Authorization = 'Bearer ' + TOKEN;
  if (opts.json !== undefined) { headers['content-type'] = 'application/json'; opts.body = JSON.stringify(opts.json); }
  const r = await fetch(path, { method: opts.method || 'GET', headers, body: opts.body });
  let data = null; try { data = await r.json(); } catch {}
  if (r.status === 401 && path !== '/api/login') { logout(); throw new Error('Please sign in again'); }
  if (!r.ok) throw new Error((data && data.error) || ('Error ' + r.status));
  return data;
}

// ---------- state
const S = { listings: [], requests: [], status: null, filter: 'all', photos: [], openReq: null };

// ---------- nav
let current = 'login';
const backStack = [];
function go(name, opts = {}) {
  if (!opts.fromBack && current !== name && current !== 'login' && name !== 'login') {
    backStack.push(current);
    try { history.pushState({ screen: name }, ''); } catch {}
  }
  current = name; closeSheet(true);
  $$('.screen').forEach(s => s.classList.remove('on'));
  $('#s-' + name).classList.add('on');
  $('#tabs').classList.toggle('hidden', name === 'login');
  const tab = name === 'inv' ? 'req' : name;
  $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.go === tab));
  $('#s-' + name).scrollTop = 0;
  if (name === 'list') loadListings();
  if (name === 'req') loadRequests();
  if (name === 'more') renderMore(true);
}
document.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) go(g.dataset.go); if (e.target.closest('[data-back]')) { if (backStack.length) history.back(); else go('req'); } });

// ---------- login
$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const b = $('#loginBtn'); b.disabled = true; b.innerHTML = '<span class="spin"></span>';
  try {
    const { token } = await api('/api/login', { method: 'POST', json: { pin: $('#pin').value.trim() } });
    TOKEN = token; store.set('fes_token', token); $('#pin').value = '';
    start();
  } catch (err) { toast('Couldn’t open', err.message); }
  b.disabled = false; b.textContent = 'OPEN';
});
function logout() { TOKEN = null; store.del('fes_token'); go('login'); }

// ---------- chips
function setGroup(group, val) { $$(`[data-group="${group}"] .chip`).forEach(c => c.classList.toggle('on', c.dataset.v === val)); }
function getGroup(group) { const c = $(`[data-group="${group}"] .chip.on`); return c ? c.dataset.v : ''; }
$$('[data-group] .chip').forEach(c => c.addEventListener('click', () => setGroup(c.parentElement.dataset.group, c.dataset.v)));

// ---------- photos: resize on the phone, upload right away
function loadImage(file) {
  return new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = URL.createObjectURL(file); });
}
function toJpeg(img, max, q) {
  const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return new Promise(r => c.toBlob(b => r({ blob: b, dataUrl: null, canvas: c }), 'image/jpeg', q));
}
$('#cam').addEventListener('change', async e => {
  const files = [...e.target.files].slice(0, 10 - S.photos.length);
  e.target.value = '';
  for (const f of files) {
    const p = { id: Math.random().toString(36).slice(2), preview: URL.createObjectURL(f), key: null, busy: true, ai: null };
    S.photos.push(p); renderThumbs();
    try {
      const img = await loadImage(f);
      const big = await toJpeg(img, 1600, 0.82);
      const small = await toJpeg(img, 768, 0.7);
      p.ai = small.canvas.toDataURL('image/jpeg', 0.7);
      const r = await api('/api/photos', { method: 'POST', body: big.blob, headers: { 'content-type': 'image/jpeg' } });
      p.key = r.key;
    } catch (err) { p.error = true; toast('Photo didn’t upload', err.message); }
    p.busy = false; renderThumbs();
  }
});
function renderThumbs() {
  $('#thumbs').innerHTML = S.photos.map((p, i) => `<div class="thumb ${p.busy ? 'busy' : ''}"><img src="${p.preview}" alt="Photo ${i + 1}">
    ${p.busy ? '<span class="prog" style="width:60%"></span>' : ''}${p.error ? '<span class="prog" style="width:100%;background:#FF6B57"></span>' : ''}
    <button class="x" data-rm="${p.id}" aria-label="Remove photo ${i + 1}">×</button></div>`).join('')
    + (S.photos.length < 2 ? Array.from({ length: 2 - S.photos.length }, (_, i) => `<div class="thumb">Photo ${S.photos.length + i + 1}</div>`).join('') : '');
  $('#shootLbl').textContent = S.photos.length ? `${S.photos.length} PHOTO${S.photos.length > 1 ? 'S' : ''} · ADD MORE` : 'TAKE PHOTOS';
}
$('#photos').addEventListener('click', e => { const r = e.target.closest('[data-rm]'); if (!r) return; e.preventDefault(); S.photos = S.photos.filter(p => p.id !== r.dataset.rm); renderThumbs(); });
function clearSell() { S.photos = []; $('#fTitle').value = ''; $('#fPrice').value = ''; $('#fDesc').value = ''; setGroup('cond', 'Certified pre-owned'); setGroup('cat', 'Cardio'); $('#fPay').value = 'Invoice'; renderThumbs(); store.del('fes_draft'); }
$('#clearSell').addEventListener('click', () => { clearSell(); toast('Cleared', 'Start a fresh listing.'); });

// keep a text draft if the app gets closed mid-listing
['#fTitle', '#fPrice', '#fDesc'].forEach(s => $(s).addEventListener('input', () => store.set('fes_draft', JSON.stringify({ t: $('#fTitle').value, p: $('#fPrice').value, d: $('#fDesc').value }))));
try { const d = JSON.parse(store.get('fes_draft') || 'null'); if (d) { $('#fTitle').value = d.t || ''; $('#fPrice').value = d.p || ''; $('#fDesc').value = d.d || ''; } } catch {}

// ---------- AI description
$('#aiBtn').addEventListener('click', async () => {
  const title = $('#fTitle').value.trim();
  if (!title) { toast('Add a title first', 'Make and model, e.g. “Life Fitness 95T Treadmill”.'); $('#fTitle').focus(); return; }
  const b = $('#aiBtn'); b.disabled = true; b.querySelector('span').textContent = 'Writing…';
  const el = $('#fDesc'); el.classList.add('typing');
  try {
    const r = await api('/api/ai/describe', { method: 'POST', json: { title, cond: getGroup('cond'), cat: getGroup('cat'), notes: el.value.trim(), images: S.photos.filter(p => p.ai).slice(0, 3).map(p => p.ai) } });
    await typeInto(el, r.text);
    store.set('fes_draft', JSON.stringify({ t: $('#fTitle').value, p: $('#fPrice').value, d: el.value }));
  } catch (err) { toast('Couldn’t write it', err.message); }
  el.classList.remove('typing'); b.disabled = false; b.querySelector('span').textContent = 'Write it for me';
});
function typeInto(el, text) {
  return new Promise(done => { el.value = ''; let i = 0;
    const step = () => { i = Math.min(text.length, i + 4); el.value = text.slice(0, i); el.scrollTop = el.scrollHeight; if (i < text.length) setTimeout(step, 10); else done(); };
    step(); });
}

// ---------- post
$('#postBtn').addEventListener('click', async () => {
  const title = $('#fTitle').value.trim(), price = parseFloat(($('#fPrice').value || '').replace(/[^0-9.]/g, ''));
  if (!title) { toast('Needs a title', 'What is it? Make and model is perfect.'); $('#fTitle').focus(); return; }
  if (!price) { toast('Needs a price', 'Enter the asking price.'); $('#fPrice').focus(); return; }
  if (S.photos.some(p => p.busy)) { toast('Hang on', 'Photos are still uploading.'); return; }
  const btn = $('#postBtn'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span>POSTING…';
  try {
    const l = await api('/api/listings', { method: 'POST', json: { title, price, cond: getGroup('cond'), cat: getGroup('cat'), pay: $('#fPay').value, desc: $('#fDesc').value.trim(), photos: S.photos.filter(p => p.key).map(p => p.key) } });
    S.listings.unshift(l); clearSell();
    openSheet(`<div style="display:flex;flex-direction:column;gap:14px;align-items:center;text-align:center;padding:6px 0 4px">
      ${l.wixError ? '<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#F5B82E" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17v.5"/></svg>' : '<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#7FD8A0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>'}
      <h1 style="font-size:26px">${l.wixError ? (l.wix && l.wix.productId ? 'LIVE — PHOTOS PENDING' : 'SAVED — WEBSITE DIDN’T UPDATE') : 'IT’S LIVE'}</h1>
      <p class="muted" style="margin:0;font-size:15px;line-height:1.5">${l.wixError ? esc(l.wixError) : `“${esc(title)}” is up for ${money(price)}.` + (l.wix && l.wix.pages && l.wix.pages.length ? ` Showing on: ${esc(l.wix.pages.join(', '))}.` : '')}</p>
      <a class="cta" href="${siteLink(l)}" target="_blank" rel="noopener">SEE IT</a>
      <button class="cta ghost" data-close>POST ANOTHER</button></div>`);
  } catch (err) { toast('Didn’t post', err.message); }
  btn.disabled = false; btn.textContent = 'POST TO WEBSITE';
});

// ---------- listings
const siteLink = l => (l.wix && l.wix.slug && S.status && S.status.siteUrl) ? `${S.status.siteUrl}/product-page/${encodeURIComponent(l.wix.slug)}` : `/want/${l.id}`;
const STATUS = { live: ['LIVE', 'st-live'], pending: ['INVOICE SENT', 'st-pend'], sold: ['SOLD', 'st-sold'] };
const thumbOf = l => l.photos && l.photos[0] ? `<img src="/photos/${l.photos[0]}" alt="" loading="lazy">` : l.photoUrls && l.photoUrls[0] ? `<img src="${esc(l.photoUrls[0])}/v1/fill/w_200,h_200,al_c,q_80/t.jpg" onerror="this.onerror=null;this.src='${esc(l.photoUrls[0])}'" alt="" loading="lazy">` : `<svg viewBox="0 0 24 24" fill="none" stroke="#8A8A8A" stroke-width="1.4" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></svg>`;
async function loadListings() {
  if (!S.listings.length) $('#listWrap').innerHTML = '<div class="empty">Loading…</div>';
  try { S.listings = await api('/api/listings'); renderList(); } catch (err) { $('#listWrap').innerHTML = `<div class="empty err">${esc(err.message)}</div>`; }
}
function renderList() {
  const c = { all: S.listings.length, sale: S.listings.filter(l => l.status !== 'sold').length, sold: S.listings.filter(l => l.status === 'sold').length };
  $('#filters').innerHTML = [['all', `All (${c.all})`], ['sale', `For sale (${c.sale})`], ['sold', `Sold (${c.sold})`]].map(([id, l]) => `<button class="chip ${S.filter === id ? 'on' : ''}" data-filter="${id}" style="height:40px">${l}</button>`).join('');
  const items = S.listings.filter(l => S.filter === 'all' || (S.filter === 'sale' ? l.status !== 'sold' : l.status === 'sold'));
  $('#listWrap').innerHTML = items.length ? items.map(l => {
    const reqs = S.requests.filter(r => r.listingId === l.id && r.status === 'new').length;
    const [lab, cls] = reqs && l.status === 'live' ? [`${reqs} BUYER REQUEST${reqs > 1 ? 'S' : ''}`, 'st-req'] : STATUS[l.status];
    return `<button class="card row" data-edit="${l.id}" style="text-align:left;width:100%">
      <div class="list-thumb">${thumbOf(l)}</div>
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px">
        <span style="font-size:15px;font-weight:600;line-height:1.25">${esc(l.title)}</span>
        <span class="muted">${esc(l.cat)} · ${l.cond === 'New' ? 'New' : 'Pre-owned'} · ${money(l.price)}</span>
        <span><span class="status ${cls}">${lab}</span>${l.wixError ? ' <span class="status" style="background:#4A2A26;color:#FF9A8A">WEBSITE NOT UPDATED</span>' : ''}</span>
      </div>
      <span class="icon-btn" aria-hidden="true" style="background:var(--bg)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg></span>
    </button>`; }).join('') : `<div class="empty">${S.filter === 'sold' ? 'Nothing sold yet.' : 'No listings yet. Tap <strong>Sell</strong> to post your first one.'}</div>`;
}
document.addEventListener('click', e => {
  const f = e.target.closest('[data-filter]'); if (f) { S.filter = f.dataset.filter; renderList(); return; }
  const ed = e.target.closest('[data-edit]'); if (ed) editSheet(ed.dataset.edit);
});
function editSheet(id) {
  const l = S.listings.find(x => x.id === id); if (!l) return;
  openSheet(`<div style="display:flex;flex-direction:column;gap:14px">
    <div class="row"><div class="list-thumb" style="width:64px;height:64px">${thumbOf(l)}</div>
      <div style="min-width:0"><div class="brand">EDIT LISTING</div><div style="font-weight:600;font-size:16px;margin-top:2px">${esc(l.title)}</div></div></div>
    ${l.wixError ? `<div class="muted err" style="line-height:1.5">${esc(l.wixError)}</div>` : ''}
    <div><label class="lab" for="eTitle">Title</label><input class="field" id="eTitle" value="${esc(l.title)}" maxlength="80"></div>
    <div><label class="lab" for="ePrice">Price</label><input class="field" id="ePrice" inputmode="decimal" value="${l.price}"></div>
    <div><label class="lab" for="eDesc">Description</label><textarea class="field" id="eDesc">${esc(l.desc)}</textarea></div>
    <button class="cta" data-save="${l.id}">SAVE CHANGES</button>
    <div class="grid2">
      <a class="cta ghost" style="font-size:16px" href="${siteLink(l)}" target="_blank" rel="noopener">VIEW ON SITE</a>
      ${l.status === 'sold' ? `<button class="cta ghost" style="font-size:16px" data-relist="${l.id}">RELIST</button>` : `<button class="cta ghost" style="font-size:16px" data-sold="${l.id}">MARK SOLD</button>`}
    </div>
    <button class="cta ghost" style="font-size:16px;color:#FF9A8A;border-color:#4A2A26" data-remove="${l.id}">REMOVE FROM WEBSITE</button>
  </div>`);
}
document.addEventListener('click', async e => {
  const t = e.target.closest('[data-save],[data-sold],[data-relist],[data-remove],[data-confirm-remove],[data-close]'); if (!t) return;
  if (t.dataset.close !== undefined) { closeSheet(); return; }
  if (t.dataset.remove) {
    const l = S.listings.find(x => x.id === t.dataset.remove);
    openSheet(`<div style="display:flex;flex-direction:column;gap:14px;text-align:center"><h1 style="font-size:24px">REMOVE IT?</h1>
      <p class="muted" style="margin:0;font-size:15px">“${esc(l.title)}” comes off the website and out of the app. This can’t be undone.</p>
      <button class="cta" style="background:#FF6B57" data-confirm-remove="${l.id}">YES, REMOVE</button><button class="cta ghost" data-close>KEEP IT</button></div>`);
    return;
  }
  const id = t.dataset.save || t.dataset.sold || t.dataset.relist || t.dataset.confirmRemove;
  const l = S.listings.find(x => x.id === id); if (!l) return;
  t.disabled = true; const label = t.textContent; t.innerHTML = '<span class="spin"></span>';
  try {
    if (t.dataset.confirmRemove) {
      await api('/api/listings/' + id, { method: 'DELETE' });
      S.listings = S.listings.filter(x => x.id !== id); toast('Removed', 'It’s off the website.');
    } else {
      const body = t.dataset.save ? { title: $('#eTitle').value, price: $('#ePrice').value, desc: $('#eDesc').value } : { status: t.dataset.sold ? 'sold' : 'live' };
      const n = await api('/api/listings/' + id, { method: 'PATCH', json: body });
      Object.assign(l, n);
      toast(n.wixError ? 'Saved — website didn’t update' : t.dataset.save ? 'Saved' : t.dataset.sold ? 'Marked sold' : 'Back on the website', n.wixError || l.title);
    }
    closeSheet(); renderList();
  } catch (err) { toast('Didn’t work', err.message); t.disabled = false; t.textContent = label; }
});

// ---------- requests
async function loadRequests(quiet) {
  try {
    const [reqs, lst] = await Promise.all([api('/api/requests'), S.listings.length ? Promise.resolve(S.listings) : api('/api/listings')]);
    S.requests = reqs; S.listings = lst; renderReq(); if (current === 'list') renderList();
  } catch (err) { if (!quiet) $('#reqWrap').innerHTML = `<div class="empty err">${esc(err.message)}</div>`; }
}
$('#reqRefresh').addEventListener('click', () => loadRequests());
function renderReq() {
  const vis = S.requests.filter(r => r.status !== 'dismissed');
  const n = vis.filter(r => r.status === 'new').length;
  const b = $('#reqBadge'); b.textContent = n; b.classList.toggle('hidden', !n);
  if (!vis.length) { $('#reqWrap').innerHTML = `<div class="empty">No buyer requests yet.<br>When someone taps <strong>I want this</strong> on a listing, it shows up here.</div>`; return; }
  $('#reqWrap').innerHTML = vis.map(r => {
    const l = S.listings.find(x => x.id === r.listingId);
    const st = r.status === 'new' ? '<span class="status st-req">NEW</span>' : r.status === 'sent' ? '<span class="status st-pend">INVOICE SENT</span>' : '<span class="status st-live">PAID</span>';
    return `<button class="card" data-req="${r.id}" style="text-align:left;width:100%;display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:600;font-size:16px">${esc(r.name)}</span><span class="muted" style="font-size:12px">${ago(r.createdAt)}</span></div>
      <span style="font-size:14px;color:var(--y)">${esc(l ? l.title : '(removed listing)')}</span>
      ${r.msg ? `<span style="font-size:14px;color:#E2E2E2;line-height:1.45">“${esc(r.msg)}”</span>` : ''}
      <span>${st}</span></button>`; }).join('');
}
document.addEventListener('click', e => { const r = e.target.closest('[data-req]'); if (r) { S.openReq = r.dataset.req; renderInv(); go('inv'); } });

function totals(l, r) {
  const rate = (S.status && S.status.taxRate) || 0;
  const sub = (+l.price || 0) + (+r.delivery || 0);
  return { sub, tax: sub * rate, tot: sub * (1 + rate), rate };
}
function renderInv() {
  const r = S.requests.find(x => x.id === S.openReq); if (!r) return;
  const l = S.listings.find(x => x.id === r.listingId) || { title: '(removed listing)', price: 0 };
  $('#invTitle').textContent = l.title.toUpperCase();
  const t = totals(l, r);
  const qbOk = S.status && S.status.qb && S.status.qb.connected;
  $('#invWrap').innerHTML = `
    <div class="card" style="display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;justify-content:space-between"><span style="font-weight:600;font-size:16px">${esc(r.name)}</span><span class="muted" style="font-size:12px">${ago(r.createdAt)}</span></div>
      <span class="muted">${esc(r.email)}${r.phone ? ' · ' + esc(r.phone) : ''}</span>
      ${r.msg ? `<p style="margin:2px 0 0;font-size:15px;line-height:1.5;color:#E2E2E2">“${esc(r.msg)}”</p>` : ''}
      <div class="grid2" style="margin-top:4px">
        ${r.phone ? `<a class="cta ghost" style="height:44px;font-size:15px;font-family:var(--body);letter-spacing:0" href="tel:${esc(r.phone)}">Call</a><a class="cta ghost" style="height:44px;font-size:15px;font-family:var(--body);letter-spacing:0" href="sms:${esc(r.phone)}">Text</a>`
        : `<a class="cta ghost" style="height:44px;font-size:15px;font-family:var(--body);letter-spacing:0;grid-column:span 2" href="mailto:${esc(r.email)}?subject=${encodeURIComponent(l.title)}">Email ${esc(r.name.split(' ')[0])}</a>`}
      </div>
    </div>
    <div class="card" style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;justify-content:space-between;align-items:center"><span style="font-family:var(--head);font-size:16px;letter-spacing:.06em">INVOICE</span><span class="qb">QuickBooks</span></div>
      <div class="inv-row"><span>${esc(l.title)}</span><span>${money(l.price)}</span></div>
      <div class="inv-row"><label for="dAmt">Delivery &amp; install</label><input class="money" id="dAmt" inputmode="decimal" value="${r.delivery || 0}" ${r.status !== 'new' ? 'disabled' : ''}></div>
      <div class="inv-row muted" style="font-size:14px"><span>HST (${Math.round(t.rate * 100)}%)</span><span id="iTax">${money(t.tax)}</span></div>
      <div class="line"></div>
      <div class="inv-row" style="font-size:18px;font-weight:700"><span>Total</span><span id="iTot">${money(t.tot)}</span></div>
      <span class="muted" style="line-height:1.5">${r.invoice ? `Invoice #${esc(r.invoice.docNumber || r.invoice.invoiceId)} · ${r.invoice.sent ? 'emailed to ' + esc(r.email) : 'created'}` : 'Goes out from your QuickBooks with a “Pay now” link (card or bank). Your accountant sees it like any other invoice.'}</span>
    </div>
    ${r.status === 'sent' ? `<div class="ok"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7FD8A0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg><div><div style="font-weight:600">Invoice sent</div><div style="font-size:13px">Listing shows “Pending” on the website.</div></div></div>` : ''}
    ${r.status === 'paid' ? `<div class="ok"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7FD8A0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg><div><div style="font-weight:600">Paid</div><div style="font-size:13px">Listing marked sold.</div></div></div>` : ''}
    ${r.status === 'new' && !qbOk ? `<div class="card muted" style="line-height:1.5">QuickBooks isn’t connected yet. Go to <strong>Settings → Connect QuickBooks</strong> once, then invoices go out with one tap.</div>` : ''}`;
  const d = $('#dAmt');
  if (d && r.status === 'new') d.addEventListener('input', () => {
    r.delivery = parseFloat(d.value.replace(/[^0-9.]/g, '')) || 0;
    const t2 = totals(l, r); $('#iTax').textContent = money(t2.tax); $('#iTot').textContent = money(t2.tot);
  });
  const a = $('#invActions');
  if (r.status === 'new') a.innerHTML = `<button class="cta" id="sendInv">SEND QUICKBOOKS INVOICE</button><button class="cta ghost" id="dismissReq" style="margin-top:10px;height:44px;font-size:15px">NOT INTERESTED — HIDE</button>`;
  else if (r.status === 'sent') a.innerHTML = `<button class="cta" id="checkPaid">CHECK IF PAID</button><button class="cta ghost" id="markPaid" style="margin-top:10px;height:44px;font-size:15px">PAID ANOTHER WAY</button>`;
  else a.innerHTML = `<button class="cta ghost" data-go="req">BACK TO REQUESTS</button>`;
}
document.addEventListener('click', async e => {
  const id = e.target.closest('#sendInv,#checkPaid,#markPaid,#dismissReq')?.id; if (!id) return;
  const r = S.requests.find(x => x.id === S.openReq); if (!r) return;
  const btn = $('#' + id); const label = btn.textContent; btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
  try {
    if (id === 'dismissReq') { await api('/api/requests/' + r.id, { method: 'PATCH', json: { status: 'dismissed' } }); r.status = 'dismissed'; go('req'); return; }
    if (id === 'sendInv') {
      await api('/api/requests/' + r.id, { method: 'PATCH', json: { delivery: r.delivery || 0 } });
      const out = await api('/api/requests/' + r.id + '/invoice', { method: 'POST' });
      Object.assign(r, out.request); mergeListing(out.listing);
      toast('Invoice sent', `${r.name} got a pay-online link by email.`);
    }
    if (id === 'checkPaid') {
      const out = await api('/api/requests/' + r.id + '/refresh', { method: 'POST' });
      Object.assign(r, out.request); mergeListing(out.listing);
      toast(r.status === 'paid' ? 'Paid!' : 'Not paid yet', r.status === 'paid' ? 'Recorded in QuickBooks. Listing marked sold.' : `Still owing ${money(out.balance)}.`);
    }
    if (id === 'markPaid') {
      const out = await api('/api/requests/' + r.id + '/paid', { method: 'POST' });
      Object.assign(r, out.request); mergeListing(out.listing); toast('Marked paid', 'Listing marked sold.');
    }
    renderReq(); renderInv();
  } catch (err) { toast('Didn’t work', err.message); btn.disabled = false; btn.textContent = label; }
});
function mergeListing(n) { if (!n) return; const i = S.listings.findIndex(x => x.id === n.id); if (i >= 0) S.listings[i] = n; }

// ---------- settings
async function loadStatus(check) { try { S.status = await api('/api/status' + (check ? '?check=1' : '')); } catch {} return S.status; }
async function renderMore(check) {
  $('#moreWrap').innerHTML = '<div class="empty">Checking connections…</div>';
  const s = await loadStatus(check);
  if (!s) { $('#moreWrap').innerHTML = '<div class="empty err">Couldn’t reach the server.</div>'; return; }
  const w = s.wix, q = s.qb;
  const pagesLine = w.storePages ? `<div class="muted" style="line-height:1.5">Store pages found: ${esc(w.storePages.join(', ') || 'none')}</div>` : '';
  const wixLine = w.mode !== 'wix' ? ['w', 'Test mode — listings show on the app’s own shop page, not Wix yet'] : w.error ? ['w', 'Wix connection problem: ' + w.error] : w.ready ? ['g', 'Connected to your Wix store' + (w.catalogVersion ? ' (' + w.catalogVersion.replace('_CATALOG', '') + ')' : '')] : ['w', 'Wix key not set up yet'];
  $('#moreWrap').innerHTML = `
    <div class="card" style="display:flex;flex-direction:column;gap:10px">
      <div style="font-family:var(--head);letter-spacing:.06em">WEBSITE</div>
      <div><span class="dot ${wixLine[0]}"></span>${esc(wixLine[1])}</div>${pagesLine}
      ${w.mode === 'wix' && w.ready ? `<button class="cta" id="importBtn" style="height:48px;font-size:16px">IMPORT EQUIPMENT FROM WEBSITE</button><div class="muted" style="line-height:1.5">Brings the items already on your Wix store into the app so you can edit, mark sold or remove them here. Safe to run again — it skips items already imported.</div>` : ''}
      <a class="cta ghost" style="height:44px;font-size:15px" href="${esc(s.siteUrl || s.shopUrl)}" target="_blank" rel="noopener">OPEN WEBSITE</a>
    </div>
    <div class="card" style="display:flex;flex-direction:column;gap:10px">
      <div style="font-family:var(--head);letter-spacing:.06em">QUICKBOOKS</div>
      <div><span class="dot ${q.connected ? 'g' : 'w'}"></span>${q.connected ? 'Connected — invoices go out from your QuickBooks' : q.configured ? 'Not connected yet' : 'QuickBooks app keys not set up yet'}</div>
      ${q.configured ? (q.connected ? `<button class="cta ghost" id="qbOff" style="height:44px;font-size:15px">DISCONNECT</button>` : `<a class="cta" href="/qb/connect?t=${encodeURIComponent(TOKEN)}">CONNECT QUICKBOOKS</a>`) : ''}
    </div>
    <div class="card" style="display:flex;flex-direction:column;gap:10px">
      <div style="font-family:var(--head);letter-spacing:.06em">WRITE IT FOR ME</div>
      <div><span class="dot ${s.ai ? 'g' : 'w'}"></span>${s.ai ? 'AI descriptions on' : 'Using a simple template (AI key not set)'}</div>
    </div>
    <div class="card" style="display:flex;flex-direction:column;gap:10px">
      <div style="font-family:var(--head);letter-spacing:.06em">THIS PHONE</div>
      <div class="muted" style="line-height:1.5">On iPhone: Share → <strong>Add to Home Screen</strong> to open this like an app.</div>
      <button class="cta ghost" id="logoutBtn" style="height:44px;font-size:15px">SIGN OUT</button>
    </div>`;
}
document.addEventListener('click', async e => {
  if (e.target.closest('#logoutBtn')) logout();
  if (e.target.closest('#importBtn')) {
    const b = $('#importBtn'); b.disabled = true; b.innerHTML = '<span class="spin"></span>IMPORTING…';
    try { const r = await api('/api/wix/import', { method: 'POST' }); S.listings = await api('/api/listings'); toast('Imported ' + r.added + ' item' + (r.added === 1 ? '' : 's'), `Found ${r.found} on the website${r.skipped ? ', ' + r.skipped + ' already in the app' : ''}.`); go('list'); }
    catch (err) { toast('Import didn’t work', err.message); b.disabled = false; b.textContent = 'IMPORT EQUIPMENT FROM WEBSITE'; }
  }
  if (e.target.closest('#qbOff')) { await api('/api/qb/disconnect', { method: 'POST' }); renderMore(); }
});

// ---------- sheet & toast
let sheetOpen = false;
function openSheet(html) {
  $('#sheetBody').innerHTML = html; $('#scrim').classList.add('on'); $('#sheet').classList.add('on');
  if (!sheetOpen) { sheetOpen = true; try { history.pushState({ sheet: true }, ''); } catch {} }
}
function closeSheet(silent) {
  $('#scrim').classList.remove('on'); $('#sheet').classList.remove('on');
  if (sheetOpen) { sheetOpen = false; if (!silent) { try { history.back(); } catch {} } }
}
// phone/browser Back: close a pop-up first, otherwise go to the previous screen
window.addEventListener('popstate', () => {
  if (sheetOpen) { sheetOpen = false; $('#scrim').classList.remove('on'); $('#sheet').classList.remove('on'); return; }
  const prev = backStack.pop();
  if (prev && current !== 'login') go(prev, { fromBack: true });
});
$('#sheetX').addEventListener('click', () => closeSheet());
document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheetOpen) closeSheet(); });
$('#scrim').addEventListener('click', () => closeSheet());
$('.grab').addEventListener('click', () => closeSheet());
let tt;
function toast(title, sub) {
  const t = $('#toast');
  t.innerHTML = `<div style="min-width:0"><div style="font-weight:600;font-size:15px">${esc(title)}</div><div class="muted" style="overflow:hidden;text-overflow:ellipsis">${esc(sub || '')}</div></div>`;
  t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 3200);
}

// ---------- start
async function start() {
  go('sell'); renderThumbs();
  await loadStatus();
  loadRequests(true);
  if (location.hash.includes('qb=connected')) { history.replaceState(null, '', '/'); go('more'); toast('QuickBooks connected', 'Invoices will go out from your QuickBooks.'); }
}
// new requests: check every minute while the app is open
setInterval(() => { if (TOKEN && document.visibilityState === 'visible') loadRequests(true); }, 60000);
document.addEventListener('visibilitychange', () => { if (TOKEN && document.visibilityState === 'visible') loadRequests(true); });

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
if (TOKEN) start(); else go('login');
})();
