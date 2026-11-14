var L=e=>({async get(t,i=null){return await e.DB.get(t,"json")??i},put(t,i,n){return e.DB.put(t,JSON.stringify(i),n)},del(t){return e.DB.delete(t)},async listings(){return await this.get("listings",[])},saveListings(t){return this.put("listings",t)},async listing(t){return(await this.listings()).find(i=>i.id===t)||null},async upsertListing(t){let i=await this.listings(),n=i.findIndex(s=>s.id===t.id);return n>=0?i[n]=t:i.unshift(t),await this.saveListings(i),t},async removeListing(t){await this.saveListings((await this.listings()).filter(i=>i.id!==t))},async requests(){return await this.get("requests",[])},saveRequests(t){return this.put("requests",t)},async upsertRequest(t){let i=await this.requests(),n=i.findIndex(s=>s.id===t.id);return n>=0?i[n]=t:i.unshift(t),await this.saveRequests(i.slice(0,500)),t}}),x=()=>crypto.randomUUID().replace(/-/g,"").slice(0,12);async function q(e,{title:t,cond:i,cat:n,notes:s,images:o=[]}){if(!e.ANTHROPIC_API_KEY)return{text:k({title:t,cond:i,cat:n}),source:"template"};let d=[];for(let A of o.slice(0,3)){let a=/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(A||"");a&&d.push({type:"image",source:{type:"base64",media_type:a[1],data:a[2]}})}d.push({type:"text",text:`Write a short listing description for a piece of fitness equipment sold by ${e.BUSINESS_NAME} in ${e.BUSINESS_TOWN}.

Title: ${t}
Condition: ${i}
Category: ${n}
${s?`Owner's notes: ${s}
`:""}
Rules:
- 2 or 3 short paragraphs, plain text, no headings, no emoji, no bullet symbols.
- Only state facts given above or plainly visible in the photos. Do NOT invent specs, dimensions, weight limits, warranty terms, age, hours of use or prices.
- If condition is "Certified pre-owned", say it has been inspected and serviced by the shop.
- End with one line: pickup in ${e.BUSINESS_TOWN}, delivery and installation available.
- Friendly, confident, straight-talking. No hype words like "amazing" or "incredible".`});let l=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"x-api-key":e.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","content-type":"application/json"},body:JSON.stringify({model:e.AI_MODEL||"claude-sonnet-5-5",max_tokens:500,messages:[{role:"user",content:d}]})});return l.ok?{text:((await l.json()).content||[]).filter(A=>A.type==="text").map(A=>A.text).join("").trim()||k({title:t,cond:i,cat:n}),source:"ai"}:(console.log("AI error",l.status,await l.text()),{text:k({title:t,cond:i,cat:n}),source:"template"})}function k({title:e,cond:t,cat:i}){let n=t!=="New";return[`${e} \u2014 ${n?"certified pre-owned":"brand new"} ${String(i||"fitness").toLowerCase()} equipment.`,n?"Inspected, serviced and tested before it leaves the shop. Clean, solid and ready to work.":"Brand new with full manufacturer warranty.","Pickup available, or ask about delivery and installation."].join(`

`)}var f=e=>String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]),z=e=>{let t=Number(e||0);return"$"+t.toLocaleString("en-CA",{minimumFractionDigits:Number.isInteger(t)?0:2,maximumFractionDigits:2})},B=(e,t,i)=>`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${f(t)} \u2014 ${f(e.BUSINESS_NAME)}</title>
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
</style></head><body><div class="head"><a href="/shop">${f(e.BUSINESS_NAME).toUpperCase()}</a></div><div class="wrap">${i}</div></body></html>`;function M(e,t){if(!t)return B(e,"Not found",`<h1>That listing is gone</h1><p>It may have sold. <a href="/shop">See what's available</a>.</p>`);let i=t.status==="sold",n=t.status==="pending",s=(t.photos||[]).map(o=>`<img src="/photos/${f(o)}" alt="${f(t.title)}">`).join("");return B(e,t.title,`
    ${s?`<div class="gallery">${s}</div>`:""}
    <div class="tags" style="margin-top:14px"><span class="tag">${t.cond==="New"?"NEW":"CERTIFIED PRE-OWNED"}</span><span class="tag o">${f((t.cat||"").toUpperCase())}</span></div>
    <h1>${f(t.title.toUpperCase())}</h1>
    <div class="price">${z(t.price)}</div>
    <p class="desc">${f(t.desc)}</p>
    <div id="done" class="ok" hidden><h1 style="font-size:24px">REQUEST SENT</h1><p>Thanks! Frank will get back to you shortly, usually with an invoice that has a secure pay-online link.</p></div>
    <form id="f" ${i||n?"hidden":""}>
      <label for="name">Your name</label><input id="name" name="name" required autocomplete="name">
      <label for="email">Email</label><input id="email" name="email" type="email" required autocomplete="email">
      <label for="phone">Phone (optional)</label><input id="phone" name="phone" type="tel" autocomplete="tel">
      <label for="msg">Message</label><textarea id="msg" name="msg" placeholder="Pickup or delivery? Any questions?"></textarea>
      <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button id="go">I WANT THIS</button>
      <div class="note">Frank gets your request on his phone and replies with an invoice you can pay online.</div>
    </form>
    ${i?"<button disabled>SOLD</button>":n?"<button disabled>SALE PENDING</button>":""}
    <script>
    document.getElementById('f').addEventListener('submit', async e => {
      e.preventDefault();
      const b = document.getElementById('go'); b.disabled = true; b.textContent = 'SENDING\u2026';
      const fd = Object.fromEntries(new FormData(e.target));
      const r = await fetch('/api/public/requests', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...fd, listingId: ${JSON.stringify(t.id)} }) });
      if (r.ok) { e.target.hidden = true; document.getElementById('done').hidden = false; }
      else { b.disabled = false; b.textContent = 'I WANT THIS'; alert('Sorry \u2014 that didn\\'t go through. Please try again or call the shop.'); }
    });
    </script>`)}function D(e,t){let i=t.filter(n=>n.status!=="sold");return B(e,"Shop",`<h1>SHOP EQUIPMENT</h1>
    <div class="grid">${i.map(n=>`<a class="card" href="/want/${f(n.id)}">
      ${n.photos?.[0]?`<img src="/photos/${f(n.photos[0])}" alt="">`:'<img alt="">'}
      <div><div class="t">${f(n.title)}</div><div class="p">${n.status==="pending"?"Sale pending":z(n.price)}</div></div></a>`).join("")||"<p>Nothing listed right now.</p>"}</div>`)}var st="https://www.wixapis.com";async function v(e,t,i,n){let s=await fetch((e.WIX_API_BASE||st)+i,{method:t,headers:{Authorization:e.WIX_API_KEY,"wix-site-id":e.WIX_SITE_ID,"Content-Type":"application/json"},body:n?JSON.stringify(n):void 0}),o=await s.text(),d;try{d=o?JSON.parse(o):{}}catch{d={raw:o}}if(!s.ok){let l=new Error(`Wix ${t} ${i} \u2192 ${s.status}: ${o.slice(0,300)}`);throw l.status=s.status,l}return d}var O=e=>e.STORE_MODE==="wix"&&!!e.WIX_API_KEY&&!!e.WIX_SITE_ID;async function U(e){let t=await e.DB.get("wix:catalogVersion");if(t)return t;let n=(await v(e,"GET","/stores/v3/provision/version")).catalogVersion||"V1_CATALOG";return await e.DB.put("wix:catalogVersion",n,{expirationTtl:86400}),n}async function at(e,t,i){let n=await v(e,"POST","/site-media/v1/files/import",{url:t,mimeType:"image/jpeg",displayName:i,mediaType:"IMAGE"});if(n.file?.operationStatus==="FAILED")throw new Error("Wix could not import photo "+i);return n.file.url}var T=e=>String(e??"").replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]);function R(e,t){return`${String(e.desc||"").split(/\n{2,}/).map(n=>`<p>${T(n).replace(/\n/g,"<br>")}</p>`).join("")}<p><strong>Condition:</strong> ${T(e.cond)}</p><p><a href="${T(t)}" target="_blank"><strong>I WANT THIS \u2192 send Frank a request</strong></a></p>`}function H(e,t){let i=(s,o)=>({type:"PARAGRAPH",paragraphData:{},nodes:[{type:"TEXT",textData:{text:s,decorations:o||[]}}]}),n=String(e.desc||"").split(/\n{2,}/).filter(Boolean).map(s=>i(s));return n.push(i(`Condition: ${e.cond}`)),n.push(i("I WANT THIS \u2192 send Frank a request",[{type:"LINK",linkData:{link:{url:t,target:"BLANK"}}},{type:"BOLD"}])),{nodes:n}}var N=e=>e==="sold"?"SOLD":e==="pending"?"PENDING":"";async function j(e,t,{origin:i}){let n=await U(e),s=`${i}/want/${t.id}`,o=[];for(let[c,h]of(t.photos||[]).slice(0,n==="V3_CATALOG"?3:10).entries())o.push(await at(e,`${i}/photos/${h}`,`${t.id}-${c+1}.jpg`));if(n==="V3_CATALOG"){let c={name:t.title.slice(0,80),productType:"PHYSICAL",physicalProperties:{},visible:!0,description:H(t,s),variantsInfo:{variants:[{price:{actualPrice:{amount:String(t.price)}},physicalProperties:{},visible:!0}]}};return o.length&&(c.media={itemsInfo:{items:o.map(A=>({url:A,altText:t.title}))}}),{productId:(await v(e,"POST","/stores/v3/products",{product:c})).product.id,version:n}}let l=(await v(e,"POST","/stores/v1/products",{product:{name:t.title.slice(0,80),description:R(t,s),visible:!0,productType:"physical",priceData:{price:Number(t.price)}}})).product.id;return o.length&&await v(e,"POST",`/stores/v1/products/${l}/media`,{media:o.map(c=>({url:c}))}),{productId:l,version:n}}async function $(e,t,{origin:i}){if(!t.wix?.productId)return;let n=t.wix.productId,s=`${i}/want/${t.id}`;if(t.wix.version==="V3_CATALOG"){let o=await v(e,"GET",`/stores/v3/products/${n}?fields=VARIANT_OPTION_CHOICE_NAMES`),d=o.product?.variantsInfo?.variants?.[0],l={id:n,revision:o.product.revision,name:t.title.slice(0,80),description:H(t,s),ribbon:N(t.status)?{name:N(t.status)}:void 0};d&&(l.variantsInfo={variants:[{id:d.id,price:{actualPrice:{amount:String(t.price)}},physicalProperties:d.physicalProperties||{}}]}),await v(e,"PATCH",`/stores/v3/products/${n}`,{product:l});return}await v(e,"PATCH",`/stores/v1/products/${n}`,{product:{name:t.title.slice(0,80),description:R(t,s),priceData:{price:Number(t.price)},ribbon:N(t.status)}})}async function K(e,t){if(!t.wix?.productId)return;let i=t.wix.version==="V3_CATALOG"?"/stores/v3/products/":"/stores/v1/products/";await v(e,"DELETE",i+t.wix.productId)}async function W(e){return{catalogVersion:await U(e)}}var rt="https://appcenter.intuit.com/connect/oauth2",lt="https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",ct=e=>e.QB_API_BASE||(e.QB_ENV==="sandbox"?"https://sandbox-quickbooks.api.intuit.com":"https://quickbooks.api.intuit.com"),dt="minorversion=75",Q=e=>!!(e.QB_CLIENT_ID&&e.QB_CLIENT_SECRET);function J(e,t,i){let n=new URLSearchParams({client_id:e.QB_CLIENT_ID,response_type:"code",scope:"com.intuit.quickbooks.accounting",redirect_uri:`${t}/qb/callback`,state:i});return`${rt}?${n}`}async function V(e,t){let i=await fetch(lt,{method:"POST",headers:{Authorization:"Basic "+btoa(`${e.QB_CLIENT_ID}:${e.QB_CLIENT_SECRET}`),"Content-Type":"application/x-www-form-urlencoded",Accept:"application/json"},body:new URLSearchParams(t)});if(!i.ok)throw new Error("QuickBooks sign-in failed: "+i.status+" "+(await i.text()).slice(0,200));return i.json()}async function F(e,t,i,n){let s=await V(e,{grant_type:"authorization_code",code:i,redirect_uri:`${t}/qb/callback`});await G(e,{...s,realmId:n})}async function G(e,t){let i=Date.now();await e.DB.put("qb:tokens",JSON.stringify({realmId:t.realmId,access_token:t.access_token,refresh_token:t.refresh_token,access_expires:i+(t.expires_in-120)*1e3}))}async function pt(e){let t=JSON.parse(await e.DB.get("qb:tokens")||"null");if(!t)throw new Error("QuickBooks is not connected yet.");if(Date.now()<t.access_expires)return t;let i=await V(e,{grant_type:"refresh_token",refresh_token:t.refresh_token});return await G(e,{...i,realmId:t.realmId}),{...t,access_token:i.access_token}}async function P(e){let t=JSON.parse(await e.DB.get("qb:tokens")||"null");return{configured:Q(e),connected:!!t}}async function X(e){await e.DB.delete("qb:tokens")}async function y(e,t,i,n,s="application/json"){let o=await pt(e),d=i.includes("?")?"&":"?",l=await fetch(`${ct(e)}/v3/company/${o.realmId}${i}${d}${dt}`,{method:t,headers:{Authorization:`Bearer ${o.access_token}`,Accept:"application/json","Content-Type":s},body:n?JSON.stringify(n):void 0}),c=await l.text();if(!l.ok)throw new Error(`QuickBooks ${t} ${i.split("?")[0]} \u2192 ${l.status}: ${c.slice(0,300)}`);return c?JSON.parse(c):{}}var I=(e,t)=>y(e,"GET",`/query?query=${encodeURIComponent(t)}`),C=e=>String(e).replace(/'/g,"\\'");async function ut(e,{name:t,email:i,phone:n}){if(i){let l=await I(e,`select * from Customer where PrimaryEmailAddr = '${C(i)}'`);if(l.QueryResponse?.Customer?.length)return l.QueryResponse.Customer[0]}let s=t.slice(0,100);(await I(e,`select * from Customer where DisplayName = '${C(s)}'`)).QueryResponse?.Customer?.length&&(s=`${t} (${i||Date.now().toString(36)})`.slice(0,100));let d={DisplayName:s};return i&&(d.PrimaryEmailAddr={Address:i}),n&&(d.PrimaryPhone={FreeFormNumber:n}),(await y(e,"POST","/customer",d)).Customer}async function gt(e){let t=await e.DB.get("qb:itemId");if(t)return t;let i=e.QB_ITEM_NAME||"Fitness Equipment",s=(await I(e,`select * from Item where Name = '${C(i)}'`)).QueryResponse?.Item?.[0];if(!s){let d=(await I(e,"select * from Account where AccountType = 'Income' maxresults 1")).QueryResponse?.Account?.[0];if(!d)throw new Error("No income account found in QuickBooks.");s=(await y(e,"POST","/item",{Name:i,Type:"NonInventory",IncomeAccountRef:{value:d.Id}})).Item}return await e.DB.put("qb:itemId",s.Id),s.Id}async function ht(e){let t=e.QB_TAX_CODE_NAME;if(!t)return null;let i=await e.DB.get("qb:taxCode:"+t);if(i)return i;let s=(await I(e,`select * from TaxCode where Name = '${C(t)}'`)).QueryResponse?.TaxCode?.[0]?.Id||null;return s&&await e.DB.put("qb:taxCode:"+t,s),s}async function Z(e,{listing:t,request:i}){let n=await ut(e,i),s=await gt(e),o=await ht(e),d=(a,r)=>({DetailType:"SalesItemLineDetail",Amount:Number(a),Description:r,SalesItemLineDetail:{ItemRef:{value:s},Qty:1,UnitPrice:Number(a),...o?{TaxCodeRef:{value:o}}:{}}}),l=[d(t.price,`${t.title} (${t.cond})`)];Number(i.delivery)>0&&l.push(d(i.delivery,"Delivery & installation"));let c={CustomerRef:{value:n.Id},Line:l,AllowOnlineCreditCardPayment:!0,AllowOnlineACHPayment:!0,CustomerMemo:{value:`Thanks for choosing ${e.BUSINESS_NAME}!`},PrivateNote:`From the FES Sell app \xB7 listing ${t.id} \xB7 request ${i.id}`};i.email&&(c.BillEmail={Address:i.email}),o&&(c.TxnTaxDetail={TxnTaxCodeRef:{value:o}});let h=(await y(e,"POST","/invoice",c)).Invoice,A=!1;return i.email&&(await y(e,"POST",`/invoice/${h.Id}/send?sendTo=${encodeURIComponent(i.email)}`,void 0,"application/octet-stream"),A=!0),{invoiceId:h.Id,docNumber:h.DocNumber,total:h.TotalAmt,sent:A}}async function Y(e,t){let i=(await y(e,"GET",`/invoice/${t}`)).Invoice;return{paid:Number(i.Balance)===0,balance:Number(i.Balance),total:Number(i.TotalAmt)}}var g=(e,t=200)=>new Response(JSON.stringify(e),{status:t,headers:{"content-type":"application/json","cache-control":"no-store"}}),S=(e,t=200)=>new Response(e,{status:t,headers:{"content-type":"text/html; charset=utf-8"}}),u=(e,t=400)=>g({error:e},t),_=e=>e.headers.get("cf-connecting-ip")||"local";async function w(e){try{return await e.json()}catch{return{}}}async function tt(e,t,i,n){let s=`rl:${t}`,o=Number(await e.DB.get(s))||0;return o>=i?!0:(await e.DB.put(s,String(o+1),{expirationTtl:n}),!1)}async function ft(e,t){let i=e.headers.get("authorization")||"",n=i.startsWith("Bearer ")?i.slice(7):new URL(e.url).searchParams.get("t");return n?!!await t.DB.get("sess:"+n):!1}function et(e,t={}){let i=Number(String(e.price??t.price??"").replace(/[^0-9.]/g,""));return{...t,title:String(e.title??t.title??"").trim().slice(0,80),cond:e.cond==="New"?"New":e.cond??t.cond??"Certified pre-owned",cat:["Cardio","Strength","Recovery"].includes(e.cat)?e.cat:t.cat||"Cardio",price:isFinite(i)?i:0,pay:["Invoice","Buy now","Both"].includes(e.pay)?e.pay:t.pay||"Invoice",desc:String(e.desc??t.desc??"").slice(0,4e3),photos:Array.isArray(e.photos)?e.photos.filter(n=>/^[a-z0-9]+\.jpg$/.test(n)).slice(0,10):t.photos||[],status:["live","pending","sold"].includes(e.status)?e.status:t.status||"live"}}async function E(e,t,i,n){if(!O(e))return t;try{n==="create"?t.wix=await j(e,t,{origin:i}):n==="update"?await $(e,t,{origin:i}):n==="delete"&&await K(e,t),t.wixError=null}catch(s){console.log(s.message),t.wixError=s.message.slice(0,300)}return t}var mt={STORE_MODE:"local",WIX_SITE_ID:"5bb413e8-a139-4c76-ae34-c36b2e5f6fc1",BUSINESS_NAME:"Fitness Equipment Solutions",BUSINESS_TOWN:"Rothesay, NB",SALES_TAX_RATE:"0.15",QB_ENV:"production",QB_TAX_CODE_NAME:"HST NB",QB_ITEM_NAME:"Fitness Equipment",AI_MODEL:"claude-sonnet-5-5"},Ct={async fetch(e,t,i){let n={...mt,...t},s=new URL(e.url),{pathname:o}=s,d=s.origin,l=L(n),c=e.method;try{if(o.startsWith("/photos/")&&c==="GET"){let a=o.slice(8);if(!/^[a-z0-9]+\.jpg$/.test(a))return new Response("Not found",{status:404});let r=await n.DB.get("photo:"+a,"arrayBuffer");return r?new Response(r,{headers:{"content-type":"image/jpeg","cache-control":"public, max-age=31536000, immutable"}}):new Response("Not found",{status:404})}if(o.startsWith("/want/")&&c==="GET")return S(M(n,await l.listing(o.slice(6))));if(o==="/shop"&&c==="GET")return S(D(n,await l.listings()));if(o==="/api/public/requests"&&c==="POST"){if(await tt(n,"req:"+_(e),10,3600))return u("Too many requests \u2014 please call the shop.",429);let a=await w(e);if(a.website)return g({ok:!0});let r=await l.listing(String(a.listingId||""));if(!r||r.status!=="live")return u("That item is no longer available.",404);let p=String(a.name||"").trim().slice(0,80),b=String(a.email||"").trim().slice(0,120);return!p||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b)?u("Please add your name and a valid email."):(await l.upsertRequest({id:x(),listingId:r.id,name:p,email:b,phone:String(a.phone||"").trim().slice(0,40),msg:String(a.msg||"").trim().slice(0,1e3),delivery:0,status:"new",createdAt:Date.now()}),g({ok:!0}))}if(o==="/api/login"&&c==="POST"){if(await tt(n,"login:"+_(e),8,900))return u("Too many tries. Wait 15 minutes.",429);let{pin:a}=await w(e);if(!n.APP_PIN)return u("App PIN not set up yet (APP_PIN secret).",500);if(String(a||"")!==String(n.APP_PIN))return u("Wrong PIN",401);let r=crypto.randomUUID()+crypto.randomUUID().slice(0,8);return await n.DB.put("sess:"+r,"1",{expirationTtl:3600*24*365}),g({token:r})}if(o==="/qb/callback"&&c==="GET"){let a=s.searchParams.get("state");return!a||!await n.DB.get("qbstate:"+a)?S("<h2>Link expired. Open the app and tap Connect QuickBooks again.</h2>",400):(await n.DB.delete("qbstate:"+a),await F(n,d,s.searchParams.get("code"),s.searchParams.get("realmId")),Response.redirect(d+"/#settings?qb=connected",302))}if(o.startsWith("/api/")||o.startsWith("/qb/")){if(!await ft(e,n))return u("Sign in with your PIN",401)}else return vt(o);if(o==="/qb/connect"&&c==="GET"){if(!Q(n))return S("<h2>QuickBooks app keys are not set up yet.</h2>",500);let a=x()+x();return await n.DB.put("qbstate:"+a,"1",{expirationTtl:900}),Response.redirect(J(n,d,a),302)}if(o==="/api/status"&&c==="GET"){let a={mode:n.STORE_MODE,ready:O(n)};if(a.ready&&s.searchParams.get("check"))try{Object.assign(a,await W(n))}catch(r){a.error=r.message}return g({business:n.BUSINESS_NAME,taxRate:Number(n.SALES_TAX_RATE||0),ai:!!n.ANTHROPIC_API_KEY,wix:a,qb:await P(n),shopUrl:d+"/shop"})}if(o==="/api/photos"&&c==="POST"){let a=await e.arrayBuffer();if(!a.byteLength||a.byteLength>6e6)return u("Photo too large");let r=x()+x()+".jpg";return await n.DB.put("photo:"+r,a),g({key:r,url:`/photos/${r}`})}if(o==="/api/ai/describe"&&c==="POST"){let a=await w(e);return a.title?g(await q(n,a)):u("Add a title first")}if(o==="/api/listings"&&c==="GET")return g(await l.listings());if(o==="/api/listings"&&c==="POST"){let a=et(await w(e));return a.title?a.price?(a.id=x(),a.createdAt=Date.now(),a.status="live",await E(n,a,d,"create"),await l.upsertListing(a),g(a)):u("Needs a price"):u("Needs a title")}let h=o.match(/^\/api\/listings\/([a-z0-9]+)$/);if(h){let a=await l.listing(h[1]);if(!a)return u("Not found",404);if(c==="PATCH"){let r=et(await w(e),a);return await E(n,r,d,a.wix?"update":"create"),await l.upsertListing(r),g(r)}if(c==="DELETE")return await E(n,a,d,"delete"),a.wixError?u("Wix said: "+a.wixError,502):(await l.removeListing(a.id),i.waitUntil(Promise.all((a.photos||[]).map(r=>n.DB.delete("photo:"+r)))),g({ok:!0}))}if(o==="/api/requests"&&c==="GET")return g(await l.requests());let A=o.match(/^\/api\/requests\/([a-z0-9]+)(\/invoice|\/refresh|\/paid)?$/);if(A){let r=(await l.requests()).find(m=>m.id===A[1]);if(!r)return u("Not found",404);let p=await l.listing(r.listingId),b=A[2];if(!b&&c==="PATCH"){let m=await w(e);return m.delivery!==void 0&&(r.delivery=Math.max(0,Number(String(m.delivery).replace(/[^0-9.]/g,""))||0)),m.status==="dismissed"&&(r.status="dismissed"),m.seen&&(r.seen=!0),await l.upsertRequest(r),g(r)}if(b==="/invoice"&&c==="POST"){if(!p)return u("That listing was removed.");if(r.status!=="new")return u("Invoice already sent.");if(!(await P(n)).connected)return u("QuickBooks isn\u2019t connected yet. Open Settings \u2192 Connect QuickBooks.",409);let it=await Z(n,{listing:p,request:r});return Object.assign(r,{status:"sent",invoice:it,sentAt:Date.now()}),await l.upsertRequest(r),p.status="pending",await E(n,p,d,"update"),await l.upsertListing(p),g({request:r,listing:p})}if(b==="/refresh"&&c==="POST"){if(r.status!=="sent"||!r.invoice)return g({request:r});let m=await Y(n,r.invoice.invoiceId);return m.paid&&(r.status="paid",r.paidAt=Date.now(),await l.upsertRequest(r),p&&(p.status="sold",await E(n,p,d,"update"),await l.upsertListing(p))),g({request:r,listing:p,balance:m.balance})}if(b==="/paid"&&c==="POST")return r.status="paid",r.paidAt=Date.now(),await l.upsertRequest(r),p&&(p.status="sold",await E(n,p,d,"update"),await l.upsertListing(p)),g({request:r,listing:p})}return o==="/api/qb/disconnect"&&c==="POST"?(await X(n),g({ok:!0})):u("Not found",404)}catch(h){return console.log("ERR",h.stack||h.message),u(h.message||"Something went wrong",500)}}},nt={"/app.css":{t:"text/css",b64:!1,d:`
