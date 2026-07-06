# Dynamic — Thank-you page checkout UI extension

A custom block for your Shopify **Thank-you page** (order confirmation), matching
the Dynamic design: a success check, a heading, a made-to-order message, a
3-step "what happens next" list, and a Continue-shopping button. All text and
the button link are editable in the checkout editor — no code changes needed
after it's deployed.

> This is **not** a theme file and does **not** go in the theme editor. A checkout
> UI extension must be deployed as part of a Shopify app using Shopify CLI.

## What you need
- **Node.js 18+** installed
- A **Shopify Partner account** (free): https://partners.shopify.com
- Access to deploy to your store (`dynaeimic.com`)
- Your store already uses Checkout Extensibility ✅ (it does)

## Deploy steps

1. **Install Shopify CLI**
   ```bash
   npm install -g @shopify/cli@latest
   ```

2. **Create an app** (if you don't already have one)
   ```bash
   shopify app init
   ```
   - Choose a name (e.g. `dynamic-store`).
   - Pick "Start with an extension" or the minimal template.
   - `cd` into the new app folder it creates.

3. **Add this extension**
   - Copy the whole `dynamic-thank-you` folder into the app's `extensions/` folder,
     so the path is `extensions/dynamic-thank-you/`.
   - Install deps once from the app root:
     ```bash
     npm install
     ```

4. **Preview it live**
   ```bash
   shopify app dev
   ```
   Follow the URL to preview on your store's checkout. Place a test order to see
   the Thank-you page.

5. **Publish it**
   ```bash
   shopify app deploy
   ```

6. **Turn it on in the checkout editor**
   - Shopify admin → **Settings → Checkout → Customize**.
   - Top-left page dropdown → **Thank you**.
   - Click **Add block** (apps section) → **Dynamic Thank You**.
   - Drag it where you want, then fill in the block settings:
     - **Heading** — e.g. `Thank you for your order`
     - **Message** — your made-to-order note
     - **Button label** — e.g. `Continue shopping`
     - **Button URL** — `https://dynaeimic.com`
   - **Save.**

## Notes
- Colors, fonts, button shape and corner radius come from your checkout
  **branding** (Settings → Checkout → Customize → branding), not this code — so
  set those to the Dynamic look and the block matches automatically.
- To also style the **Order status** page, add a second target
  `purchase.thank-you.block.render` is thank-you only; the order-status page uses
  the same block system — ask if you want it there too and I'll add the target.
