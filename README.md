# FES Sell — phone app for Fitness Equipment Solutions

Frank's Kijiji-style app for listing equipment on his website and invoicing buyers through QuickBooks.

- **The phone app** (`public/`): Sell, Listings, Requests and Settings, in the same design Frank approved. It installs to the home screen.
- **The server** (`src/`): one Cloudflare Worker. It holds the keys, stores listings and photos, and talks to Wix, QuickBooks and the AI.
- **Buyer pages**: `/want/<id>` is the "I want this" request form, and `/shop` is a simple shop list used in test mode.

## How it works

1. Frank posts a listing (photos, title, price, "Write it for me"). It's saved, and in Wix mode it becomes a real product on his Wix store. Each product description includes an **I WANT THIS** link.
2. A buyer taps the link and fills in their name, email and message. It shows up under **Requests**.
3. Frank adds delivery, then taps **Send QuickBooks invoice**. QuickBooks emails the buyer an invoice with a pay-online link, and the listing shows **Pending**.
4. **Check if paid** reads the invoice from QuickBooks. Once it's paid, the listing becomes **Sold**. **Paid another way** covers cash and e-transfer.

## Modes

- `STORE_MODE = "local"` (the default) keeps listings in the app only and shows them on `/shop`. Use this for testing.
- `STORE_MODE = "wix"` creates, updates and deletes products on Frank's Wix store. It handles both Wix catalog versions, V1 and V3.

## Deploy (one time, about 15 minutes, on your Mac)

```bash
npm install
npx wrangler login                      # opens Cloudflare in the browser (free account is fine)
npx wrangler kv namespace create DB     # copy the id into wrangler.toml (replace REPLACE_WITH_KV_ID)
npx wrangler r2 bucket create fes-sell-photos
npx wrangler secret put APP_PIN         # the PIN Frank types once on his phone
npx wrangler secret put ANTHROPIC_API_KEY   # optional: real AI descriptions (console.anthropic.com)
npx wrangler deploy                     # prints the app's web address
```

Then open the address on Frank's iPhone in Safari, enter the PIN, and tap **Share → Add to Home Screen**.

## Setup sitting with Frank (Wix + QuickBooks)

**Wix**
1. Frank, as owner, opens **manage.wix.com → Account Settings → API Keys → Generate API Key**.
   - Give it permissions for **Wix Stores** (manage products) and **Media Manager**.
2. On your Mac, run `npx wrangler secret put WIX_API_KEY` and paste the key.
3. In `wrangler.toml`, set `STORE_MODE = "wix"`, then run `npx wrangler deploy`.
4. In the app, go to **Settings**. It should say "Connected to your Wix store."
5. Post one test item, check it on fitnessequipmentsolutions.ca, then remove it.

**QuickBooks**
1. At developer.intuit.com, create an app (free) and add the redirect URI `https://<your-app-address>/qb/callback`.
   - Then copy the **production** Client ID and Secret.
2. On your Mac, run `npx wrangler secret put QB_CLIENT_ID` and `npx wrangler secret put QB_CLIENT_SECRET`, then deploy.
3. On Frank's phone, go to **Settings → Connect QuickBooks**. He signs in with his own Intuit login and approves it.
4. In QuickBooks, check:
   - **QuickBooks Payments** is on (needed for the pay-online link).
   - The sales-tax code name matches `QB_TAX_CODE_NAME` (default `HST NB`).
5. Send a test invoice to yourself, then void it.

## Tested

- The full flow ran locally: PIN, photo upload, post, buyer request, invoice and paid → sold, plus edit, mark sold and remove.
- Wix and QuickBooks were tested against a stand-in server that mimics their published APIs.
- The **first real run against Frank's Wix and QuickBooks happens at the setup sitting.** If anything fails, the app shows Wix's or QuickBooks' exact error message.

## Next

- Wrap as a real iPhone app with Capacitor, with push notifications for new requests (needs the Apple Developer account).
- Buy-now checkout for small fixed-price items through Wix, synced to QuickBooks with a connector.

## dist/worker.js

`dist/worker.js` is the whole app in one file (app screens built in, photos kept in KV). It is what runs on Cloudflare, loaded through the dashboard editor.
