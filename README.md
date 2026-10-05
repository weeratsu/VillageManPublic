# VillageManPublic

Public, read-only **Common-area Utility Report** for residents (GitHub Pages).

It shows, per billing period, how the common-area (shared-meter) electricity/water cost
was calculated and totalled - a transparency page for the housing-estate residents.
No personal data (no household names, phones, addresses) is included.

## Folder structure
```
VillageManPublic/
|- index.html             <- the web page (GitHub Pages serves this)
|- villageman_data.js     <- data snapshot (replace this each month)
|- js/
|   \- pubreport.js        <- report code
|- scripts/
|   \- copy_photos_to_public.py   <- copies meter photos into this repo
|- meter-photos/          <- meter photos (filled by the script)
|- images/                <- app icons / favicons
\- README.md
```

## How it works
- `index.html` + `js/pubreport.js` render the report.
- `villageman_data.js` holds a snapshot: `window.VILLAGEMAN_DATA = {meters, utility_bills}`.
  Only billing data is included - never households/vendors/emergency/PromptPay.
- Each bill carries a `meter_photo_rel` path; the matching photo lives under `meter-photos/`.

## Updating each month
1. Open the **VillageMan** app on your PC -> **Common-area Summary** page.
2. Click **"Export for web"** -> downloads `villageman_data.js`.
3. Replace this repo's `villageman_data.js` (at the repo root) with the downloaded file.
4. Double-click **`update_public.bat`** -> copies the referenced meter photos into
   `meter-photos/`, then commits & pushes to GitHub automatically.
   (Or do it by hand: `python scripts/copy_photos_to_public.py` then commit & push.)
5. GitHub Pages updates in ~1 minute.

## Notes
- Meter photos ARE shown here (they are just meter-dial photos, no personal data).
  Invoice / receipt links are omitted (those files stay in a private Google Drive).
- The photo lightbox reads the EXIF capture date when present.
- Dark mode follows the viewer's system preference.
