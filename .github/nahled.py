"""Připraví kopii webu pro náhled na GitHub Pages (spouští ho workflow nahled.yml).

Do každé stránky dá noindex, robots.txt vše zakáže a vynechá PHP, .htaccess
a sitemap – ostrý web na dmvision.cz tak nebude mít na Googlu duplicitu.
"""
import re
import shutil
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent
DST = Path(sys.argv[1]).resolve()
SKIP = {".git", ".github", ".gitignore", ".htaccess", ".DS_Store", "odeslat-poptavku.php", "sitemap.xml", DST.name}
ROBOTS = '<meta name="robots" content="noindex, nofollow">'

if DST.exists():
    shutil.rmtree(DST)
for f in SRC.rglob("*"):
    rel = f.relative_to(SRC)
    if f.is_dir() or SKIP & set(rel.parts):
        continue
    out = DST / rel
    out.parent.mkdir(parents=True, exist_ok=True)
    if f.suffix == ".html":
        html = f.read_text(encoding="utf-8")
        html, n = re.subn(r'<meta name="robots"[^>]*>', ROBOTS, html)
        if not n:
            html = html.replace("</head>", f"{ROBOTS}\n</head>", 1)
        out.write_text(html, encoding="utf-8")
    else:
        shutil.copy2(f, out)

(DST / "robots.txt").write_text("User-agent: *\nDisallow: /\n", encoding="utf-8")
(DST / ".nojekyll").write_text("", encoding="utf-8")
print("náhled připraven:", DST)
