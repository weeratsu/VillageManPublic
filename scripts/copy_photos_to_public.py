# -*- coding: utf-8 -*-
"""
copy_photos_to_public.py
Copy the meter photos referenced by the public report into the VillageManPublic repo,
so GitHub Pages can serve them.

How it works:
  1. Reads VillageManPublic/villageman_data.js (the snapshot you exported from the app).
  2. For every bill with a "meter_photo_rel" path, copies that file from the main
     VillageMan app folder into VillageManPublic/<same relative path>.
  3. Skips files that are missing or already up to date.

Run it AFTER you press "Export for web" in the app and drop villageman_data.js here,
then commit & push the whole VillageManPublic folder.

Usage:
  python copy_photos_to_public.py
"""
import os, re, json, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))              # VillageManPublic/scripts/
PUBLIC_DIR = os.path.normpath(os.path.join(HERE, ".."))        # VillageManPublic/
APP_DIR = os.path.normpath(os.path.join(PUBLIC_DIR, "..", "VillageMan"))   # sibling of VillageManPublic
DATA_JS = os.path.join(PUBLIC_DIR, "villageman_data.js")

def load_data():
    if not os.path.exists(DATA_JS):
        print("[!] villageman_data.js not found. Press 'Export for web' in the app and put the file here first.")
        sys.exit(1)
    txt = open(DATA_JS, encoding="utf-8").read()
    # strip the "window.VILLAGEMAN_DATA = " prefix and trailing ";"
    m = re.search(r"=\s*(\{.*\})\s*;?\s*$", txt, re.S)
    if not m:
        print("[!] Could not parse villageman_data.js")
        sys.exit(1)
    return json.loads(m.group(1))

def main():
    data = load_data()
    bills = data.get("utility_bills", [])
    rels = []
    for b in bills:
        rp = (b.get("meter_photo_rel") or "").strip()
        if rp:
            rels.append(rp.replace("\\", "/"))
    rels = sorted(set(rels))
    print("Referenced photos:", len(rels))

    copied = skipped = missing = 0
    for rel in rels:
        src = os.path.join(APP_DIR, rel.replace("/", os.sep))
        dst = os.path.join(PUBLIC_DIR, rel.replace("/", os.sep))
        if not os.path.exists(src):
            print("  [missing]", rel)
            missing += 1
            continue
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        if os.path.exists(dst) and os.path.getsize(dst) == os.path.getsize(src):
            skipped += 1
            continue
        shutil.copy2(src, dst)
        print("  [copied] ", rel)
        copied += 1

    print("\nDone. copied=%d  skipped(up-to-date)=%d  missing=%d" % (copied, skipped, missing))
    if missing:
        print("Missing photos just will not show on the public site (the icon still appears but opens an error).")

if __name__ == "__main__":
    main()
