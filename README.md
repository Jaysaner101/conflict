# Counter Culture Conflict — Shopify theme

Custom Shopify theme for Murphy's laser engraving store (Omaha, Nebraska),
built by Counter Culture Inc Studios.

## Status

Work in progress. Scaffold only — templates are not yet written, so this is
not yet a valid theme upload.

Done:
- `layout/theme.liquid`
- `sections/header.liquid`, `sections/footer.liquid`, `sections/hero-slider.liquid`
- `config/settings_schema.json` — colours and store facts as theme settings
- `assets/base.css` — ported from the approved prototype

To do:
- `templates/` (index, product, collection, page, cart, 404, search and the rest)
- `assets/theme.js`
- Remaining sections: two-ways, finish pills, four-panel banner, network
  banners, work gallery, Murphy page, custom order tool

## How this reaches the store

Shopify pulls a theme zip from a URL (`themeCreate`), so this repo is the
source. Theme writes are restricted to unpublished themes and publishing is
always done by hand in the Shopify admin.

Products, prices, copy and lead times in the prototype are placeholders and
are not confirmed by the client.
