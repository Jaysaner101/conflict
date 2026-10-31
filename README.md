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
| `linkcheck.js` | resolves every internal link, image and video on every rendered page against `store-inventory.json` |
| `serve.js` | static server, started by whichever tool needs it |
| `check-apparel.js` | store data check: every apparel product has sizes, a size guide, the apparel template and the apparel tag |


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
- **plate class with no background image** — the design layers a photograph
  behind every page header and full-bleed band (`.pghd`, `.pl`, `.hs-plate`).
  The prototype set these from a `data-bg` attribute read by its own script;
  that reader was never ported, so the image has to be on the tag. Seven
  hand-written templates — every collection page, search, contact, the generic
  page, the blog, the article and the 404 — shipped with the class and no
  image and rendered as flat black bands. The markup and the CSS were both
  perfectly valid, so nothing else could have caught it.
- **orphan `data-` attribute** — markup emitting a hook nothing reads. Background
  plates rendered flat black because the prototype's reader was never ported.
- Plus: section/template/schema cross-checks, duplicate `id`s, labels pointing at
  nothing, unlabelled inputs, images with no `alt`, incomplete ARIA roles,
  sections that accept blocks but ship none, and unreferenced assets.

Run `node doctor.js` directly for the full report. Failures block the build;
warnings are for a human to judge.

## Apparel

Apparel has its own product template (`product.apparel` → `sections/apparel-product.liquid`),
script (`assets/apparel.js`) and stylesheet (`assets/apparel.css`), loaded only on apparel
pages. The engraving template hands any `apparel`-tagged product to the apparel section, so
engraving copy and the $5 name add-on can never appear on a garment.

Product fields (admin → product → Metafields): **Ships as** (Made to order / In stock),
**Size guide** (pick one), **Garment details** (one fact per line), **The design**, **Drop**.
Size guides live in admin → Content → Size guide, one per blank, inches only; the site
works out centimetres. Option names are matched loosely ("colo" = colour, "size" = size),
so Printful's names work as they arrive.

After Printful publishes a product: tag it `apparel`, set the template to `apparel`, set
the product type (Tee, Hoodie, Work shirt, Cap — the type chips use it), link a size
guide, then run `check-apparel.js`.

Photos: Printful's mockups come on white. Swap them for transparent cut-outs. A tee
with a back print leads with the back (and its sizes point at the back photo), then the
front, so every card in a row looks different and hover shows the other side. A plain
back gets the alt "plain rear" and goes last, so hover shows a side view instead.
Republishing from Printful brings the white mockups back.

The home and show pages carry the apparel band (`apparel-hero` with a collection set):
banner, a ruled "The range" header, then every product in one row.

The range opens with one wide front-and-back card whenever the last row would
otherwise have a hole (5, 8, 11 products at three across; any odd count at two).

## Episode rows (YouTube)

`sections/episodes.liquid` + `assets/episodes.js`: when a row has a playlist and Theme
settings → YouTube has a key (Google Cloud, YouTube Data API v3, restricted to the shop's
web addresses), the row shows the playlist's newest videos, cached an hour per visitor.
The hand-picked episode blocks are the fallback. The Conflict playlist is PLXMvRz65T8SE.

## Deploying single files with themeFilesUpsert

Upsert a section before any template that uses a new setting from it, in a separate
call, and re-read the template afterwards. A template written while the old section is
still in place loses the new settings with no error.

## Store-side facts the theme depends on

- Shipping prices shown on the site come from theme settings → Store facts (engraved US
  and Canada, apparel US and Canada). They must match the shipping rates in Shopify
  admin; change both together. Apparel rates live in the "Printful: Tshirts" profile.

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
- The store is at Shopify's **20-theme limit**. New builds can't be created until old
  themes are deleted in the admin; until then, changed files are pushed into the newest
  theme with `themeFilesUpsert` (URL bodies pinned to a commit), then `verify-store.js`.
- A `range` setting with fewer than three positions makes Shopify drop the whole section
  file, and every template using it, without an error. `doctor.js` fails on it.
- `render.js` mocks Shopify's Liquid with liquidjs. The two engines differ
  (see the `where` bug above), so a clean render is evidence, not proof. The
  storefront is the only authority.
