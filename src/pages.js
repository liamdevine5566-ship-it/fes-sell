// Public pages buyers see: the "I want this" request form, and a simple shop list
// (used in local mode before the Wix connection is live).

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => { const v = Number(n || 0); return '$' + v.toLocaleString('en-CA', { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 }); };

const shell = (env, title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)} — ${esc(env.BUSINESS_NAME)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600&family=Inter:wght@400;500;600&display=swap">
<style>
*{box-sizing:border-box}body{margin:0;background:#E8E7E7;color:#111;font-family:Inter,system-ui,sans-serif}
.head{background:#000;color:#fff;padding:16px 18px;font-family:Oswald,sans-serif;font-weight:600;letter-spacing:.1em}
.head a{color:#fff;text-decoration:none}
.wrap{max-width:640px;margin:0 auto;padding:16px}
h1{font-family:Oswald,sans-serif;font-weight:600;font-size:30px;line-height:1.1;margin:6px 0}
.price{font-family:Oswald,sans-serif;font-size:26px}
.tags{display:flex;gap:6px}.tag{font-size:11px;font-weight:700;letter-spacing:.06em;padding:4px 8px;background:#111;color:#fff}.tag.o{background:none;color:#111;border:1px solid #111}
.gallery{display:flex;gap:8px;overflow-x:auto;scroll-snap-type:x mandatory}
.gallery img{width:100%;flex:0 0 100%;aspect-ratio:4/3;object-fit:cover;background:#fff;scroll-snap-align:start}
p.desc{white-space:pre-line;line-height:1.55;color:#333}
label{display:block;font-weight:600;font-size:14px;margin:14px 0 6px}
input,textarea{width:100%;font:inherit;font-size:16px;padding:12px;border:1px solid #bbb;background:#fff}
textarea{min-height:90px}
button{width:100%;height:56px;margin-top:18px;border:2px solid #111;background:#F4B63A;color:#111;font-family:Oswald,sans-serif;font-size:20px;font-weight:600;letter-spacing:.06em;cursor:pointer}
button[disabled]{background:#ccc;border-color:#999;color:#555}
.note{font-size:13px;color:#555;text-align:center;line-height:1.5;margin-top:10px}
.ok{background:#fff;border:2px solid #111;padding:18px;margin-top:16px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}
.card{background:#fff;color:#111;text-decoration:none;display:block}
.card img{width:100%;aspect-ratio:1;object-fit:cover;display:block;background:#f3f3f3}
.card div{padding:8px 10px}.card .t{font-weight:600;font-size:14px}.card .p{font-family:Oswald,sans-serif;font-size:17px}
.hp{position:absolute;left:-9999px}
</style></head><body><div class="head"><a href="/shop">${esc(env.BUSINESS_NAME).toUpperCase()}</a></div><div class="wrap">${body}</div></body></html>`;

export function wantPage(env, l) {
  if (!l) return shell(env, 'Not found', `<h1>That listing is gone</h1><p>It may have sold. <a href="/shop">See what's available</a>.</p>`);
  const sold = l.status === 'sold', pend = l.status === 'pending';
  const imgs = (l.photos || []).map(k => `<img src="/photos/${esc(k)}" alt="${esc(l.title)}">`).join('');
  return shell(env, l.title, `
    ${imgs ? `<div class="gallery">${imgs}</div>` : ''}
    <div class="tags" style="margin-top:14px"><span class="tag">${l.cond === 'New' ? 'NEW' : 'CERTIFIED PRE-OWNED'}</span><span class="tag o">${esc((l.cat || '').toUpperCase())}</span></div>
    <h1>${esc(l.title.toUpperCase())}</h1>
    <div class="price">${money(l.price)}</div>
    <p class="desc">${esc(l.desc)}</p>
    <div id="done" class="ok" hidden><h1 style="font-size:24px">REQUEST SENT</h1><p>Thanks! Frank will get back to you shortly, usually with an invoice that has a secure pay-online link.</p></div>
    <form id="f" ${sold || pend ? 'hidden' : ''}>
      <label for="name">Your name</label><input id="name" name="name" required autocomplete="name">
      <label for="email">Email</label><input id="email" name="email" type="email" required autocomplete="email">
      <label for="phone">Phone (optional)</label><input id="phone" name="phone" type="tel" autocomplete="tel">
      <label for="msg">Message</label><textarea id="msg" name="msg" placeholder="Pickup or delivery? Any questions?"></textarea>
      <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button id="go">I WANT THIS</button>
      <div class="note">Frank gets your request on his phone and replies with an invoice you can pay online.</div>
    </form>
    ${sold ? '<button disabled>SOLD</button>' : pend ? '<button disabled>SALE PENDING</button>' : ''}
    <script>
    document.getElementById('f').addEventListener('submit', async e => {
      e.preventDefault();
      const b = document.getElementById('go'); b.disabled = true; b.textContent = 'SENDING…';
      const fd = Object.fromEntries(new FormData(e.target));
      const r = await fetch('/api/public/requests', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...fd, listingId: ${JSON.stringify(l.id)} }) });
      if (r.ok) { e.target.hidden = true; document.getElementById('done').hidden = false; }
      else { b.disabled = false; b.textContent = 'I WANT THIS'; alert('Sorry — that didn\\'t go through. Please try again or call the shop.'); }
    });
    </script>`);
}

export function shopPage(env, listings) {
  const live = listings.filter(l => l.status !== 'sold');
  return shell(env, 'Shop', `<h1>SHOP EQUIPMENT</h1>
    <div class="grid">${live.map(l => `<a class="card" href="/want/${esc(l.id)}">
      ${l.photos?.[0] ? `<img src="/photos/${esc(l.photos[0])}" alt="">` : '<img alt="">'}
      <div><div class="t">${esc(l.title)}</div><div class="p">${l.status === 'pending' ? 'Sale pending' : money(l.price)}</div></div></a>`).join('') || '<p>Nothing listed right now.</p>'}</div>`);
}