:root{
  --bg:#0E0E0E; --s1:#1A1A1A; --s2:#262626; --line:#2E2E2E; --line2:#1F1F1F;
  --tx:#F5F5F5; --mu:#A3A3A3; --lab:#C8C8C8; --y:#F5B82E; --y2:#FFD36B;
  --ok:#7FD8A0; --okbg:#0F2A1A; --okline:#1E5A36;
  --head:'Oswald','Arial Narrow',Impact,sans-serif;
  --body:'Inter',-apple-system,system-ui,sans-serif;
  --safe-b:env(safe-area-inset-bottom,0px); --safe-t:env(safe-area-inset-top,0px);
}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0;height:100%;background:#000;color:var(--tx);font-family:var(--body);overscroll-behavior:none}
button,input,textarea,select{font:inherit;color:inherit}
button{cursor:pointer}
.app{position:relative;max-width:480px;height:100%;margin:0 auto;background:var(--bg);display:flex;flex-direction:column;overflow:hidden}
@media (min-width:600px){
  body{display:flex;align-items:center;justify-content:center;background:#151515}
  .app{height:min(900px,96vh);width:420px;border-radius:44px;border:10px solid #000;box-shadow:0 30px 80px rgba(0,0,0,.6)}
}
.screen{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;display:none;flex-direction:column}
.screen.on{display:flex}
header.top{padding:18px 20px 12px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.brand{font-family:var(--head);font-size:12px;letter-spacing:.12em;color:var(--mu)}
h1{margin:2px 0 0;font-family:var(--head);font-weight:600;font-size:30px;letter-spacing:.02em;line-height:1.05}
.pad{padding:4px 20px 24px;display:flex;flex-direction:column;gap:18px}
.lab{font-size:13px;font-weight:600;color:var(--lab);display:block;margin-bottom:6px}
.field{height:50px;width:100%;border-radius:12px;border:1px solid var(--line);background:var(--s1);padding:0 14px;font-size:16px;outline:none}
.field:focus,textarea:focus{border-color:var(--y)}
textarea.field{height:auto;min-height:110px;padding:12px 14px;line-height:1.5;resize:none}
.chips{display:flex;gap:8px;flex-wrap:wrap}
.chip{height:44px;padding:0 18px;border-radius:22px;border:1px solid var(--line);background:var(--s1);font-size:15px}
.chip.on{background:var(--y);border-color:var(--y);color:#0E0E0E;font-weight:600}
.seg{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.seg .chip{border-radius:12px;padding:0 8px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.icon-btn{width:44px;height:44px;border-radius:22px;border:1px solid var(--line);background:var(--s1);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.photos{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.shoot{grid-column:span 2;grid-row:span 2;min-height:190px;border-radius:14px;border:1.5px dashed var(--y);background:#17140A;color:var(--y);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;font-family:var(--head);font-size:18px;letter-spacing:.06em}
.thumb{aspect-ratio:1;border-radius:12px;background:var(--s2);display:flex;align-items:center;justify-content:center;color:#8A8A8A;font-size:11px;overflow:hidden;position:relative}
.thumb img{width:100%;height:100%;object-fit:cover}
.thumb .x{position:absolute;top:4px;right:4px;width:24px;height:24px;border-radius:12px;background:rgba(0,0,0,.7);border:none;color:#fff;font-size:14px;line-height:1}
.ai{height:36px;padding:0 12px;border-radius:18px;border:1px solid var(--y);background:transparent;color:var(--y);font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px}
.ai[disabled]{opacity:.5}
.cta-wrap{padding:12px 20px 12px;border-top:1px solid var(--line2);background:var(--bg)}
.cta{width:100%;height:56px;border-radius:14px;border:none;background:var(--y);color:#0E0E0E;font-family:var(--head);font-size:20px;font-weight:600;letter-spacing:.08em;display:flex;align-items:center;justify-content:center;gap:10px}
.cta:active{transform:scale(.99)}
.cta.ghost{background:var(--s1);border:1px solid var(--line);color:var(--tx)}
nav.tabs{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--line2);padding-bottom:var(--safe-b);background:var(--bg)}
nav.tabs button{height:64px;background:none;border:none;color:var(--mu);font-size:11px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;position:relative}
nav.tabs button.on{color:var(--y);font-weight:600}
.badge{position:absolute;top:8px;left:calc(50% + 6px);min-width:18px;height:18px;border-radius:9px;background:var(--y);color:#0E0E0E;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 5px}
nav.tabs button.on .badge{background:#fff}
.card{padding:12px;border-radius:14px;background:var(--s1);border:1px solid var(--s2)}
.row{display:flex;gap:12px;align-items:center}
.list-thumb{width:76px;height:76px;flex-shrink:0;border-radius:10px;overflow:hidden;background:var(--s2)}
.list-thumb img,.list-thumb svg{width:100%;height:100%;object-fit:cover;display:block}
.status{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.06em;padding:3px 8px;border-radius:6px}
.st-live{background:#1F2A1F;color:#9BE29B}.st-req{background:var(--y);color:#0E0E0E}.st-pend{background:#1D2433;color:#9DB8F0}.st-sold{background:#2A2A2A;color:#BDBDBD}
.muted{color:var(--mu);font-size:13px}
.empty{padding:28px 18px;text-align:center;color:var(--mu);border:1px dashed #3A3A3A;border-radius:14px;line-height:1.5}
/* sheet */
.scrim{position:absolute;inset:0;background:rgba(0,0,0,.6);opacity:0;pointer-events:none;transition:opacity .2s;z-index:20}
.scrim.on{opacity:1;pointer-events:auto}
.sheet{position:absolute;left:0;right:0;bottom:0;background:#141414;border-top-left-radius:22px;border-top-right-radius:22px;border-top:1px solid var(--line);padding:10px 20px calc(20px + var(--safe-b));transform:translateY(105%);transition:transform .25s ease;z-index:21;max-height:88%;overflow-y:auto}
.sheet.on{transform:none}
.grab{width:40px;height:5px;border-radius:3px;background:#3A3A3A;margin:0 auto 14px}
.toast{position:absolute;left:16px;right:16px;top:calc(48px + var(--safe-t));background:#1E1E1E;border:1px solid var(--line);border-radius:14px;padding:12px 14px;display:flex;gap:12px;align-items:center;transform:translateY(calc(-100% - 120px));transition:transform .3s ease;z-index:30;box-shadow:0 10px 30px rgba(0,0,0,.5)}
.toast.on{transform:none}
.spin{width:20px;height:20px;border:2.5px solid rgba(0,0,0,.25);border-top-color:#0E0E0E;border-radius:50%;animation:sp .8s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
.ok{display:flex;gap:12px;align-items:center;padding:14px;border-radius:14px;background:var(--okbg);border:1px solid var(--okline);color:#B9F0CC}
.line{height:1px;background:var(--line)}
.inv-row{display:flex;justify-content:space-between;align-items:center;font-size:15px;gap:10px}
.money{width:120px;height:42px;border-radius:10px;border:1px solid var(--line);background:var(--bg);padding:0 10px;text-align:right;font-size:15px;outline:none}
.qb{font-size:12px;font-weight:700;padding:3px 8px;border-radius:6px;background:var(--okbg);color:var(--ok)}
.pill-note{font-size:12px;color:#555;text-align:center;line-height:1.5}
.typing::after{content:'\u258D';animation:bl 1s steps(1) infinite;color:var(--y)}
@keyframes bl{50%{opacity:0}}
.hidden{display:none!important}
.sold-ribbon{position:absolute;top:14px;left:-6px;background:#111;color:#fff;font-family:var(--head);letter-spacing:.1em;padding:6px 14px;font-size:14px}

header.top{padding-top:calc(18px + var(--safe-t))}
.thumbs{display:contents}
.thumb .prog{position:absolute;inset:auto 0 0 0;height:4px;background:var(--y);transition:width .2s}
.thumb.busy img{opacity:.5}
.grab{border:none;display:block;padding:0}
.err{color:#FF9A8A}
.set-row{display:flex;justify-content:space-between;align-items:center;gap:12px}
.dot{width:10px;height:10px;border-radius:5px;display:inline-block;margin-right:8px;background:#555}
.dot.g{background:#7FD8A0}.dot.w{background:var(--y)}
a.cta{text-decoration:none}
`},"/sw.js":{t:"text/javascript",b64:!1,d:`// Keeps the app shell on the phone so it opens instantly; data always comes fresh from the server.
const CACHE = "fes-sell-v2";
const SHELL = ['/', '/index.html', '/app.css', '/app.js', '/manifest.webmanifest', '/icons/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || !SHELL.includes(u.pathname)) return;
  // network first, fall back to cache when offline
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
`},"/app.js":{t:"text/javascript",b64:!1,d:`(function () {
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
function go(name) {
  current = name; closeSheet();
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
document.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) go(g.dataset.go); });

// ---------- login
$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const b = $('#loginBtn'); b.disabled = true; b.innerHTML = '<span class="spin"></span>';
  try {
    const { token } = await api('/api/login', { method: 'POST', json: { pin: $('#pin').value.trim() } });
    TOKEN = token; store.set('fes_token', token); $('#pin').value = '';
    start();
  } catch (err) { toast('Couldn\u2019t open', err.message); }
  b.disabled = false; b.textContent = 'OPEN';
});
function logout() { TOKEN = null; store.del('fes_token'); go('login'); }

// ---------- chips
function setGroup(group, val) { $$(\`[data-group="\${group}"] .chip\`).forEach(c => c.classList.toggle('on', c.dataset.v === val)); }
function getGroup(group) { const c = $(\`[data-group="\${group}"] .chip.on\`); return c ? c.dataset.v : ''; }
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
    } catch (err) { p.error = true; toast('Photo didn\u2019t upload', err.message); }
    p.busy = false; renderThumbs();
  }
});
function renderThumbs() {
  $('#thumbs').innerHTML = S.photos.map((p, i) => \`<div class="thumb \${p.busy ? 'busy' : ''}"><img src="\${p.preview}" alt="Photo \${i + 1}">
    \${p.busy ? '<span class="prog" style="width:60%"></span>' : ''}\${p.error ? '<span class="prog" style="width:100%;background:#FF6B57"></span>' : ''}
    <button class="x" data-rm="\${p.id}" aria-label="Remove photo \${i + 1}">\xD7</button></div>\`).join('')
    + (S.photos.length < 2 ? Array.from({ length: 2 - S.photos.length }, (_, i) => \`<div class="thumb">Photo \${S.photos.length + i + 1}</div>\`).join('') : '');
  $('#shootLbl').textContent = S.photos.length ? \`\${S.photos.length} PHOTO\${S.photos.length > 1 ? 'S' : ''} \xB7 ADD MORE\` : 'TAKE PHOTOS';
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
  if (!title) { toast('Add a title first', 'Make and model, e.g. \u201CLife Fitness 95T Treadmill\u201D.'); $('#fTitle').focus(); return; }
  const b = $('#aiBtn'); b.disabled = true; b.querySelector('span').textContent = 'Writing\u2026';
  const el = $('#fDesc'); el.classList.add('typing');
  try {
    const r = await api('/api/ai/describe', { method: 'POST', json: { title, cond: getGroup('cond'), cat: getGroup('cat'), notes: el.value.trim(), images: S.photos.filter(p => p.ai).slice(0, 3).map(p => p.ai) } });
    await typeInto(el, r.text);
    store.set('fes_draft', JSON.stringify({ t: $('#fTitle').value, p: $('#fPrice').value, d: el.value }));
  } catch (err) { toast('Couldn\u2019t write it', err.message); }
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
  const btn = $('#postBtn'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span>POSTING\u2026';
  try {
    const l = await api('/api/listings', { method: 'POST', json: { title, price, cond: getGroup('cond'), cat: getGroup('cat'), pay: $('#fPay').value, desc: $('#fDesc').value.trim(), photos: S.photos.filter(p => p.key).map(p => p.key) } });
    S.listings.unshift(l); clearSell();
    openSheet(\`<div style="display:flex;flex-direction:column;gap:14px;align-items:center;text-align:center;padding:6px 0 4px">
      \${l.wixError ? '<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#F5B82E" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17v.5"/></svg>' : '<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#7FD8A0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>'}
      <h1 style="font-size:26px">\${l.wixError ? 'SAVED \u2014 WEBSITE DIDN\u2019T UPDATE' : 'IT\u2019S LIVE'}</h1>
      <p class="muted" style="margin:0;font-size:15px;line-height:1.5">\${l.wixError ? 'It\u2019s saved in the app. The website said: ' + esc(l.wixError) : \`\u201C\${esc(title)}\u201D is up for \${money(price)}.\`}</p>
      <a class="cta" href="/want/\${l.id}" target="_blank" rel="noopener">SEE IT</a>
      <button class="cta ghost" data-close>POST ANOTHER</button></div>\`);
  } catch (err) { toast('Didn\u2019t post', err.message); }
  btn.disabled = false; btn.textContent = 'POST TO WEBSITE';
});

// ---------- listings
const STATUS = { live: ['LIVE', 'st-live'], pending: ['INVOICE SENT', 'st-pend'], sold: ['SOLD', 'st-sold'] };
const thumbOf = l => l.photos && l.photos[0] ? \`<img src="/photos/\${l.photos[0]}" alt="" loading="lazy">\` : \`<svg viewBox="0 0 24 24" fill="none" stroke="#8A8A8A" stroke-width="1.4" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></svg>\`;
async function loadListings() {
  if (!S.listings.length) $('#listWrap').innerHTML = '<div class="empty">Loading\u2026</div>';
  try { S.listings = await api('/api/listings'); renderList(); } catch (err) { $('#listWrap').innerHTML = \`<div class="empty err">\${esc(err.message)}</div>\`; }
}
function renderList() {
  const c = { all: S.listings.length, sale: S.listings.filter(l => l.status !== 'sold').length, sold: S.listings.filter(l => l.status === 'sold').length };
  $('#filters').innerHTML = [['all', \`All (\${c.all})\`], ['sale', \`For sale (\${c.sale})\`], ['sold', \`Sold (\${c.sold})\`]].map(([id, l]) => \`<button class="chip \${S.filter === id ? 'on' : ''}" data-filter="\${id}" style="height:40px">\${l}</button>\`).join('');
  const items = S.listings.filter(l => S.filter === 'all' || (S.filter === 'sale' ? l.status !== 'sold' : l.status === 'sold'));
  $('#listWrap').innerHTML = items.length ? items.map(l => {
    const reqs = S.requests.filter(r => r.listingId === l.id && r.status === 'new').length;
    const [lab, cls] = reqs && l.status === 'live' ? [\`\${reqs} BUYER REQUEST\${reqs > 1 ? 'S' : ''}\`, 'st-req'] : STATUS[l.status];
    return \`<button class="card row" data-edit="\${l.id}" style="text-align:left;width:100%">
      <div class="list-thumb">\${thumbOf(l)}</div>
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px">
        <span style="font-size:15px;font-weight:600;line-height:1.25">\${esc(l.title)}</span>
        <span class="muted">\${esc(l.cat)} \xB7 \${l.cond === 'New' ? 'New' : 'Pre-owned'} \xB7 \${money(l.price)}</span>
        <span><span class="status \${cls}">\${lab}</span>\${l.wixError ? ' <span class="status" style="background:#4A2A26;color:#FF9A8A">WEBSITE NOT UPDATED</span>' : ''}</span>
      </div>
      <span class="icon-btn" aria-hidden="true" style="background:var(--bg)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg></span>
    </button>\`; }).join('') : \`<div class="empty">\${S.filter === 'sold' ? 'Nothing sold yet.' : 'No listings yet. Tap <strong>Sell</strong> to post your first one.'}</div>\`;
}
document.addEventListener('click', e => {
  const f = e.target.closest('[data-filter]'); if (f) { S.filter = f.dataset.filter; renderList(); return; }
  const ed = e.target.closest('[data-edit]'); if (ed) editSheet(ed.dataset.edit);
});
function editSheet(id) {
  const l = S.listings.find(x => x.id === id); if (!l) return;
  openSheet(\`<div style="display:flex;flex-direction:column;gap:14px">
    <div class="row"><div class="list-thumb" style="width:64px;height:64px">\${thumbOf(l)}</div>
      <div style="min-width:0"><div class="brand">EDIT LISTING</div><div style="font-weight:600;font-size:16px;margin-top:2px">\${esc(l.title)}</div></div></div>
    \${l.wixError ? \`<div class="muted err" style="line-height:1.5">Website didn\u2019t update: \${esc(l.wixError)}. Saving again will retry.</div>\` : ''}
    <div><label class="lab" for="eTitle">Title</label><input class="field" id="eTitle" value="\${esc(l.title)}" maxlength="80"></div>
    <div><label class="lab" for="ePrice">Price</label><input class="field" id="ePrice" inputmode="decimal" value="\${l.price}"></div>
    <div><label class="lab" for="eDesc">Description</label><textarea class="field" id="eDesc">\${esc(l.desc)}</textarea></div>
    <button class="cta" data-save="\${l.id}">SAVE CHANGES</button>
    <div class="grid2">
      <a class="cta ghost" style="font-size:16px" href="/want/\${l.id}" target="_blank" rel="noopener">VIEW ON SITE</a>
      \${l.status === 'sold' ? \`<button class="cta ghost" style="font-size:16px" data-relist="\${l.id}">RELIST</button>\` : \`<button class="cta ghost" style="font-size:16px" data-sold="\${l.id}">MARK SOLD</button>\`}
    </div>
    <button class="cta ghost" style="font-size:16px;color:#FF9A8A;border-color:#4A2A26" data-remove="\${l.id}">REMOVE FROM WEBSITE</button>
  </div>\`);
}
document.addEventListener('click', async e => {
  const t = e.target.closest('[data-save],[data-sold],[data-relist],[data-remove],[data-confirm-remove],[data-close]'); if (!t) return;
  if (t.dataset.close !== undefined) { closeSheet(); return; }
  if (t.dataset.remove) {
    const l = S.listings.find(x => x.id === t.dataset.remove);
    openSheet(\`<div style="display:flex;flex-direction:column;gap:14px;text-align:center"><h1 style="font-size:24px">REMOVE IT?</h1>
      <p class="muted" style="margin:0;font-size:15px">\u201C\${esc(l.title)}\u201D comes off the website and out of the app. This can\u2019t be undone.</p>
      <button class="cta" style="background:#FF6B57" data-confirm-remove="\${l.id}">YES, REMOVE</button><button class="cta ghost" data-close>KEEP IT</button></div>\`);
    return;
  }
  const id = t.dataset.save || t.dataset.sold || t.dataset.relist || t.dataset.confirmRemove;
  const l = S.listings.find(x => x.id === id); if (!l) return;
  t.disabled = true; const label = t.textContent; t.innerHTML = '<span class="spin"></span>';
  try {
    if (t.dataset.confirmRemove) {
      await api('/api/listings/' + id, { method: 'DELETE' });
      S.listings = S.listings.filter(x => x.id !== id); toast('Removed', 'It\u2019s off the website.');
    } else {
      const body = t.dataset.save ? { title: $('#eTitle').value, price: $('#ePrice').value, desc: $('#eDesc').value } : { status: t.dataset.sold ? 'sold' : 'live' };
      const n = await api('/api/listings/' + id, { method: 'PATCH', json: body });
      Object.assign(l, n);
      toast(n.wixError ? 'Saved \u2014 website didn\u2019t update' : t.dataset.save ? 'Saved' : t.dataset.sold ? 'Marked sold' : 'Back on the website', n.wixError || l.title);
    }
    closeSheet(); renderList();
  } catch (err) { toast('Didn\u2019t work', err.message); t.disabled = false; t.textContent = label; }
});

// ---------- requests
async function loadRequests(quiet) {
  try {
    const [reqs, lst] = await Promise.all([api('/api/requests'), S.listings.length ? Promise.resolve(S.listings) : api('/api/listings')]);
    S.requests = reqs; S.listings = lst; renderReq(); if (current === 'list') renderList();
  } catch (err) { if (!quiet) $('#reqWrap').innerHTML = \`<div class="empty err">\${esc(err.message)}</div>\`; }
}
$('#reqRefresh').addEventListener('click', () => loadRequests());
function renderReq() {
  const vis = S.requests.filter(r => r.status !== 'dismissed');
  const n = vis.filter(r => r.status === 'new').length;
  const b = $('#reqBadge'); b.textContent = n; b.classList.toggle('hidden', !n);
  if (!vis.length) { $('#reqWrap').innerHTML = \`<div class="empty">No buyer requests yet.<br>When someone taps <strong>I want this</strong> on a listing, it shows up here.</div>\`; return; }
  $('#reqWrap').innerHTML = vis.map(r => {
    const l = S.listings.find(x => x.id === r.listingId);
    const st = r.status === 'new' ? '<span class="status st-req">NEW</span>' : r.status === 'sent' ? '<span class="status st-pend">INVOICE SENT</span>' : '<span class="status st-live">PAID</span>';
    return \`<button class="card" data-req="\${r.id}" style="text-align:left;width:100%;display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:600;font-size:16px">\${esc(r.name)}</span><span class="muted" style="font-size:12px">\${ago(r.createdAt)}</span></div>
      <span style="font-size:14px;color:var(--y)">\${esc(l ? l.title : '(removed listing)')}</span>
      \${r.msg ? \`<span style="font-size:14px;color:#E2E2E2;line-height:1.45">\u201C\${esc(r.msg)}\u201D</span>\` : ''}
      <span>\${st}</span></button>\`; }).join('');
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
  $('#invWrap').innerHTML = \`
    <div class="card" style="display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;justify-content:space-between"><span style="font-weight:600;font-size:16px">\${esc(r.name)}</span><span class="muted" style="font-size:12px">\${ago(r.createdAt)}</span></div>
      <span class="muted">\${esc(r.email)}\${r.phone ? ' \xB7 ' + esc(r.phone) : ''}</span>
      \${r.msg ? \`<p style="margin:2px 0 0;font-size:15px;line-height:1.5;color:#E2E2E2">\u201C\${esc(r.msg)}\u201D</p>\` : ''}
      <div class="grid2" style="margin-top:4px">
        \${r.phone ? \`<a class="cta ghost" style="height:44px;font-size:15px;font-family:var(--body);letter-spacing:0" href="tel:\${esc(r.phone)}">Call</a><a class="cta ghost" style="height:44px;font-size:15px;font-family:var(--body);letter-spacing:0" href="sms:\${esc(r.phone)}">Text</a>\`
        : \`<a class="cta ghost" style="height:44px;font-size:15px;font-family:var(--body);letter-spacing:0;grid-column:span 2" href="mailto:\${esc(r.email)}?subject=\${encodeURIComponent(l.title)}">Email \${esc(r.name.split(' ')[0])}</a>\`}
      </div>
    </div>
    <div class="card" style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;justify-content:space-between;align-items:center"><span style="font-family:var(--head);font-size:16px;letter-spacing:.06em">INVOICE</span><span class="qb">QuickBooks</span></div>
      <div class="inv-row"><span>\${esc(l.title)}</span><span>\${money(l.price)}</span></div>
      <div class="inv-row"><label for="dAmt">Delivery &amp; install</label><input class="money" id="dAmt" inputmode="decimal" value="\${r.delivery || 0}" \${r.status !== 'new' ? 'disabled' : ''}></div>
      <div class="inv-row muted" style="font-size:14px"><span>HST (\${Math.round(t.rate * 100)}%)</span><span id="iTax">\${money(t.tax)}</span></div>
      <div class="line"></div>
      <div class="inv-row" style="font-size:18px;font-weight:700"><span>Total</span><span id="iTot">\${money(t.tot)}</span></div>
      <span class="muted" style="line-height:1.5">\${r.invoice ? \`Invoice #\${esc(r.invoice.docNumber || r.invoice.invoiceId)} \xB7 \${r.invoice.sent ? 'emailed to ' + esc(r.email) : 'created'}\` : 'Goes out from your QuickBooks with a \u201CPay now\u201D link (card or bank). Your accountant sees it like any other invoice.'}</span>
    </div>
    \${r.status === 'sent' ? \`<div class="ok"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7FD8A0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg><div><div style="font-weight:600">Invoice sent</div><div style="font-size:13px">Listing shows \u201CPending\u201D on the website.</div></div></div>\` : ''}
    \${r.status === 'paid' ? \`<div class="ok"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7FD8A0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg><div><div style="font-weight:600">Paid</div><div style="font-size:13px">Listing marked sold.</div></div></div>\` : ''}
    \${r.status === 'new' && !qbOk ? \`<div class="card muted" style="line-height:1.5">QuickBooks isn\u2019t connected yet. Go to <strong>Settings \u2192 Connect QuickBooks</strong> once, then invoices go out with one tap.</div>\` : ''}\`;
  const d = $('#dAmt');
  if (d && r.status === 'new') d.addEventListener('input', () => {
    r.delivery = parseFloat(d.value.replace(/[^0-9.]/g, '')) || 0;
    const t2 = totals(l, r); $('#iTax').textContent = money(t2.tax); $('#iTot').textContent = money(t2.tot);
  });
  const a = $('#invActions');
  if (r.status === 'new') a.innerHTML = \`<button class="cta" id="sendInv">SEND QUICKBOOKS INVOICE</button><button class="cta ghost" id="dismissReq" style="margin-top:10px;height:44px;font-size:15px">NOT INTERESTED \u2014 HIDE</button>\`;
  else if (r.status === 'sent') a.innerHTML = \`<button class="cta" id="checkPaid">CHECK IF PAID</button><button class="cta ghost" id="markPaid" style="margin-top:10px;height:44px;font-size:15px">PAID ANOTHER WAY</button>\`;
  else a.innerHTML = \`<button class="cta ghost" data-go="req">BACK TO REQUESTS</button>\`;
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
      toast('Invoice sent', \`\${r.name} got a pay-online link by email.\`);
    }
    if (id === 'checkPaid') {
      const out = await api('/api/requests/' + r.id + '/refresh', { method: 'POST' });
      Object.assign(r, out.request); mergeListing(out.listing);
      toast(r.status === 'paid' ? 'Paid!' : 'Not paid yet', r.status === 'paid' ? 'Recorded in QuickBooks. Listing marked sold.' : \`Still owing \${money(out.balance)}.\`);
    }
    if (id === 'markPaid') {
      const out = await api('/api/requests/' + r.id + '/paid', { method: 'POST' });
      Object.assign(r, out.request); mergeListing(out.listing); toast('Marked paid', 'Listing marked sold.');
    }
    renderReq(); renderInv();
  } catch (err) { toast('Didn\u2019t work', err.message); btn.disabled = false; btn.textContent = label; }
});
function mergeListing(n) { if (!n) return; const i = S.listings.findIndex(x => x.id === n.id); if (i >= 0) S.listings[i] = n; }

// ---------- settings
async function loadStatus(check) { try { S.status = await api('/api/status' + (check ? '?check=1' : '')); } catch {} return S.status; }
async function renderMore(check) {
  $('#moreWrap').innerHTML = '<div class="empty">Checking connections\u2026</div>';
  const s = await loadStatus(check);
  if (!s) { $('#moreWrap').innerHTML = '<div class="empty err">Couldn\u2019t reach the server.</div>'; return; }
  const w = s.wix, q = s.qb;
  const wixLine = w.mode !== 'wix' ? ['w', 'Test mode \u2014 listings show on the app\u2019s own shop page, not Wix yet'] : w.error ? ['w', 'Wix connection problem: ' + w.error] : w.ready ? ['g', 'Connected to your Wix store' + (w.catalogVersion ? ' (' + w.catalogVersion.replace('_CATALOG', '') + ')' : '')] : ['w', 'Wix key not set up yet'];
  $('#moreWrap').innerHTML = \`
    <div class="card" style="display:flex;flex-direction:column;gap:10px">
      <div style="font-family:var(--head);letter-spacing:.06em">WEBSITE</div>
      <div><span class="dot \${wixLine[0]}"></span>\${esc(wixLine[1])}</div>
      <a class="cta ghost" style="height:44px;font-size:15px" href="\${esc(s.shopUrl)}" target="_blank" rel="noopener">OPEN SHOP PAGE</a>
    </div>
    <div class="card" style="display:flex;flex-direction:column;gap:10px">
      <div style="font-family:var(--head);letter-spacing:.06em">QUICKBOOKS</div>
      <div><span class="dot \${q.connected ? 'g' : 'w'}"></span>\${q.connected ? 'Connected \u2014 invoices go out from your QuickBooks' : q.configured ? 'Not connected yet' : 'QuickBooks app keys not set up yet'}</div>
      \${q.configured ? (q.connected ? \`<button class="cta ghost" id="qbOff" style="height:44px;font-size:15px">DISCONNECT</button>\` : \`<a class="cta" href="/qb/connect?t=\${encodeURIComponent(TOKEN)}">CONNECT QUICKBOOKS</a>\`) : ''}
    </div>
    <div class="card" style="display:flex;flex-direction:column;gap:10px">
      <div style="font-family:var(--head);letter-spacing:.06em">WRITE IT FOR ME</div>
      <div><span class="dot \${s.ai ? 'g' : 'w'}"></span>\${s.ai ? 'AI descriptions on' : 'Using a simple template (AI key not set)'}</div>
    </div>
    <div class="card" style="display:flex;flex-direction:column;gap:10px">
      <div style="font-family:var(--head);letter-spacing:.06em">THIS PHONE</div>
      <div class="muted" style="line-height:1.5">On iPhone: Share \u2192 <strong>Add to Home Screen</strong> to open this like an app.</div>
      <button class="cta ghost" id="logoutBtn" style="height:44px;font-size:15px">SIGN OUT</button>
    </div>\`;
}
document.addEventListener('click', async e => {
  if (e.target.closest('#logoutBtn')) logout();
  if (e.target.closest('#qbOff')) { await api('/api/qb/disconnect', { method: 'POST' }); renderMore(); }
});

// ---------- sheet & toast
function openSheet(html) { $('#sheetBody').innerHTML = html; $('#scrim').classList.add('on'); $('#sheet').classList.add('on'); }
function closeSheet() { $('#scrim').classList.remove('on'); $('#sheet').classList.remove('on'); }
$('#scrim').addEventListener('click', closeSheet);
$('.grab').addEventListener('click', closeSheet);
let tt;
function toast(title, sub) {
  const t = $('#toast');
  t.innerHTML = \`<div style="min-width:0"><div style="font-weight:600;font-size:15px">\${esc(title)}</div><div class="muted" style="overflow:hidden;text-overflow:ellipsis">\${esc(sub || '')}</div></div>\`;
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
`},"/index.html":{t:"text/html; charset=utf-8",b64:!1,d:`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="FES Sell">
<meta name="theme-color" content="#0E0E0E">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/icons/icon-180.png">
<link rel="icon" href="/icons/icon-192.png">
<title>FES Sell</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600&family=Inter:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/app.css">
</head>
<body>
<div class="app" id="app">

  <!-- LOGIN -->
  <section class="screen" id="s-login">
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:32px 28px;gap:18px">
      <div class="brand">FITNESS EQUIPMENT SOLUTIONS</div>
      <h1 style="font-size:40px">SELL</h1>
      <p class="muted" style="font-size:15px;margin:0">Enter your PIN to open the app. You only do this once on this phone.</p>
      <form id="loginForm" style="display:flex;flex-direction:column;gap:14px">
        <label class="lab" for="pin" style="margin:0">PIN</label>
        <input class="field" id="pin" inputmode="numeric" autocomplete="one-time-code" type="password" style="font-size:22px;letter-spacing:.3em">
        <button class="cta" id="loginBtn">OPEN</button>
      </form>
    </div>
  </section>

  <!-- SELL -->
  <section class="screen" id="s-sell">
    <header class="top">
      <div><div class="brand">FITNESS EQUIPMENT SOLUTIONS</div><h1>NEW LISTING</h1></div>
      <button class="icon-btn" id="clearSell" aria-label="Clear this listing"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </header>
    <div class="pad">
      <div class="photos" id="photos">
        <label class="shoot" for="cam">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="4"/></svg>
          <span id="shootLbl">TAKE PHOTOS</span>
        </label>
        <input id="cam" type="file" accept="image/*" multiple class="hidden">
        <div id="thumbs" class="thumbs"></div>
      </div>
      <div><label class="lab" for="fTitle">Title</label><input class="field" id="fTitle" placeholder="e.g. Precor EFX 835 Elliptical" autocomplete="off" maxlength="80"></div>
      <div><span class="lab">Condition</span>
        <div class="seg" data-group="cond"><button class="chip" data-v="New">New</button><button class="chip on" data-v="Certified pre-owned">Certified pre-owned</button></div></div>
      <div><span class="lab">Category</span>
        <div class="chips" data-group="cat"><button class="chip on" data-v="Cardio">Cardio</button><button class="chip" data-v="Strength">Strength</button><button class="chip" data-v="Recovery">Recovery</button></div></div>
      <div class="grid2">
        <div><label class="lab" for="fPrice">Price</label><input class="field" id="fPrice" inputmode="decimal" placeholder="$0"></div>
        <div><label class="lab" for="fPay">How buyers pay</label>
          <select class="field" id="fPay"><option>Invoice</option><option>Buy now</option><option>Both</option></select></div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <label class="lab" for="fDesc" style="margin:0">Description</label>
          <button class="ai" id="aiBtn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/></svg><span>Write it for me</span></button>
        </div>
        <textarea class="field" id="fDesc" placeholder="Type it, dictate it, or tap \u201CWrite it for me\u201D."></textarea>
      </div>
    </div>
    <div style="flex:1"></div>
    <div class="cta-wrap"><button class="cta" id="postBtn">POST TO WEBSITE</button></div>
  </section>

  <!-- LISTINGS -->
  <section class="screen" id="s-list">
    <header class="top" style="flex-direction:column;align-items:stretch;gap:14px">
      <div><div class="brand">FITNESS EQUIPMENT SOLUTIONS</div><h1>MY LISTINGS</h1></div>
      <div class="chips" id="filters"></div>
    </header>
    <div class="pad" id="listWrap" style="gap:10px"></div>
  </section>

  <!-- REQUESTS -->
  <section class="screen" id="s-req">
    <header class="top"><div><div class="brand">FITNESS EQUIPMENT SOLUTIONS</div><h1>REQUESTS</h1></div>
      <button class="icon-btn" id="reqRefresh" aria-label="Refresh requests"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/></svg></button></header>
    <div class="pad" id="reqWrap" style="gap:10px"></div>
  </section>

  <!-- INVOICE -->
  <section class="screen" id="s-inv">
    <header class="top" style="justify-content:flex-start">
      <button class="icon-btn" data-go="req" aria-label="Back to requests"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>
      <div style="min-width:0"><div class="brand">BUYER REQUEST</div><h1 id="invTitle" style="font-size:24px">\u2014</h1></div>
    </header>
    <div class="pad" id="invWrap" style="gap:14px"></div>
    <div style="flex:1"></div>
    <div class="cta-wrap" id="invActions"></div>
  </section>

  <!-- SETTINGS -->
  <section class="screen" id="s-more">
    <header class="top"><div><div class="brand">FITNESS EQUIPMENT SOLUTIONS</div><h1>SETTINGS</h1></div></header>
    <div class="pad" id="moreWrap" style="gap:12px"></div>
  </section>

  <nav class="tabs hidden" id="tabs">
    <button data-go="sell"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>Sell</button>
    <button data-go="list"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h10M7 17h6"/></svg>Listings</button>
    <button data-go="req"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 5h16v11H8l-4 4z"/></svg>Requests<span class="badge hidden" id="reqBadge">0</span></button>
    <button data-go="more"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>Settings</button>
  </nav>

  <div class="scrim" id="scrim"></div>
  <div class="sheet" id="sheet"><button class="grab" aria-label="Close"></button><div id="sheetBody"></div></div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
</div>
<script src="/app.js"></script>
</body>
</html>
`},"/manifest.webmanifest":{t:"application/manifest+json",b64:!1,d:`{
  "name": "FES Sell",
  "short_name": "FES Sell",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0E0E0E",
  "theme_color": "#0E0E0E",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
`},"/icons/icon-180.png":{t:"image/png",b64:!0,d:"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"},"/icons/icon-192.png":{t:"image/png",b64:!0,d:"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"},"/icons/icon-512.png":{t:"image/png",b64:!0,d:"iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAIAAAB7GkOtAAAbCUlEQVR4Xu3dCZCedZ3g8fftu3N07pCDI4RAOEMSSYCBDYMOY3SFIroJoqOocZ2CYYQdZmuscbRmlFWUVWEHl3IVdapAwVGQdZVEd0XOYLiRIJgOCeTohNyh050+361OdAYh6X7f5z37/X0+laKoSvfzPu+b///5Psf7Pm+6paUlBUA8NfGeMgADBAAgKAEACEoAAIISAICgBAAgKAEACEoAAIISAICgBAAgKAEACEoAAIISAICgBAAgKAEACEoAAIISAICgBAAgKAEACEoAAIISAICgBAAgKAEACEoAAIISAICgBAAgKAEACEoAAIISAICgBAAgKAEACEoAAIISAICgBAAgKAEACEoAAIISAICgBAAgKAEACEoAAIISAICgBAAgKAEACEoAAIISAICgBAAgKAEACEoAAIISAICgBAAgKAEACEoAAIISAICgBAAgKAEACEoAAIISAICgBAAgKAEACEoAAIISAICgBAAgKAEACEoAAIISAICgBAAgKAEACEoAAIISAICgBAAgKAEACEoAAIISAICgBAAgKAEACEoAAIISAICgBAAgKAEACEoAAIKqC/q8K1vbD2ZU9gpCElOXbUjyaxRNuqWlpWgLJys294QlCeUlAOVhow9vIgalJwAlZbsPQ1KCkhGAErHph5zIQAkIQHHZ7kOelKB4BKBYbPqhgGSgGASg8Gz6oUhkoLAEoJBs+qEEZKBQfBK4YGz9oTTMtUJxBFAAhiOUhUOBPDkCyJetP5SL2ZcnRwB5KdL4s19DVTJfKo0AJFTYoWyLT0AmUdkJQBKFGri2+5BKmVBlIwA5y3/rb7sPh2VylZgA5CbPAWrTD0Myy0pGAHKQz7i06YecmG4lIADZSjwcbfohMfOuqAQgK8lGoU0/FIQJWCQ+CDY0gw/KK9m+VLKZG4ojgCEkGEPJBiswJPOxsBwBDMZog4qSYO8qwSyOQwCOKMG4STA6gZwkmGUJ5nIQdUGeZ7ElGJRAMoemm816/hwBHF5OY8vWH0ovp3mX04yOQwAOI6exktMoBAoop9mX07wOQgDeLKdRktP4AwoupzmY0+yOQACSy2nkAUViJiYmAH/EDgJUN3P8jQTg3+U0Mux0QOXIaT7mNNOrmwAkkdNoA0rArExAAH4v+50C4wwqU/ZzM/v5Xt0EACAoARiQ/e5A9rsYQOllP0Ozn/VVTABykP3YAsrFPM2eANgRgKAcBAhAtuxWwHBhtmZJAACCih6ALI8B7VDA8JLlnM1yC1CtogcAIKzQAcgy/lnuSgAVJcuZm+V2oCqFDgBAZAIwhCx3IoAKZP4OLm4AIh/3AW8UdmsQNwAAwQnAYBw/wnBnFg9CAACCChqAsKf8gMOKuU0IGoBsOHKE6mAuH4kAAAQlAABBCQBAUAIAEFTEAGRzud9VI6gm2czobLYMVSZiAABIpQQAICpHAABBCQBAUAIAEJQAAAQlAABBCQBAUAIAEJQAAAQlAABBCQBAUAIAEJQAAAQlAABBCQBAUAIAEJQAAAQlAABBCQBAUAIAEJQAAAQlAABBCQBAUAIAEJQAAAQlAABBCQBAUAIAEJQAAAQlAABBCQBAUAIAEJQAAAQlAABBCQBAUAIAEJQAAAQlAABBCQBAUAIAEJQAAAQlAABBCQBAUAIAEJQAAAQlAABBCQBAUAIAEJQAAAQlAABBCQBAUAIAEFRd0OcNVWF0c83sY+pnH9Nw4vT6qRNqJ48d+DN6RE1jfbqxPl1fl+7uyRzoHvjT0dV/6H/aD/Rv29W3ZVff1l29W3f1bdk58N8de/v6M1XxipALAYBhpr4ufcGcpkVnNP/JaU2nHNdQkx5s/Zsa0k0Nh36idpCf6+7JrN/a27qlp3Vzz4sbu5/f0L2+raevf5i9MuRKAIa373/6qD89s3lYPIf5V25q29mbbFWDPM0hLZjd+P4LR7/n7BEtIwt88rahPn3wSKL+39bhQHfmhVe6n27tempt15Nru17ZlvDfjkomADAM/PnbRlx96ZgFsxtLtq5NDen5JzbOP7Fx+bsGHnP73r5VLxx4dM2BVS8c+N2mnpKtBkUlAFDRTpxe/4XlE84/vam8azlpTO0l54685NyRqVReB3NUFAGACpVOp666ZMzfvX9sfe2gp/khKQGAStQyouaWv5540dtGVOLKUS0EACrOuNE1d356ypyZDRW3ZlQXAYDK0jKy5u5/nHLyMbb+FF2B30wG5KO2JvW/rp1k609pCABUkE9dPu6CYfLBDqqAAEClmDOz4cqLx1TK2hCAAEBFSKdT//0vJ9aakZSQ4QYVYfGCEWcc78IvJSUAUBE+ucTJH0rN20Ch/E4/vmHuCQW4z09PX+bptV2P/bbrlW09r2zr3byjt6Mr09mV6ezOpFO/vzPo+JaayWNrJ42tPX5K/axpA39mH1NfX+fDxhEJAJTfkvMG7rGTj+fXd9/6k70rn+jcf+CIN3Hu6cy83jlwW7eXNv7R3dzq69Knz2iYe0LD2ac0nX9604SWwW4cTTURACi//3h28gDsP9D/X7+x855H9id+Gj29madbu55u7frOytfT6dSpxzVceGbzuxaOmDerMe3AoKoJQGhX3rz9x3lsOIaLCn+aU8bVHndUwpm4b3//e/6hbe3mgt2fOZNJrdnQvWZD9y337p0yrnbxwhFLF42af2IBTk9RgRIOO6BQFpyc/FbP1966o4Bb/zfZurvvuytf/+7K12dOrV92waj3XzjqqHHODlUV7wKCMjvtuITv/nzu5e77VneUYO1fbuu54c7dZ1216RNf277qhQOZjK8PrhKOAKDMjk16/ueHD7aXctV7+zI/WbX/J6uSX2yg0jgCgDI7dnLC/bDfvtpd5lVnmBMAKLPxoxNOw627+8q86gxzCUceUCgjGhNOw8Z6b9IkLwlHHlAozQ0Jt+Mzkl48gEMEAIarxQt8YzB5EQAos87uhO+qvPS8kaccm/AtpOAIAMpvkLv3DK6uNv2t6yZNnZDwTUTgCADKbMvO5G/mmTm1fsUXp15ybvJbCRGZAECZbdrem88aTB5b+43/MunnX5q27IJRzY0JrycTkwBAmb1QiM9znXF8w81/NXHNt4799t9OXnbBqGMmOS/E0IwSKLNn1xXsA73Njel3LRzxroUD7w7asrP31y92Pb124D7Pv1nf3dWT8FIzVUwAQrv1mkm3XjOpqC9Bd0/muA++UtSHGFKFP82nW7vaO/tHNRf4cHzahLol59Ud+qqZnr7Mb1/peepgDJ5q7Vq3pcf93EilBADKrac3c/8znRcX80JufW16zsyGOTMbPvLO0alUal9H/zPrup54qevxl7qeWtu1r+OIXyJGdXMEAOX3rw/uL2oA3qRlRM2iM5oXndGcSqX6M6ln13U98Gzn/c8eeOKlA/1OFEUiAFB+/++pjo3be8ty5bYmnZo3q3HerMZr3zfwdcE/+3XHvY/uX/XCgfK/KBRfgU87Agn0Z1I3/WhPgl8srEljaq/489F3/+OUR26eftUlY8aOsn2ocv6BoSLc9av2yrm//8yp9Z/5i3FP/M+jP/MX4yaO8TWQVUsAoCL09ac++fUdPX0VdA5+ZFPNVZeMefR/TL/y4jH1tT5iVoUEACrF8+u7P3/77kpZmz8Y3Vzz2Q+NW/mlqScf48Zz1UYAoIJ886f7vr1iXwWt0B+ccmzDihumLrtgVAWuG4kJAFSWf/jOru+sfL2y1umgxvr0zX818ZolYypw3UhGAKCyZDKpv79t53+7Y3dfRX4861OXj/vP726prJeMpAQAKtEt9+5d9vmtm3fkdaPQIvmnK8ZfOHfgQ2QMdwIAFerRNQcu+Jst3/zpvt5KemtQKpVKp1M3XTVxQou3hw57AgCVa/+B/s/+y64L/mbLjx/ZX1E3aZg8tvbvLhtbuS8c2REAqHQvt/VcefP286/Z/O0V+9o7K+XKwAfeMfqEafWV/toxKAGA4WH91p5Pf3vXmZ/YePU/7/jVs51lPy9UW5P6+LtcDR7e3AwutCtv3v7jR/ZX/UtQTU+zoyvzo4faf/RQe8vImrfPbf6z+c3nndY8ZXx5Tsf/p0UjP3f7rs6uCvr0MjkRABiW9u3v//Ej+w/1e8ZRdeec2nT2yU0LT26cObV0p2VGNQ/cVnrlEx3D8hXEF8JAFdiwrXfDtvY7729PpVITWmoXntx4KAanH99Q7Hv4XPQ2ARjGHAFAVdm5r+++1R33rR7YK29uTM+bNRCDs08Z+G9TQ+Fv6Pa2kxqr6uULRgCganV2ZR5dc+DRNQPf7tJQnz73lKZ3LhjxnnNGTCrcHZ5PnN7Q3Jh2GWCY8i4gCKG7J/PAc51/f9vOeX+58SNffu1QFfJXW5M6bnLprjpQWAIAsfT1p1Y+0fG+f9r6/uu3bdxegFtNTJtYnvcgkT8BgKAeeK5z8afa1m7uyfP5Tx4rAMOVAEBcu17v++AXth3ozuuN/M1FuLZMaQgAhLZxe+9t9+X1FTRNDTYjw5V/OYju3kfz+jR4X0Xdpo5cCABE9/yG7nzOAnXmdwaJMhIAiC6TSe3Y25f4VfAhgOFLAICB73hJbO/+SrlDNbkSACizhSc33fLXE086umwfp6pJp44al/ytnJsK8WECykIAoMzqalPv+w+jfvWV6bddN3nOzIbSr828WY11tckPAQRg+HIvIKgI6XTq3WePePfZIx5/qeu2+/b97NcdPaX6KuAPvGN04pdgx96+1yvmS8rIlQBAZVkwu3HB7Enbdvfd/n9f/9cH21/ZVoC7NQxi4clNl/3pqMQvwVOtXYl/l7JzCggq0VHjaq9bOvaxfz763s9N+eA7Ro8ZWZSpetLR9d+4dlJtHst+aq0ADGOOAKh+t14z6dZrJpXseX70xtdWPF6wL8laOPDVLk03fHz8r1/sWvl4x8onOl59rQDHBOl06tI/GfnlT0wY1ZzH5j+VeuT5wtxVlLIQABgG6mrT553WdN5pTZ/7yPgN23ofe+HAqhcOrH7xwCuv9WZyvJHPiMb0n80f8cklY06bke8F5627+p50BDCcCQAMMzOOqptx1Kj3Xzhw4r69s//FjT0vvtr9cltv267eLTv7tu3u3X8gc6A709nVX5NOj2hKj2iqmdBSc8LU+hOm1Z91UuN5pzU11Cd/z88b/Z9f7881P1QUAYBhbFRzzVknNZ5Vju9lzGRS//Lz14fxa0fKRWAgkZ8/2dGa93cJUF55Xf8BYurPpL76wz0xn3s1EQAgZ99due+5l7tz/jUqjAAAudm0vfeG79v9rwYCAOSgsyvzkS+/5vYP1UEAgGz19mWuvmX7mlec/KkS3gYKZKWnN/OJr20v4IecKTsBAIa2fW/flTdtf2SNGz9UFaeAoMxeeKX7az/a83JbT5nX48geeLbzHX+7xda/+jgCgDLb097/5bv2fPmuPacf33DJuSMXLxhx4vSyfTvYm2zc3nv97bv/96r9ZX6NKA4BgErx/Pru59d3f+F7u487qu6i+SPeMb/57JObmhsLc9+eXK3d3HPbffu+f397d0+Od5tj+BAAqDivbOv91n37vnXfvvra9LwTB27fds6pjXNPaGwZUfRztnva+3/+ZMfdD+9/8LlON3qreumWlpaqf5Jv0vaDGUM+5anLNgz5M1BK6XTqhGn1c09onDOzYfYx9SdNb5gyPvk3ub9RZ1fm6daux1/qemRN56oXunpL9VWUJWbiv5UjABgeMplU6+ae1s09P3zw9ys8urlm5rT6oyfWTp9YN31i3VHjaseNrhk3qnbsqJqRTemGuoE/dXUDZ5C6ezLdvZnunszrnf079vbv3Ne3fU/fhm29L7f1tG7p2bC1t1o3+gxOAGC4er2z/9l1Xc+uG67rT9kV/ZQiAJVJAACCEgCAoAQAICgBAAhKAACCEgCAoAQAICgBAAhKAACCEgCAoAQAICgBAAhKAACCEgCAoAQAICgBAAhKAACCEgCAoAQAICgBAAhKAACCEgCAoAQAICgBAAhKAACCEgCAoAQAICgBAAhKAACCEgCAoAQAICgBAAhKAACCqgv6vCmV2traRYsWLVy4cN68eccee2zLQalUqrOzs6OjY8eOHW1tbVu2bGltbX3ppZdefPHF7du3l2rVIDoBoFgaGhquvPLKK664YurUqW99jPr6+paWlilTppx++ulv/NuNGzc+/vjjd95550MPPTTImv30pz+dP39+nqv+zW9+87Of/exbF3KkhW/atGnBggWJH7RIi4XEBICiOO20077+9a/Pnj0716Ufc9DOnTsHDwCQPwGg8E499dS777770KkeoGK5CEyBjR49+o477rD1h8onABTY1VdfPWXKlAIvFCgCp4AopIaGhuXLlx92ifv27bv99tt/+ctftra27tmzJ5PJjB8/fuLEiWeeeeZZZ511/vnnH3300YVcFWAoAkAhnXvuuSNHjnzrEtva2i655JJNmza98a+2HvT888/fcccd6XR6wYIFS5YsWbp06WGXkKU836gDoQgAhXT22WcfdnE33njjm7b+b5LJZFYfdMMNN3z84x/v6+sr5GoBhyMAFNLkyZMPu7hnnnkmy4fZu3fvV77ylSx/GMiHi8AU0rhx4w67uIkTJxbyYYBCEAAKqaur67CLu/zyywv5MEAhCACFtHPnzsMubsmSJV/96lenTZtWyAcD8uMaAIX03HPPHWlxl19++WWXXbZ69eoHH3zwySeffOaZZ/bt21fIxwZyJAAU0kMPPdTX11dbW3vYhdbU1JxzUCo18LafdevWPfXUU48dtH79+oKsx9FHH93W1pbNolasWPHRj340m5+EaiUAFNLWrVvvvffe9773vUMuNJ1Ozzpo2bJlqVTq5Zdfvueee+68887B3y0KFJBrABTY9ddfv2vXrlwXOnPmzOuuu+7RRx/90pe+dKS3EgGFJQAUWFtb2/Lly5Od36+vr//whz/8i1/84owzzijwagFvIQAU3mOPPXbxxRf/5je/Sbbo6dOnf+9733NrICg2AaAofve73y1evPjaa69ds2ZNggeYOHHi5z//+QS/CGTPRWCKpb+//66D5s6de9FFFy1atGju3Ll1ddkOucWLF8+aNau1tTWn9XMzOMhetrMREnvmoBtvvLG5uXn+/PkL/mD06NGDL/PCCy/M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"},"/":{t:"text/html; charset=utf-8",b64:!1,d:`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="FES Sell">
<meta name="theme-color" content="#0E0E0E">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/icons/icon-180.png">
<link rel="icon" href="/icons/icon-192.png">
<title>FES Sell</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600&family=Inter:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/app.css">
</head>
<body>
<div class="app" id="app">

  <!-- LOGIN -->
  <section class="screen" id="s-login">
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:32px 28px;gap:18px">
      <div class="brand">FITNESS EQUIPMENT SOLUTIONS</div>
      <h1 style="font-size:40px">SELL</h1>
      <p class="muted" style="font-size:15px;margin:0">Enter your PIN to open the app. You only do this once on this phone.</p>
      <form id="loginForm" style="display:flex;flex-direction:column;gap:14px">
        <label class="lab" for="pin" style="margin:0">PIN</label>
        <input class="field" id="pin" inputmode="numeric" autocomplete="one-time-code" type="password" style="font-size:22px;letter-spacing:.3em">
        <button class="cta" id="loginBtn">OPEN</button>
      </form>
    </div>
  </section>

  <!-- SELL -->
  <section class="screen" id="s-sell">
    <header class="top">
      <div><div class="brand">FITNESS EQUIPMENT SOLUTIONS</div><h1>NEW LISTING</h1></div>
      <button class="icon-btn" id="clearSell" aria-label="Clear this listing"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </header>
    <div class="pad">
      <div class="photos" id="photos">
        <label class="shoot" for="cam">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="4"/></svg>
          <span id="shootLbl">TAKE PHOTOS</span>
        </label>
        <input id="cam" type="file" accept="image/*" multiple class="hidden">
        <div id="thumbs" class="thumbs"></div>
      </div>
      <div><label class="lab" for="fTitle">Title</label><input class="field" id="fTitle" placeholder="e.g. Precor EFX 835 Elliptical" autocomplete="off" maxlength="80"></div>
      <div><span class="lab">Condition</span>
        <div class="seg" data-group="cond"><button class="chip" data-v="New">New</button><button class="chip on" data-v="Certified pre-owned">Certified pre-owned</button></div></div>
      <div><span class="lab">Category</span>
        <div class="chips" data-group="cat"><button class="chip on" data-v="Cardio">Cardio</button><button class="chip" data-v="Strength">Strength</button><button class="chip" data-v="Recovery">Recovery</button></div></div>
      <div class="grid2">
        <div><label class="lab" for="fPrice">Price</label><input class="field" id="fPrice" inputmode="decimal" placeholder="$0"></div>
        <div><label class="lab" for="fPay">How buyers pay</label>
          <select class="field" id="fPay"><option>Invoice</option><option>Buy now</option><option>Both</option></select></div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <label class="lab" for="fDesc" style="margin:0">Description</label>
          <button class="ai" id="aiBtn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/></svg><span>Write it for me</span></button>
        </div>
        <textarea class="field" id="fDesc" placeholder="Type it, dictate it, or tap \u201CWrite it for me\u201D."></textarea>
      </div>
    </div>
    <div style="flex:1"></div>
    <div class="cta-wrap"><button class="cta" id="postBtn">POST TO WEBSITE</button></div>
  </section>

  <!-- LISTINGS -->
  <section class="screen" id="s-list">
    <header class="top" style="flex-direction:column;align-items:stretch;gap:14px">
      <div><div class="brand">FITNESS EQUIPMENT SOLUTIONS</div><h1>MY LISTINGS</h1></div>
      <div class="chips" id="filters"></div>
    </header>
    <div class="pad" id="listWrap" style="gap:10px"></div>
  </section>

  <!-- REQUESTS -->
  <section class="screen" id="s-req">
    <header class="top"><div><div class="brand">FITNESS EQUIPMENT SOLUTIONS</div><h1>REQUESTS</h1></div>
      <button class="icon-btn" id="reqRefresh" aria-label="Refresh requests"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/></svg></button></header>
    <div class="pad" id="reqWrap" style="gap:10px"></div>
  </section>

  <!-- INVOICE -->
  <section class="screen" id="s-inv">
    <header class="top" style="justify-content:flex-start">
      <button class="icon-btn" data-go="req" aria-label="Back to requests"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>
      <div style="min-width:0"><div class="brand">BUYER REQUEST</div><h1 id="invTitle" style="font-size:24px">\u2014</h1></div>
    </header>
    <div class="pad" id="invWrap" style="gap:14px"></div>
    <div style="flex:1"></div>
    <div class="cta-wrap" id="invActions"></div>
  </section>

  <!-- SETTINGS -->
  <section class="screen" id="s-more">
    <header class="top"><div><div class="brand">FITNESS EQUIPMENT SOLUTIONS</div><h1>SETTINGS</h1></div></header>
    <div class="pad" id="moreWrap" style="gap:12px"></div>
  </section>

  <nav class="tabs hidden" id="tabs">
    <button data-go="sell"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>Sell</button>
    <button data-go="list"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h10M7 17h6"/></svg>Listings</button>
    <button data-go="req"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 5h16v11H8l-4 4z"/></svg>Requests<span class="badge hidden" id="reqBadge">0</span></button>
    <button data-go="more"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>Settings</button>
  </nav>

  <div class="scrim" id="scrim"></div>
  <div class="sheet" id="sheet"><button class="grab" aria-label="Close"></button><div id="sheetBody"></div></div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
</div>
<script src="/app.js"></script>
</body>
</html>
`}};function vt(e){let t=nt[e]||nt["/index.html"],i=t.b64?Uint8Array.from(atob(t.d),n=>n.charCodeAt(0)):t.d;return new Response(i,{headers:{"content-type":t.t,"cache-control":e.startsWith("/icons/")?"public, max-age=86400":"no-cache"}})}export{Ct as default};
