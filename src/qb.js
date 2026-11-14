// QuickBooks Online: one-time "Connect" by Frank (his own Intuit sign-in), then
// create + email invoices with a pay-online link, and check whether they're paid.

const AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';
const TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const apiBase = env => env.QB_API_BASE || (env.QB_ENV === 'sandbox'
  ? 'https://sandbox-quickbooks.api.intuit.com'
  : 'https://quickbooks.api.intuit.com');
const MINOR = 'minorversion=75';

export const qbConfigured = env => !!(env.QB_CLIENT_ID && env.QB_CLIENT_SECRET);

export function connectUrl(env, origin, state) {
  const p = new URLSearchParams({
    client_id: env.QB_CLIENT_ID,
    response_type: 'code',
    scope: 'com.intuit.quickbooks.accounting',
    redirect_uri: `${origin}/qb/callback`,
    state,
  });
  return `${AUTH_URL}?${p}`;
}

async function tokenRequest(env, params) {
  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${env.QB_CLIENT_ID}:${env.QB_CLIENT_SECRET}`),
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams(params),
  });
  if (!r.ok) throw new Error('QuickBooks sign-in failed: ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return r.json();
}

export async function finishConnect(env, origin, code, realmId) {
  const t = await tokenRequest(env, { grant_type: 'authorization_code', code, redirect_uri: `${origin}/qb/callback` });
  await saveTokens(env, { ...t, realmId });
}

async function saveTokens(env, t) {
  const now = Date.now();
  await env.DB.put('qb:tokens', JSON.stringify({
    realmId: t.realmId,
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    access_expires: now + (t.expires_in - 120) * 1000,
  }));
}

async function tokens(env) {
  const t = JSON.parse((await env.DB.get('qb:tokens')) || 'null');
  if (!t) throw new Error('QuickBooks is not connected yet.');
  if (Date.now() < t.access_expires) return t;
  const n = await tokenRequest(env, { grant_type: 'refresh_token', refresh_token: t.refresh_token });
  await saveTokens(env, { ...n, realmId: t.realmId });
  return { ...t, access_token: n.access_token };
}

export async function qbStatus(env) {
  const t = JSON.parse((await env.DB.get('qb:tokens')) || 'null');
  return { configured: qbConfigured(env), connected: !!t };
}

export async function disconnect(env) { await env.DB.delete('qb:tokens'); }

async function qb(env, method, path, body, contentType = 'application/json') {
  const t = await tokens(env);
  const sep = path.includes('?') ? '&' : '?';
  const r = await fetch(`${apiBase(env)}/v3/company/${t.realmId}${path}${sep}${MINOR}`, {
    method,
    headers: { Authorization: `Bearer ${t.access_token}`, Accept: 'application/json', 'Content-Type': contentType },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`QuickBooks ${method} ${path.split('?')[0]} → ${r.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

const q = (env, sql) => qb(env, 'GET', `/query?query=${encodeURIComponent(sql)}`);
const sqlStr = s => String(s).replace(/'/g, "\\'");

async function findOrCreateCustomer(env, { name, email, phone }) {
  if (email) {
    const j = await q(env, `select * from Customer where PrimaryEmailAddr = '${sqlStr(email)}'`);
    if (j.QueryResponse?.Customer?.length) return j.QueryResponse.Customer[0];
  }
  // QuickBooks needs unique display names; add the email if the name is taken by someone else.
  let display = name.slice(0, 100);
  const byName = await q(env, `select * from Customer where DisplayName = '${sqlStr(display)}'`);
  if (byName.QueryResponse?.Customer?.length) display = `${name} (${email || Date.now().toString(36)})`.slice(0, 100);
  const body = { DisplayName: display };
  if (email) body.PrimaryEmailAddr = { Address: email };
  if (phone) body.PrimaryPhone = { FreeFormNumber: phone };
  return (await qb(env, 'POST', '/customer', body)).Customer;
}

async function equipmentItem(env) {
  const cached = await env.DB.get('qb:itemId');
  if (cached) return cached;
  const name = env.QB_ITEM_NAME || 'Fitness Equipment';
  const found = await q(env, `select * from Item where Name = '${sqlStr(name)}'`);
  let item = found.QueryResponse?.Item?.[0];
  if (!item) {
    const acct = await q(env, `select * from Account where AccountType = 'Income' maxresults 1`);
    const income = acct.QueryResponse?.Account?.[0];
    if (!income) throw new Error('No income account found in QuickBooks.');
    item = (await qb(env, 'POST', '/item', { Name: name, Type: 'NonInventory', IncomeAccountRef: { value: income.Id } })).Item;
  }
  await env.DB.put('qb:itemId', item.Id);
  return item.Id;
}

async function taxCodeId(env) {
  const name = env.QB_TAX_CODE_NAME;
  if (!name) return null;
  const cached = await env.DB.get('qb:taxCode:' + name);
  if (cached) return cached;
  const j = await q(env, `select * from TaxCode where Name = '${sqlStr(name)}'`);
  const id = j.QueryResponse?.TaxCode?.[0]?.Id || null;
  if (id) await env.DB.put('qb:taxCode:' + name, id);
  return id;
}

// Creates the invoice in Frank's QuickBooks and emails it to the buyer.
export async function createAndSendInvoice(env, { listing, request }) {
  const customer = await findOrCreateCustomer(env, request);
  const itemId = await equipmentItem(env);
  const tax = await taxCodeId(env);
  const line = (amount, desc) => ({
    DetailType: 'SalesItemLineDetail',
    Amount: Number(amount),
    Description: desc,
    SalesItemLineDetail: { ItemRef: { value: itemId }, Qty: 1, UnitPrice: Number(amount), ...(tax ? { TaxCodeRef: { value: tax } } : {}) },
  });
  const lines = [line(listing.price, `${listing.title} (${listing.cond})`)];
  if (Number(request.delivery) > 0) lines.push(line(request.delivery, 'Delivery & installation'));

  const invoice = {
    CustomerRef: { value: customer.Id },
    Line: lines,
    AllowOnlineCreditCardPayment: true,
    AllowOnlineACHPayment: true,
    CustomerMemo: { value: `Thanks for choosing ${env.BUSINESS_NAME}!` },
    PrivateNote: `From the FES Sell app · listing ${listing.id} · request ${request.id}`,
  };
  if (request.email) invoice.BillEmail = { Address: request.email };
  if (tax) invoice.TxnTaxDetail = { TxnTaxCodeRef: { value: tax } };

  const created = (await qb(env, 'POST', '/invoice', invoice)).Invoice;
  let sent = false;
  if (request.email) {
    await qb(env, 'POST', `/invoice/${created.Id}/send?sendTo=${encodeURIComponent(request.email)}`, undefined, 'application/octet-stream');
    sent = true;
  }
  return { invoiceId: created.Id, docNumber: created.DocNumber, total: created.TotalAmt, sent };
}

export async function invoicePaid(env, invoiceId) {
  const inv = (await qb(env, 'GET', `/invoice/${invoiceId}`)).Invoice;
  return { paid: Number(inv.Balance) === 0, balance: Number(inv.Balance), total: Number(inv.TotalAmt) };
}
