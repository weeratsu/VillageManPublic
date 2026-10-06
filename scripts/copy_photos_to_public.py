# -*- coding: utf-8 -*-
"""
copy_photos_to_public.py
Copy meter photos from the VillageMan app into the VillageManPublic repo so GitHub Pages
can serve them. NO "Export for web" needed any more (Oct 2026).

How it works:
  1. Copies every organized photo under VillageMan/meter-photos/<category>/<year>/ into
     VillageManPublic/meter-photos/<same path>  (the 'inbox' folder is skipped - unsorted).
  2. Copies VillageMan/meter-photos/photo_index.js too. The public page uses it to find the
     photo for each bill (meter no + period), the same way the local app does.
  3. Skips files that are already up to date (same size), so re-running is cheap.

Meter photos show only the meter dial (no personal resident data) - agreed OK to publish.

Usage:
  python copy_photos_to_public.py
"""
import os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))                      # VillageManPublic/scripts/
PUBLIC_DIR = os.path.normpath(os.path.join(HERE, ".."))                # VillageManPublic/
APP_DIR = os.path.normpath(os.path.join(PUBLIC_DIR, "..", "VillageMan"))
SRC_ROOT = os.path.join(APP_DIR, "meter-photos")
DST_ROOT = os.path.join(PUBLIC_DIR, "meter-photos")
PHOTO_EXT = (".jpg", ".jpeg", ".png", ".webp", ".heic")
SKIP_DIRS = {"inbox"}

def copy_if_changed(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if os.path.exists(dst) and os.path.getsize(dst) == os.path.getsize(src):
        return False
    shutil.copy2(src, dst)
    return True

def main():
    if not os.path.isdir(SRC_ROOT):
        print("[!] Photo folder not found:", SRC_ROOT)
        sys.exit(1)
    copied = skipped = 0
    for root, dirs, files in os.walk(SRC_ROOT):
        rel_root = os.path.relpath(root, SRC_ROOT)
        top = rel_root.split(os.sep)[0]
        if top in SKIP_DIRS:
            dirs[:] = []
            continue
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        if rel_root == ".":
            continue                      # top level: only the index (handled below)
        for f in files:
            if not f.lower().endswith(PHOTO_EXT):
                continue
            src = os.path.join(root, f)
            dst = os.path.join(DST_ROOT, rel_root, f)
            if copy_if_changed(src, dst):
                print("  [copied] ", os.path.join(rel_root, f).replace(os.sep, "/"))
                copied += 1
            else:
                skipped += 1
    idx_src = os.path.join(SRC_ROOT, "photo_index.js")
    if os.path.exists(idx_src):
        if copy_if_changed(idx_src, os.path.join(DST_ROOT, "photo_index.js")):
            print("  [copied]  photo_index.js")
    else:
        print("  [!] photo_index.js not found - run the meter-photo organizer first.")
    print("\nDone. photos copied=%d  up-to-date=%d" % (copied, skipped))

if __name__ == "__main__":
    main()
