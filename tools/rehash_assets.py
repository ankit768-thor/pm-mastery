"""Rename every assets/*.js and assets/*.css to <name>-<content hash>.<ext> and
update references in the HTML pages, so browsers never serve a stale cached copy.

Run after editing anything in assets/:  python3 tools/rehash_assets.py
(Course content lives in content/course.json and needs no rehash.)
"""
import hashlib, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = [p for p in (ROOT / 'index.html', ROOT / 'toolkit.html') if p.exists()]
renames = {}
for f in sorted((ROOT / 'assets').iterdir()):
    if f.suffix not in ('.js', '.css'):
        continue
    base = re.sub(r'-[0-9a-zA-Z_]{8}$', '', f.stem)
    digest = hashlib.sha256(f.read_bytes()).hexdigest()[:8]
    target = f.with_name(f'{base}-{digest}{f.suffix}')
    if target.name != f.name:
        f.rename(target)
        renames[f.name] = target.name
for page in PAGES:
    html = page.read_text(encoding='utf-8')
    for old, new in renames.items():
        html = html.replace(f'assets/{old}', f'assets/{new}')
    page.write_text(html, encoding='utf-8')
for old, new in renames.items():
    print(f'{old} -> {new}')
print(f'{len(renames)} file(s) renamed; updated {", ".join(p.name for p in PAGES)}')
