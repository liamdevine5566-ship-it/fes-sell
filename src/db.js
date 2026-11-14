// Tiny KV-backed store. Fine for one business with hundreds of listings.
export const db = (env) => ({
  async get(key, fallback = null) {
    const v = await env.DB.get(key, 'json');
    return v ?? fallback;
  },
  put(key, value, opts) { return env.DB.put(key, JSON.stringify(value), opts); },
  del(key) { return env.DB.delete(key); },

  async listings() { return (await this.get('listings', [])); },
  saveListings(arr) { return this.put('listings', arr); },
  async listing(id) { return (await this.listings()).find(l => l.id === id) || null; },
  async upsertListing(l) {
    const all = await this.listings();
    const i = all.findIndex(x => x.id === l.id);
    if (i >= 0) all[i] = l; else all.unshift(l);
    await this.saveListings(all);
    return l;
  },
  async removeListing(id) {
    await this.saveListings((await this.listings()).filter(l => l.id !== id));
  },

  async requests() { return (await this.get('requests', [])); },
  saveRequests(arr) { return this.put('requests', arr); },
  async upsertRequest(r) {
    const all = await this.requests();
    const i = all.findIndex(x => x.id === r.id);
    if (i >= 0) all[i] = r; else all.unshift(r);
    await this.saveRequests(all.slice(0, 500));
    return r;
  },
});

export const newId = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12);
