# Dynaeimic — Customer Account UI Extension (Option B)

This adds **custom pages/tabs into Shopify's native customer account** (the "Orders /
Profile" page). Unlike the theme (which you paste into Online Store → Edit code), an
extension is part of a **Shopify app** and is installed with the **Shopify CLI** — it
cannot be pasted into the theme editor.

> **You need a developer (or comfort with a terminal) for this.** Everything below runs
> on a computer with Node.js installed, using the Shopify CLI. If that's not you, hand
> this whole folder to a Shopify developer — it's a complete starting point.

---

## What you get

- A new item in the customer-account menu (next to **Orders** / **Profile**) that opens a
  custom page — e.g. **"Rewards & Reviews"**.
- The page is built with Shopify's official account-extension components, so it looks
  native and lives *inside* Shopify's hosted account (name/email editing etc. stay native).

## What is realistic to put on it (and what each needs)

| Tab | Feasible in the extension? | What it needs |
|---|---|---|
| **Reviews the customer wrote** | ✅ Yes | Your Firebase, **re-indexed by customer email** (see "Backend note"). |
| **Order tracking / order list** | ✅ Yes | The extension's built-in Order API (no backend). |
| **Wishlist** | ⚠️ Rebuild | The theme stores it in the browser's `localStorage`, which the extension **cannot read**. It must be moved to Firebase (keyed by customer email) to work here. |
| **Saved Designs** | ⚠️ Rebuild | Same as wishlist — must live in Firebase, not `localStorage`. |

### Backend note (important)
The theme keeps wishlist / saved-designs / "my reviews" in the **browser** (`localStorage`).
An extension runs in a **different, sandboxed context** and can't see that data. To show
those tabs natively, that data has to be stored **per customer in Firebase** (e.g.
`/wishlists/<customer-email-hash>`), written both from the theme and read by the extension.
That's the extra backend work Option B implies — it's why Option A was "free" and this isn't.

---

## Prerequisites

1. A **Shopify Partner account** (free): https://partners.shopify.com
2. **Node.js 18+** and **npm** on your computer.
3. The **Shopify CLI**: `npm install -g @shopify/cli @shopify/theme`
4. Your store on **New customer accounts** (Settings → Customer accounts).

## One-time setup

```bash
# 1. From a folder on your computer, create the app (if you don't have one yet):
shopify app init            # choose "Start with Remix" or "none"; name it e.g. dynaeimic-app

# 2. Copy THIS folder into the app's `extensions/` directory, e.g.:
#    dynaeimic-app/extensions/dynaeimic-account-extras/
#    (so this README, shopify.extension.toml, package.json and src/ sit together there)

# 3. Install deps from inside the extension folder:
cd extensions/dynaeimic-account-extras
npm install

# 4. Set your Firebase URL in src/config.js
```

## Run & deploy

```bash
# From the APP root (dynaeimic-app/):
shopify app dev       # live preview against your dev store's customer account
shopify app deploy    # ship it; then install/enable the app on your store
```

After deploy: in the Shopify admin, install your app on the store, and the new menu item
appears in the customer account. If you want it earlier in the menu or renamed, edit
`src/MenuItem.jsx` and the `name` in `shopify.extension.toml`.

---

## Files

- `shopify.extension.toml` — extension config + targets + network permission.
- `src/config.js` — your Firebase URL (edit this).
- `src/MenuItem.jsx` — the menu link that appears in the account nav.
- `src/AccountPage.jsx` — the custom page (starter: greeting + reviews section + TODOs).
- `locales/en.default.json` — labels.

## Status of this starter

This is a **working skeleton** to build on, not a finished feature. The page renders and
fetches from Firebase; the per-customer data model (wishlist/designs/your-reviews indexed by
email) is the remaining work, called out with `TODO` comments. Test with `shopify app dev`
before deploying — component props and API shapes should be verified against the version of
`@shopify/ui-extensions-react` you install (pin `api_version` in the toml to match).

## Docs

- Customer account UI extensions: https://shopify.dev/docs/api/customer-account-ui-extensions
- Targets & components: https://shopify.dev/docs/api/customer-account-ui-extensions/latest
