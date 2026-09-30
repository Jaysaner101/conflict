# Counter Culture Conflict — Shopify theme

Custom Online Store 2.0 theme for Murphy's laser engraving store, Omaha,
Nebraska. Design ported from the approved prototype.
Store: `k0uw8n-4v.myshopify.com`.

## Build and deploy

```bash
./checklist.sh     # the gate — must print RESULT: complete and exit 0
./deploy.sh        # zips, commits, pushes; prints a raw GitHub URL
```

Create the theme from that URL with `themeCreate(source:)`, then **verify what
the store actually stored**:

```bash
node verify-store.js store-files.json
```

## Why that last step is not optional

Shopify's theme import does not fail loudly. It validates each file and, when a
file is invalid, **replaces it with an empty value and reports success.**

That happened here. `theme_author` was 27 characters against a 25-character
limit, so every build from v1 to v7 shipped with `config/settings_schema.json`
as `[]` — no colours, no store facts, nothing at all in the theme editor. The
storefront still looked correct, because the values live in `settings_data.json`.
Every local check passed. `processingFailed` was `false`.

The only thing that revealed it was asking the store what it held and diffing
that against the repo.

**A green checklist means the files are well-formed. It does not mean the store
accepted them.** Deploy is not finished until `verify-store.js` is clean.

## Tooling

| script | what it does |
|---|---|
| `checklist.sh` | the gate: templates present, JSON/Liquid/schemas valid, runs `doctor.js`. Exits non-zero on any failure. |
| `doctor.js` | static fault-finder. Every check exists because that exact fault shipped. |
| `lint.js` | parses every Liquid file with the Shopify tags registered |
| `render.js` | renders all 23 templates into `preview/` against mocked Shopify globals |
| `shot.js` | Playwright screenshots, desktop and mobile; reports JS errors and horizontal overflow |
| `audit.js` | layout audit of the rendered pages: empty bands, content stuck at opacity 0 |
| `verify-store.js` | diffs what Shopify stored against this repo |

`shot.js` and `audit.js` need a static server on port 8799:

```bash
cd preview && python3 -m http.server 8799 &
```

## What doctor.js checks, and the bug behind each check

- **settings_schema import limits** — the silent blanking above.
- **`where:` with a dotted path** — Shopify's `where` does `item[property]` and
  cannot walk `'settings.category'`. liquidjs *can*, so it rendered locally and
  returned nothing on the live store. The work gallery was empty for this reason.
- **loop variable reassigned inside its own `for`** — stops iteration after the
  first pass. Cost four of five gallery groups.
- **class used in markup with no CSS rule** — shipped four times: a visible
  "Skip to content" on every page, an invented `.btn2`, `.visually-hidden`
  rendering as body text beside every cart quantity field, and a lightbox whose
  markup and CSS were from different generations, so it had no layout at all.
- **function called but never defined** — `sendForm()` was the only path for
  custom-order quote requests and threw on every submit.
- **`asset_url` target that doesn't exist** — `asset_url` always returns a
  plausible URL, so a missing file cannot fail locally.
- **`settings.x` not declared in settings_schema** — renders blank forever and
  the merchant cannot set it. The favicon was unreachable this way.
- **dead links** (`href=""` or `href="#"`) — every primary CTA on the home page
  went nowhere, because labels were configured without URLs.
- **orphan `data-` attribute** — markup emitting a hook nothing reads. Background
  plates rendered flat black because the prototype's reader was never ported.
- Plus: section/template/schema cross-checks, duplicate `id`s, labels pointing at
  nothing, unlabelled inputs, images with no `alt`, incomplete ARIA roles,
  sections that accept blocks but ship none, and unreferenced assets.

Run `node doctor.js` directly for the full report. Failures block the build;
warnings are for a human to judge.

## Store-side facts the theme depends on

- Smart collections are **tag-driven**: `lids`, `knives`, `drinkware`, `duty`,
  `apparel`. A product's tag is what puts it in a collection.
- `custom.material` is a product metafield, pinned and storefront-readable.
- Menus: `main-menu`, `footer-shop`, `footer` (titled "Footer orders"),
  `footer-about`.
- Videos and photography live in **Files**, not `assets/`, referenced with
  `file_url` or `shopify://shop_images/…`. `assets/` holds only the stylesheet,
  script, fonts, logos and background plates.

## Known limitations

- The store's **base currency cannot be changed through the Admin API** — it is
  set in Settings → General. Prices are stored as plain numbers and are *not*
  converted when the currency changes, so the catalogue's dollar figures read
  correctly the moment the store is switched to USD.
- `themePublish`, `themeDelete` and `themeFilesDelete` are blocked for this
  connector. Publishing and deleting themes are done in the Shopify admin.
- `render.js` mocks Shopify's Liquid with liquidjs. The two engines differ
  (see the `where` bug above), so a clean render is evidence, not proof. The
  storefront is the only authority.
