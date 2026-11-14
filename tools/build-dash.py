"""Builds dist/worker.js: one file for the Cloudflare dashboard editor.
Embeds public/ into the worker and keeps photos in KV (no R2 needed).
Run: python3 tools/build-dash.py  (needs node; uses npx esbuild)"""
import base64, json, os, shutil, subprocess, tempfile
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tmp = tempfile.mkdtemp()
shutil.copytree(os.path.join(root, 'src'), os.path.join(tmp, 'src'))
w = open(os.path.join(tmp, 'src/worker.js')).read()
rep = [
 ("const obj = await env.PHOTOS.get(key);\n        if (!obj) return new Response('Not found', { status: 404 });\n        return new Response(obj.body,",
  "const obj = await env.DB.get('photo:' + key, 'arrayBuffer');\n        if (!obj) return new Response('Not found', { status: 404 });\n        return new Response(obj,"),
 ("await env.PHOTOS.put(key, buf, { httpMetadata: { contentType: 'image/jpeg' } });", "await env.DB.put('photo:' + key, buf);"),
 ("ctx.waitUntil(Promise.all((cur.photos || []).map(k => env.PHOTOS.delete(k))));", "ctx.waitUntil(Promise.all((cur.photos || []).map(k => env.DB.delete('photo:' + k))));"),
 ("        return env.ASSETS.fetch(req);", "        return serveAsset(p);"),
 ("export default {\n  async fetch(req, env, ctx) {",
  "const DEFAULTS = { STORE_MODE: 'local', WIX_SITE_ID: '5bb413e8-a139-4c76-ae34-c36b2e5f6fc1', BUSINESS_NAME: 'Fitness Equipment Solutions', BUSINESS_TOWN: 'Rothesay, NB', SALES_TAX_RATE: '0.15', QB_ENV: 'production', QB_TAX_CODE_NAME: 'HST NB', QB_ITEM_NAME: 'Fitness Equipment', AI_MODEL: 'claude-sonnet-5-5', SITE_URL: 'https://www.fitnessequipmentsolutions.ca' };\nexport default {\n  async fetch(req, rawEnv, ctx) {\n    const env = { ...DEFAULTS, ...rawEnv };\n    if (env.WIX_API_KEY) env.WIX_API_KEY = String(env.WIX_API_KEY).trim();"),
]
for a, b in rep:
    assert a in w, a[:60]
    w = w.replace(a, b)
types = {'.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png'}
assets = {}
pub = os.path.join(root, 'public')
for d, _, files in os.walk(pub):
    for f in files:
        path = os.path.join(d, f); rel = '/' + os.path.relpath(path, pub); ext = os.path.splitext(f)[1]
        data = open(path, 'rb').read()
        assets[rel] = {'t': types[ext], 'b64': ext == '.png', 'd': base64.b64encode(data).decode() if ext == '.png' else data.decode()}
assets['/'] = assets['/index.html']
w += "\nconst ASSETS = %s;\nfunction serveAsset(p) {\n  const a = ASSETS[p] || ASSETS['/index.html'];\n  const body = a.b64 ? Uint8Array.from(atob(a.d), c => c.charCodeAt(0)) : a.d;\n  return new Response(body, { headers: { 'content-type': a.t, 'cache-control': p.startsWith('/icons/') ? 'public, max-age=86400' : 'no-cache' } });\n}\n" % json.dumps(assets)
open(os.path.join(tmp, 'src/worker.js'), 'w').write(w)
os.makedirs(os.path.join(root, 'dist'), exist_ok=True)
subprocess.run(['npx', '-y', 'esbuild', os.path.join(tmp, 'src/worker.js'), '--bundle', '--format=esm', '--platform=neutral', '--minify', '--outfile=' + os.path.join(root, 'dist/worker.js')], check=True)
print('built dist/worker.js', os.path.getsize(os.path.join(root, 'dist/worker.js')), 'bytes')
