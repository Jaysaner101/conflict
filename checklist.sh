#!/usr/bin/env bash
# Completion check. Run before reporting anything as done.
cd "$(dirname "$0")"; fail=0
chk(){ if [ "$2" = "0" ]; then printf "  FAIL  %s\n" "$1"; fail=1; else printf "  ok    %s\n" "$1"; fi }

echo "TEMPLATES"
for t in 404 article blog cart collection index list-collections page password product search; do
  f=$(ls templates/$t.liquid templates/$t.json 2>/dev/null | head -1)
  if [ -z "$f" ]; then chk "$t present" 0; else n=$(wc -l < "$f"); [ "$n" -ge 3 ] && chk "$t ($n lines)" 1 || chk "$t is a stub ($n lines)" 0; fi
done

echo "CUSTOMER TEMPLATES"
for t in account activate_account addresses login order register reset_password; do
  [ -f "templates/customers/$t.liquid" ] && n=$(wc -l < templates/customers/$t.liquid) || n=0
  [ "$n" -ge 3 ] && chk "customers/$t" 1 || chk "customers/$t" 0
done

echo "PAGE TEMPLATES"
for t in custom-and-bulk work show murphy allies; do
  [ -f "templates/page.$t.json" ] && chk "page.$t" 1 || chk "page.$t" 0; done

echo "SECTIONS FROM THE PROTOTYPE"
for s in hero-slider craft two-ways featured-collection four-panel as-seen-on rich-banner work-gallery custom-order steps show-player about-split story-chapters person-hero ally-cards media-strip page-header notice header footer episodes apparel-hero; do
  [ -f "sections/$s.liquid" ] && chk "$s" 1 || chk "$s" 0; done

echo "VALIDITY"
python3 - <<'PY' 2>/dev/null && echo "  ok    all JSON parses" || { echo "  FAIL  JSON"; exit 1; }
import json,glob
for f in glob.glob('templates/*.json')+glob.glob('config/*.json')+glob.glob('locales/*.json'): json.load(open(f))
PY
node --check assets/theme.js >/dev/null 2>&1 && chk "theme.js parses" 1 || chk "theme.js parses" 0
for f in sections/*.liquid; do
  if grep -q '{% schema %}' "$f"; then
    python3 -c "
import sys,json,re
s=open('$f').read()
m=re.search(r'\{%\s*schema\s*%\}(.*?)\{%\s*endschema\s*%\}',s,re.S)
json.loads(m.group(1))" 2>/dev/null || { echo "  FAIL  schema invalid: $f"; fail=1; }
  fi
done
echo "  ok    all section schemas parse"
echo
if node lint.js >/tmp/lint.out 2>&1; then
  echo "  ok    all liquid files parse"
else
  echo "  FAIL  liquid parse errors:"; sed 's/^/        /' /tmp/lint.out; fail=1
fi

# Shopify silently replaces settings_schema.json with [] if it fails validation
# on import, so check the limits it enforces before shipping.
SCHEMA_ERR=$(python3 - <<'PYEOF'
import json
d = json.load(open('config/settings_schema.json'))
errs = []
if not isinstance(d, list) or not d: errs.append('settings_schema.json is empty')
info = d[0] if d else {}
if info.get('name') != 'theme_info': errs.append('first group must be theme_info')
for k, lim in (('theme_name', 25), ('theme_author', 25), ('theme_version', 25)):
    v = info.get(k, '')
    if len(v) > lim: errs.append(f'{k} is {len(v)} chars, max {lim}: "{v}"')
seen = set()
for g in d:
    for st in g.get('settings', []):
        i = st.get('id')
        if i in seen: errs.append(f'duplicate setting id: {i}')
        seen.add(i)
print('; '.join(errs))
PYEOF
)
if [ -z "$SCHEMA_ERR" ]; then
  echo "  ok    settings_schema passes Shopify import limits"
else
  echo "  FAIL  settings_schema: $SCHEMA_ERR"; fail=1
fi

if node doctor.js >/tmp/doctor.out 2>&1; then
  echo "  ok    doctor: no faults ($(grep -c 'warning' /tmp/doctor.out >/dev/null && sed -n 's/.*, \([0-9]*\) warning.*/\1/p' /tmp/doctor.out | tail -1) warnings)"
else
  echo "  FAIL  doctor found faults:"; sed 's/^/        /' /tmp/doctor.out; fail=1
fi

[ "$fail" = "0" ] && echo "RESULT: complete" || echo "RESULT: INCOMPLETE"
exit $fail
